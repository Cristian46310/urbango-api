import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { SecurityUserClientService } from './services/security-user-client.service';
import { SearchUsersQueryDto } from './dto/search-users-query.dto';
import { ResponseUserSummaryListDto } from './dto/response-user-summary-list.dto';
import { ResponseUserSummaryDto } from './dto/response-user-summary.dto';
import { PaginationMetaDto } from '@/shared/dto/pagination-meta.dto';

@Injectable()
export class UsersService {
  constructor(private readonly securityUserClient: SecurityUserClientService) {}

  async search(
    query: SearchUsersQueryDto,
    currentUserId: string,
  ): Promise<ResponseUserSummaryListDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const result = await this.securityUserClient.searchUsers(
      query.q,
      page,
      limit,
    );

    const items = result.items
      .filter((user) => user.id !== currentUserId)
      .map((user) => plainToInstance(ResponseUserSummaryDto, user));

    const totalPages = Math.ceil(result.totalItems / limit) || 0;

    return {
      items,
      meta: plainToInstance(PaginationMetaDto, {
        page,
        limit,
        totalItems: result.totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }),
    };
  }
}
