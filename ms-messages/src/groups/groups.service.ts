import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { IsNull, Not, Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddGroupMembersDto } from './dto/add-group-members.dto';
import { UpdateGroupIconDto } from './dto/update-group-icon.dto';
import {
  ResponseGroupDto,
  ResponseGroupMemberDto,
} from './dto/response-group.dto';
import { ResponseGroupListDto } from './dto/response-group-list.dto';
import { GroupMemberRole } from './enums/group-member-role.enum';
import { GroupVisibility } from './enums/group-visibility.enum';
import { Conversation } from '@/conversations/entities/conversation.entity';
import { ConversationMember } from '@/conversations/entities/conversation-member.entity';
import { ConversationType } from '@/conversations/enums/conversation-type.enum';
import { SecurityUserClientService } from '@/users/services/security-user-client.service';
import { RealtimeEmitterService } from '@/realtime/services/realtime-emitter.service';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { PaginationMetaDto } from '@/shared/dto/pagination-meta.dto';
import { GroupMembershipService } from './services/group-membership.service';
import { GroupMembershipAction } from './enums/group-membership-action.enum';

export interface ResponseLeaveGroupDto {
  groupId: string;
  leftAt: Date;
}

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationMember)
    private readonly conversationMemberRepository: Repository<ConversationMember>,
    private readonly securityUserClient: SecurityUserClientService,
    private readonly realtimeEmitter: RealtimeEmitterService,
    private readonly groupMembershipService: GroupMembershipService,
  ) {}

  async create(
    creatorId: string,
    dto: CreateGroupDto,
    token: string,
  ): Promise<ResponseGroupDto> {
    const uniqueMemberIds = [...new Set(dto.memberIds)];

    if (uniqueMemberIds.includes(creatorId)) {
      throw new BadRequestException(
        'El creador no debe incluirse en memberIds',
      );
    }

    if (uniqueMemberIds.length < 2) {
      throw new BadRequestException(
        'Se requieren al menos 2 miembros además del creador',
      );
    }

    await this.validateUsersExist(uniqueMemberIds, token);

    const conversation = this.conversationRepository.create({
      type: ConversationType.GROUP,
    });
    const savedConversation =
      await this.conversationRepository.save(conversation);

    const allUserIds = [creatorId, ...uniqueMemberIds];
    const conversationMembers = allUserIds.map((userId) =>
      this.conversationMemberRepository.create({
        conversationId: savedConversation.id,
        userId,
      }),
    );
    await this.conversationMemberRepository.save(conversationMembers);

    const group = this.groupRepository.create({
      name: dto.name,
      description: dto.description,
      visibility: dto.visibility,
      createdBy: creatorId,
      conversationId: savedConversation.id,
    });
    const savedGroup = await this.groupRepository.save(group);

    const groupMembers = [
      this.groupMemberRepository.create({
        groupId: savedGroup.id,
        userId: creatorId,
        role: GroupMemberRole.ADMIN,
      }),
      ...uniqueMemberIds.map((userId) =>
        this.groupMemberRepository.create({
          groupId: savedGroup.id,
          userId,
          role: GroupMemberRole.MEMBER,
        }),
      ),
    ];
    const savedMembers = await this.groupMemberRepository.save(groupMembers);

    await this.realtimeEmitter.joinUsersToConversation(
      allUserIds,
      savedConversation.id,
    );

    const response = this.toResponse(savedGroup, savedMembers);
    this.emitMemberAddedEvents(response, uniqueMemberIds);

    for (const memberId of uniqueMemberIds) {
      await this.groupMembershipService.logMembership(
        savedGroup.id,
        GroupMembershipAction.ADDED,
        creatorId,
        memberId,
      );
    }

    return response;
  }

  async findAll(
    userId: string,
    pagination: PaginationQueryDto,
  ): Promise<ResponseGroupListDto> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.groupRepository
      .createQueryBuilder('grp')
      .leftJoinAndSelect('grp.members', 'members', 'members.leftAt IS NULL')
      .where(
        `(grp.visibility = :public OR EXISTS (
          SELECT 1 FROM group_members gm
          WHERE gm.group_id = grp.id
            AND gm.user_id = :userId
            AND gm.left_at IS NULL
        ))`,
        { public: GroupVisibility.PUBLIC, userId },
      )
      .orderBy('grp.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [groups, totalItems] = await qb.getManyAndCount();
    const items = groups.map((group) =>
      this.toResponse(group, group.members ?? []),
    );

    return this.toListDto(items, page, limit, totalItems);
  }

  async findMyGroups(
    userId: string,
    pagination: PaginationQueryDto,
  ): Promise<ResponseGroupListDto> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.groupRepository
      .createQueryBuilder('grp')
      .innerJoinAndSelect('grp.members', 'members', 'members.leftAt IS NULL')
      .where(
        `EXISTS (
          SELECT 1 FROM group_members gm
          WHERE gm.group_id = grp.id
            AND gm.user_id = :userId
            AND gm.left_at IS NULL
        )`,
        { userId },
      )
      .orderBy('grp.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [groups, totalItems] = await qb.getManyAndCount();
    const items = groups.map((group) =>
      this.toResponse(group, group.members ?? []),
    );

    return this.toListDto(items, page, limit, totalItems);
  }

  async getGroupForMember(groupId: string, userId: string): Promise<Group> {
    const group = await this.getGroupWithMembers(groupId);
    this.assertMember(group, userId);
    return group;
  }

  async findByConversationId(conversationId: string): Promise<Group | null> {
    return this.groupRepository.findOne({
      where: { conversationId },
      relations: ['members'],
    });
  }

  assertGroupAdmin(group: Group, userId: string): void {
    this.assertAdmin(group, userId);
  }

  getMemberUserIds(group: Group): string[] {
    return this.getActiveMembers(group).map((member) => member.userId);
  }

  async addMembers(
    groupId: string,
    requesterId: string,
    dto: AddGroupMembersDto,
    token: string,
  ): Promise<ResponseGroupDto> {
    const group = await this.getGroupWithMembers(groupId);
    this.assertAdmin(group, requesterId);

    const uniqueIds = [...new Set(dto.memberIds)].filter(
      (id) => id !== requesterId,
    );

    if (uniqueIds.length === 0) {
      throw new BadRequestException('No hay miembros nuevos para agregar');
    }

    const activeIds = new Set(
      this.getActiveMembers(group).map((m) => m.userId),
    );
    const newIds = uniqueIds.filter((id) => !activeIds.has(id));

    if (newIds.length === 0) {
      throw new ConflictException('Todos los usuarios ya son miembros activos');
    }

    await this.validateUsersExist(newIds, token);

    // For former members (leftAt != null), reactivate; otherwise insert new row
    const formerMembersMap = new Map(
      (group.members ?? [])
        .filter((m) => m.leftAt != null && newIds.includes(m.userId))
        .map((m) => [m.userId, m]),
    );

    const brandNewIds = newIds.filter((id) => !formerMembersMap.has(id));
    const reactivatedIds = newIds.filter((id) => formerMembersMap.has(id));

    for (const userId of reactivatedIds) {
      const former = formerMembersMap.get(userId)!;
      former.leftAt = null;
      former.role = GroupMemberRole.MEMBER;
      await this.groupMemberRepository.save(former);
    }

    const newConversationMembers = newIds.map((userId) =>
      this.conversationMemberRepository.create({
        conversationId: group.conversationId,
        userId,
      }),
    );
    await this.conversationMemberRepository.save(newConversationMembers);

    const newGroupMembers = brandNewIds.map((userId) =>
      this.groupMemberRepository.create({
        groupId: group.id,
        userId,
        role: GroupMemberRole.MEMBER,
      }),
    );
    const saved = await this.groupMemberRepository.save(newGroupMembers);

    await this.realtimeEmitter.joinUsersToConversation(
      newIds,
      group.conversationId,
    );

    const allMembers = [...this.getActiveMembers(group), ...saved];
    const response = this.toResponse(group, allMembers);
    this.emitMemberAddedEvents(response, newIds);

    for (const memberId of newIds) {
      await this.groupMembershipService.logMembership(
        group.id,
        GroupMembershipAction.ADDED,
        requesterId,
        memberId,
      );
    }

    return response;
  }

  async join(groupId: string, userId: string): Promise<ResponseGroupDto> {
    const group = await this.getGroupWithMembers(groupId);

    if (group.visibility !== GroupVisibility.PUBLIC) {
      throw new ForbiddenException(
        'Solo puedes unirte a grupos públicos. Los privados requieren invitación.',
      );
    }

    await this.groupMembershipService.assertNotBlocked(groupId, userId);

    const existingMember = (group.members ?? []).find(
      (member) => member.userId === userId,
    );

    if (existingMember && existingMember.leftAt == null) {
      throw new ConflictException('Ya eres miembro de este grupo');
    }

    let member: GroupMember;

    if (existingMember && existingMember.leftAt != null) {
      // Reactivate former member
      existingMember.leftAt = null;
      existingMember.role = GroupMemberRole.MEMBER;
      member = await this.groupMemberRepository.save(existingMember);

      await this.conversationMemberRepository.save(
        this.conversationMemberRepository.create({
          conversationId: group.conversationId,
          userId,
        }),
      );
    } else {
      await this.conversationMemberRepository.save(
        this.conversationMemberRepository.create({
          conversationId: group.conversationId,
          userId,
        }),
      );

      member = await this.groupMemberRepository.save(
        this.groupMemberRepository.create({
          groupId: group.id,
          userId,
          role: GroupMemberRole.MEMBER,
        }),
      );
    }

    const activeMembers = this.getActiveMembers(group).filter(
      (m) => m.userId !== userId,
    );
    const allMembers = [...activeMembers, member];
    const response = this.toResponse(group, allMembers);

    await this.realtimeEmitter.joinUsersToConversation(
      [userId],
      group.conversationId,
    );

    this.realtimeEmitter.emitGroupMemberAdded(userId, {
      groupId: group.id,
      groupName: group.name,
      conversationId: group.conversationId,
      role: GroupMemberRole.MEMBER,
      welcomeMessage: this.groupMembershipService.buildWelcomeMessage(
        group.name,
      ),
    });

    await this.groupMembershipService.logMembership(
      group.id,
      GroupMembershipAction.JOINED,
      userId,
      userId,
    );

    return response;
  }

  async leave(groupId: string, userId: string): Promise<ResponseLeaveGroupDto> {
    const group = await this.getGroupWithMembers(groupId);

    const membership = (group.members ?? []).find(
      (m) => m.userId === userId && m.leftAt == null,
    );
    if (!membership) {
      throw new ForbiddenException('No eres miembro activo de este grupo');
    }

    if (membership.role === GroupMemberRole.ADMIN) {
      const activeAdmins = this.getActiveMembers(group).filter(
        (m) => m.role === GroupMemberRole.ADMIN,
      );
      if (activeAdmins.length <= 1) {
        throw new ConflictException(
          'Debes promover a otro administrador antes de salir',
        );
      }
    }

    const leftAt = new Date();
    membership.leftAt = leftAt;
    await this.groupMemberRepository.save(membership);

    await this.conversationMemberRepository.delete({
      conversationId: group.conversationId,
      userId,
    });

    await this.realtimeEmitter.removeUserFromConversation(
      userId,
      group.conversationId,
    );

    const remainingAdmins = this.getActiveMembers(group)
      .filter((m) => m.userId !== userId && m.role === GroupMemberRole.ADMIN)
      .map((m) => m.userId);

    for (const adminId of remainingAdmins) {
      this.realtimeEmitter.emitGroupMemberLeft(adminId, {
        groupId: group.id,
        groupName: group.name,
        conversationId: group.conversationId,
        userId,
      });
    }

    await this.groupMembershipService.logMembership(
      group.id,
      GroupMembershipAction.LEFT,
      userId,
      userId,
    );

    return { groupId: group.id, leftAt };
  }

  async getMembershipForHistory(
    groupId: string,
    userId: string,
  ): Promise<GroupMember | null> {
    return this.groupMemberRepository.findOne({
      where: [
        { groupId, userId, leftAt: IsNull() },
        { groupId, userId, leftAt: Not(IsNull()) },
      ],
    });
  }

  async findGroupById(groupId: string): Promise<Group | null> {
    return this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['members'],
    });
  }

  async updateIcon(
    groupId: string,
    requesterId: string,
    dto: UpdateGroupIconDto,
  ): Promise<ResponseGroupDto> {
    const group = await this.getGroupWithMembers(groupId);
    this.assertAdmin(group, requesterId);

    group.iconUrl = dto.iconUrl;
    const saved = await this.groupRepository.save(group);

    return this.toResponse(saved, group.members ?? []);
  }

  private getActiveMembers(group: Group): GroupMember[] {
    return (group.members ?? []).filter((m) => m.leftAt == null);
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

  private assertAdmin(group: Group, userId: string): void {
    const member = this.getActiveMembers(group).find(
      (m) => m.userId === userId,
    );
    if (!member || member.role !== GroupMemberRole.ADMIN) {
      throw new ForbiddenException(
        'Solo administradores pueden realizar esta acción',
      );
    }
  }

  private assertMember(group: Group, userId: string): void {
    const isMember = this.getActiveMembers(group).some(
      (member) => member.userId === userId,
    );
    if (!isMember) {
      throw new ForbiddenException('No eres miembro de este grupo');
    }
  }

  private async validateUsersExist(
    userIds: string[],
    token: string,
  ): Promise<void> {
    await Promise.all(
      userIds.map((id) => this.securityUserClient.getUserById(id, token)),
    );
  }

  private emitMemberAddedEvents(
    group: ResponseGroupDto,
    userIds: string[],
  ): void {
    void this.realtimeEmitter.joinUsersToConversation(
      userIds,
      group.conversationId,
    );

    for (const userId of userIds) {
      this.realtimeEmitter.emitGroupMemberAdded(userId, {
        groupId: group.id,
        groupName: group.name,
        conversationId: group.conversationId,
        role: GroupMemberRole.MEMBER,
      });
    }
  }

  private toResponse(group: Group, members: GroupMember[]): ResponseGroupDto {
    const activeMembers = members.filter((m) => m.leftAt == null);
    return plainToInstance(ResponseGroupDto, {
      id: group.id,
      name: group.name,
      description: group.description,
      visibility: group.visibility,
      iconUrl: group.iconUrl,
      createdBy: group.createdBy,
      conversationId: group.conversationId,
      members: activeMembers.map((member) =>
        plainToInstance(ResponseGroupMemberDto, {
          userId: member.userId,
          role: member.role,
          joinedAt: member.joinedAt,
        }),
      ),
      memberCount: activeMembers.length,
      createdAt: group.createdAt,
    });
  }

  private toListDto(
    items: ResponseGroupDto[],
    page: number,
    limit: number,
    totalItems: number,
  ): ResponseGroupListDto {
    const totalPages = Math.ceil(totalItems / limit) || 0;

    return {
      items,
      meta: plainToInstance(PaginationMetaDto, {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }),
    };
  }
}
