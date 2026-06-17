import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
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
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.members', 'members')
      .where('(group.visibility = :public OR members.userId = :userId)', {
        public: GroupVisibility.PUBLIC,
        userId,
      })
      .orderBy('group.createdAt', 'DESC')
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
      .createQueryBuilder('group')
      .innerJoinAndSelect('group.members', 'members')
      .where('members.userId = :userId', { userId })
      .orderBy('group.createdAt', 'DESC')
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
    return (group.members ?? []).map((member) => member.userId);
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

    const existingIds = new Set((group.members ?? []).map((m) => m.userId));
    const newIds = uniqueIds.filter((id) => !existingIds.has(id));

    if (newIds.length === 0) {
      throw new ConflictException('Todos los usuarios ya son miembros');
    }

    await this.validateUsersExist(newIds, token);

    const newConversationMembers = newIds.map((userId) =>
      this.conversationMemberRepository.create({
        conversationId: group.conversationId,
        userId,
      }),
    );
    await this.conversationMemberRepository.save(newConversationMembers);

    const newGroupMembers = newIds.map((userId) =>
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

    const allMembers = [...(group.members ?? []), ...saved];
    const response = this.toResponse(group, allMembers);
    this.emitMemberAddedEvents(response, newIds);

    return response;
  }

  async join(groupId: string, userId: string): Promise<ResponseGroupDto> {
    const group = await this.getGroupWithMembers(groupId);

    if (group.visibility !== GroupVisibility.PUBLIC) {
      throw new ForbiddenException(
        'Solo puedes unirte a grupos públicos. Los privados requieren invitación.',
      );
    }

    const isMember = (group.members ?? []).some(
      (member) => member.userId === userId,
    );
    if (isMember) {
      throw new ConflictException('Ya eres miembro de este grupo');
    }

    await this.conversationMemberRepository.save(
      this.conversationMemberRepository.create({
        conversationId: group.conversationId,
        userId,
      }),
    );

    const member = await this.groupMemberRepository.save(
      this.groupMemberRepository.create({
        groupId: group.id,
        userId,
        role: GroupMemberRole.MEMBER,
      }),
    );

    const allMembers = [...(group.members ?? []), member];
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
    });

    return response;
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
    const member = (group.members ?? []).find((m) => m.userId === userId);
    if (!member || member.role !== GroupMemberRole.ADMIN) {
      throw new ForbiddenException(
        'Solo administradores pueden realizar esta acción',
      );
    }
  }

  private assertMember(group: Group, userId: string): void {
    const isMember = (group.members ?? []).some(
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
    return plainToInstance(ResponseGroupDto, {
      id: group.id,
      name: group.name,
      description: group.description,
      visibility: group.visibility,
      iconUrl: group.iconUrl,
      createdBy: group.createdBy,
      conversationId: group.conversationId,
      members: members.map((member) =>
        plainToInstance(ResponseGroupMemberDto, {
          userId: member.userId,
          role: member.role,
          joinedAt: member.joinedAt,
        }),
      ),
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
