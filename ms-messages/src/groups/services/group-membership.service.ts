import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Brackets, DataSource, EntityManager, Repository } from 'typeorm';
import { Group } from '../entities/group.entity';
import { GroupMember } from '../entities/group-member.entity';
import { GroupBlockedUser } from '../entities/group-blocked-user.entity';
import { GroupMembershipLog } from '../entities/group-membership-log.entity';
import { GroupMemberRole } from '../enums/group-member-role.enum';
import { GroupVisibility } from '../enums/group-visibility.enum';
import { GroupMembershipAction } from '../enums/group-membership-action.enum';
import { ResponseGroupPublicSummaryDto } from '../dto/response-group-public-summary.dto';
import { ResponseGroupPublicListDto } from '../dto/response-group-public-list.dto';
import { ResponseGroupDetailDto } from '../dto/response-group-detail.dto';
import { ResponseGroupMemberEnrichedDto } from '../dto/response-group-member-enriched.dto';
import { ResponseGroupMemberListDto } from '../dto/response-group-member-list.dto';
import { ResponseMembershipLogDto } from '../dto/response-membership-log.dto';
import { ResponseMembershipLogListDto } from '../dto/response-membership-log-list.dto';
import { GroupSearchQueryDto } from '../dto/group-search-query.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { PaginationMetaDto } from '@/shared/dto/pagination-meta.dto';
import { ConversationMember } from '@/conversations/entities/conversation-member.entity';
import { SecurityUserClientService } from '@/users/services/security-user-client.service';
import { RealtimeEmitterService } from '@/realtime/services/realtime-emitter.service';

export interface RemoveMemberOptions {
  block?: boolean;
  reason?: string;
}

