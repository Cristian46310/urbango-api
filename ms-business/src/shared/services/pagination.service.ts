import { Injectable } from '@nestjs/common';

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

@Injectable()
export class PaginationService {
  buildPaginationMeta(
    page: number,
    limit: number,
    totalItems: number,
  ): PaginationMeta {
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