@Injectable()
export class GroupMembershipService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    @InjectRepository(GroupBlockedUser)
    private readonly blockedUserRepository: Repository<GroupBlockedUser>,
    @InjectRepository(GroupMembershipLog)
    private readonly membershipLogRepository: Repository<GroupMembershipLog>,
    @InjectRepository(ConversationMember)
    private readonly conversationMemberRepository: Repository<ConversationMember>,
    private readonly securityUserClient: SecurityUserClientService,
    private readonly realtimeEmitter: RealtimeEmitterService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async assertNotBlocked(groupId: string, userId: string): Promise<void> {
    const blocked = await this.blockedUserRepository.findOne({
      where: { groupId, userId },
    });
    if (blocked) {
      throw new ForbiddenException(
        'No puedes unirte a este grupo porque fuiste bloqueado',
      );
    }
  }

  async logMembership(
    groupId: string,
    action: GroupMembershipAction,
    actorUserId: string,
    targetUserId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.membershipLogRepository.save(
      this.membershipLogRepository.create({
        groupId,
        action,
        actorUserId,
        targetUserId: targetUserId ?? null,
        metadata: metadata ?? null,
      }),
    );
  }

  buildWelcomeMessage(groupName: string): string {
    return `Bienvenido al grupo "${groupName}".`;
  }

  async findPublicDirectory(
    userId: string,
    query: GroupSearchQueryDto,
  ): Promise<ResponseGroupPublicListDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.groupRepository
      .createQueryBuilder('grp')
      .leftJoinAndSelect('grp.members', 'members', 'members.leftAt IS NULL')
      .where('grp.visibility = :visibility', {
        visibility: GroupVisibility.PUBLIC,
      })
      .orderBy('grp.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.q?.trim()) {
      const term = `%${query.q.trim()}%`;
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('grp.name ILIKE :term', { term })
            .orWhere('grp.description ILIKE :term', { term });
        }),
      );
    }

    const [groups, totalItems] = await qb.getManyAndCount();
    const items = groups.map((group) =>
      this.toPublicSummary(group, userId, group.members ?? []),
    );

    return this.toPublicListDto(items, page, limit, totalItems);
  }

  async findGroupDetail(
    groupId: string,
    userId: string,
  ): Promise<ResponseGroupDetailDto> {
    const group = await this.getGroupWithMembers(groupId);
    const activeMembers = this.getActiveMembers(group.members ?? []);
    const myMembership = activeMembers.find((m) => m.userId === userId);

    if (group.visibility !== GroupVisibility.PUBLIC && !myMembership) {
      throw new ForbiddenException('No tienes acceso a este grupo');
    }

    return plainToInstance(ResponseGroupDetailDto, {
      id: group.id,
      name: group.name,
      description: group.description,
      visibility: group.visibility,
      iconUrl: group.iconUrl,
      createdBy: group.createdBy,
      conversationId: group.conversationId,
      memberCount: activeMembers.length,
      isMember: myMembership != null,
      myRole: myMembership?.role,
      createdAt: group.createdAt,
    });
  }

  async listMembers(
    groupId: string,
    adminId: string,
    query: GroupSearchQueryDto,
  ): Promise<ResponseGroupMemberListDto> {
    const group = await this.getGroupWithMembers(groupId);
    this.assertAdmin(group, adminId);

    const activeMembers = this.getActiveMembers(group.members ?? []);

    if (query.q?.trim()) {
      const searchTerm = query.q.trim().toLowerCase();
      const enriched = await this.enrichMembers(activeMembers);
      const filtered = enriched.filter(
        (member) =>
          member.name.toLowerCase().includes(searchTerm) ||
          member.email.toLowerCase().includes(searchTerm),
      );

      return this.paginateMemberItems(filtered, query);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const pageMembers = activeMembers.slice(skip, skip + limit);
    const items = await this.enrichMembers(pageMembers);

    return {
      items,
      meta: this.buildPaginationMeta(page, limit, activeMembers.length),
    };
  }

  async updateMemberRole(
    groupId: string,
    adminId: string,
    targetUserId: string,
    role: GroupMemberRole,
  ): Promise<ResponseGroupMemberEnrichedDto> {
    if (targetUserId === adminId) {
      throw new BadRequestException('No puedes cambiar tu propio rol aquí');
    }

    const group = await this.getGroupWithMembers(groupId);
    this.assertAdmin(group, adminId);

    const membership = this.getActiveMembers(group.members ?? []).find(
      (m) => m.userId === targetUserId,
    );
    if (!membership) {
      throw new NotFoundException('El usuario no es miembro activo del grupo');
    }

    if (membership.role === role) {
      throw new ConflictException('El usuario ya tiene ese rol');
    }

    if (
      membership.role === GroupMemberRole.ADMIN &&
      role === GroupMemberRole.MEMBER
    ) {
      const adminCount = this.getActiveMembers(group.members ?? []).filter(
        (m) => m.role === GroupMemberRole.ADMIN,
      ).length;
      if (adminCount <= 1) {
        throw new ConflictException(
          'No puedes degradar al último administrador',
        );
      }
    }

    const previousRole = membership.role;
    membership.role = role;
    await this.groupMemberRepository.save(membership);

    const action =
      role === GroupMemberRole.ADMIN
        ? GroupMembershipAction.PROMOTED
        : GroupMembershipAction.DEMOTED;

    await this.logMembership(groupId, action, adminId, targetUserId, {
      previousRole,
      newRole: role,
    });

    this.realtimeEmitter.emitGroupMemberPromoted(targetUserId, {
      groupId: group.id,
      groupName: group.name,
      conversationId: group.conversationId,
      role,
    });

    const user = await this.securityUserClient.getUserById(targetUserId);

    return plainToInstance(ResponseGroupMemberEnrichedDto, {
      userId: targetUserId,
      name: user.name,
      email: user.email,
      role,
      joinedAt: membership.joinedAt,
    });
  }

  async removeMember(
    groupId: string,
    adminId: string,
    targetUserId: string,
    options: RemoveMemberOptions,
  ): Promise<{ groupId: string; userId: string; removedAt: Date }> {
    if (targetUserId === adminId) {
      throw new BadRequestException(
        'Para salir del grupo usa POST /groups/:id/leave',
      );
    }

    const group = await this.getGroupWithMembers(groupId);
    this.assertAdmin(group, adminId);

    const membership = this.getActiveMembers(group.members ?? []).find(
      (m) => m.userId === targetUserId,
    );
    if (!membership) {
      throw new NotFoundException('El usuario no es miembro activo del grupo');
    }

    if (membership.role === GroupMemberRole.ADMIN) {
      const adminCount = this.getActiveMembers(group.members ?? []).filter(
        (m) => m.role === GroupMemberRole.ADMIN,
      ).length;
      if (adminCount <= 1) {
        throw new ConflictException(
          'No puedes remover al último administrador',
        );
      }
    }

    const removedAt = new Date();

    await this.dataSource.transaction(async (manager) => {
      const groupMemberRepo = manager.getRepository(GroupMember);
      const conversationMemberRepo = manager.getRepository(ConversationMember);

      membership.leftAt = removedAt;
      await groupMemberRepo.save(membership);

      await conversationMemberRepo.delete({
        conversationId: group.conversationId,
        userId: targetUserId,
      });

      if (options.block) {
        await this.blockUserRecord(
          manager,
          groupId,
          targetUserId,
          adminId,
          options.reason,
        );
      }
    });

    await this.realtimeEmitter.removeUserFromConversation(
      targetUserId,
      group.conversationId,
    );

    await this.logMembership(
      groupId,
      GroupMembershipAction.REMOVED,
      adminId,
      targetUserId,
      options.reason ? { reason: options.reason } : undefined,
    );

    this.realtimeEmitter.emitGroupMemberRemoved(targetUserId, {
      groupId: group.id,
      groupName: group.name,
      conversationId: group.conversationId,
      reason: options.reason,
    });

    const remainingAdmins = this.getActiveMembers(group.members ?? [])
      .filter(
        (m) => m.userId !== targetUserId && m.role === GroupMemberRole.ADMIN,
      )
      .map((m) => m.userId);

    for (const remainingAdminId of remainingAdmins) {
      this.realtimeEmitter.emitGroupMemberLeft(remainingAdminId, {
        groupId: group.id,
        groupName: group.name,
        conversationId: group.conversationId,
        userId: targetUserId,
      });
    }

    if (options.block) {
      await this.logMembership(
        groupId,
        GroupMembershipAction.BLOCKED,
        adminId,
        targetUserId,
        options.reason ? { reason: options.reason } : undefined,
      );
    }

    return { groupId, userId: targetUserId, removedAt };
  }

  async listMembershipLog(
    groupId: string,
    adminId: string,
    pagination: PaginationQueryDto,
  ): Promise<ResponseMembershipLogListDto> {
    const group = await this.getGroupWithMembers(groupId);
    this.assertAdmin(group, adminId);

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [logs, totalItems] = await this.membershipLogRepository.findAndCount({
      where: { groupId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const userIds = new Set<string>();
    for (const log of logs) {
      userIds.add(log.actorUserId);
      if (log.targetUserId) userIds.add(log.targetUserId);
    }

    const userNames = await this.fetchUserNames([...userIds]);

    const items = logs.map((log) =>
      plainToInstance(ResponseMembershipLogDto, {
        id: log.id,
        action: log.action,
        actorUserId: log.actorUserId,
        actorName: userNames.get(log.actorUserId),
        targetUserId: log.targetUserId ?? undefined,
        targetName: log.targetUserId
          ? userNames.get(log.targetUserId)
          : undefined,
        metadata: log.metadata ?? undefined,
        createdAt: log.createdAt,
      }),
    );

    return {
      items,
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }

  private async blockUserRecord(
    manager: EntityManager,
    groupId: string,
    userId: string,
    blockedBy: string,
    reason?: string,
  ): Promise<void> {
    const blockedUserRepo = manager.getRepository(GroupBlockedUser);
    const existing = await blockedUserRepo.findOne({
      where: { groupId, userId },
    });

    if (!existing) {
      await blockedUserRepo.save(
        blockedUserRepo.create({
          groupId,
          userId,
          blockedBy,
          reason: reason ?? null,
        }),
      );
    }
  }

  private async enrichMembers(
    members: GroupMember[],
  ): Promise<ResponseGroupMemberEnrichedDto[]> {
    return Promise.all(
      members.map(async (member) => {
        const user = await this.securityUserClient.getUserById(member.userId);
        return plainToInstance(ResponseGroupMemberEnrichedDto, {
          userId: member.userId,
          name: user.name,
          email: user.email,
          role: member.role,
          joinedAt: member.joinedAt,
        });
      }),
    );
  }

  private async fetchUserNames(
    userIds: string[],
  ): Promise<Map<string, string>> {
    const names = new Map<string, string>();
    await Promise.all(
      userIds.map(async (id) => {
        try {
          const user = await this.securityUserClient.getUserById(id);
          names.set(id, user.name);
        } catch {
          names.set(id, id);
        }
      }),
    );
    return names;
  }

  private paginateMemberItems(
    items: ResponseGroupMemberEnrichedDto[],
    query: GroupSearchQueryDto,
  ): ResponseGroupMemberListDto {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    return {
      items: items.slice(skip, skip + limit),
      meta: this.buildPaginationMeta(page, limit, items.length),
    };
  }

  private toPublicSummary(
    group: Group,
    userId: string,
    members: GroupMember[],
  ): ResponseGroupPublicSummaryDto {
    const activeMembers = this.getActiveMembers(members);
    return plainToInstance(ResponseGroupPublicSummaryDto, {
      id: group.id,
      name: group.name,
      description: group.description,
      memberCount: activeMembers.length,
      iconUrl: group.iconUrl,
      isMember: activeMembers.some((m) => m.userId === userId),
    });
  }

  private async getGroupWithMembers(groupId: string): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['members'],
    });
    if (!group) {
      throw new NotFoundException(`Group ${groupId} not found`);
    }
    return group;
  }

  private getActiveMembers(members: GroupMember[]): GroupMember[] {
    return members.filter((m) => m.leftAt == null);
  }

  private assertAdmin(group: Group, userId: string): void {
    const member = this.getActiveMembers(group.members ?? []).find(
      (m) => m.userId === userId,
    );
    if (!member || member.role !== GroupMemberRole.ADMIN) {
      throw new ForbiddenException(
        'Solo administradores pueden realizar esta acción',
      );
    }
  }

  private buildPaginationMeta(
    page: number,
    limit: number,
    totalItems: number,
  ): PaginationMetaDto {
    const totalPages = Math.ceil(totalItems / limit) || 0;
    return plainToInstance(PaginationMetaDto, {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    });
  }

  private toPublicListDto(
    items: ResponseGroupPublicSummaryDto[],
    page: number,
    limit: number,
    totalItems: number,
  ): ResponseGroupPublicListDto {
    return {
      items,
      meta: this.buildPaginationMeta(page, limit, totalItems),
    };
  }
}
