import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ResponseUserSummaryDto } from '../dto/response-user-summary.dto';

interface SecurityUserPage {
  content: Array<{ id: string; name: string; email: string }>;
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable()
export class SecurityUserClientService {
  private readonly logger = new Logger(SecurityUserClientService.name);
  private readonly securityServiceUrl: string;
  private readonly internalKey: string;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('MS_SECURITY_URL')?.trim();
    if (!url) {
      throw new Error('MS_SECURITY_URL is required');
    }
    this.securityServiceUrl = url.replace(/\/$/, '');
    this.internalKey =
      this.configService.get<string>('MS_SECURITY_INTERNAL_KEY')?.trim() ?? '';
  }

  private internalHeaders(): Record<string, string> {
    if (!this.internalKey) {
      throw new HttpException(
        'MS_SECURITY_INTERNAL_KEY is not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return { 'X-Internal-Key': this.internalKey };
  }

  async searchUsers(
    query: string,
    page: number,
    limit: number,
  ): Promise<{
    items: ResponseUserSummaryDto[];
    totalItems: number;
    totalPages: number;
  }> {
    try {
      const response = await axios.get<SecurityUserPage>(
        `${this.securityServiceUrl}/api/internal/users`,
        {
          params: { q: query, page: page - 1, size: limit },
          headers: this.internalHeaders(),
          timeout: 30000,
        },
      );

      const data = response.data;
      return {
        items: (data.content ?? []).map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
        })),
        totalItems: data.totalElements ?? 0,
        totalPages: data.totalPages ?? 0,
      };
    } catch {
      this.logger.error('User search failed against ms-security');
      throw new HttpException(
        'User search service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getUserById(userId: string): Promise<ResponseUserSummaryDto> {
    try {
      const response = await axios.get<{
        id: string;
        name: string;
        email: string;
      }>(`${this.securityServiceUrl}/api/internal/users/${userId}`, {
        headers: this.internalHeaders(),
        timeout: 30000,
      });

      return {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
      };
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === HttpStatus.NOT_FOUND
      ) {
        throw new NotFoundException(`User ${userId} not found`);
      }
      this.logger.error(`getUserById failed for ${userId}`);
      throw new HttpException(
        'User lookup service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getAllUserIds(): Promise<string[]> {
    const userIds: string[] = [];
    let page = 0;
    const size = 200;

    while (true) {
      try {
        const response = await axios.get<SecurityUserPage>(
          `${this.securityServiceUrl}/api/internal/users`,
          {
            params: { page, size },
            headers: this.internalHeaders(),
            timeout: 30000,
          },
        );

        const content = response.data.content ?? [];
        userIds.push(...content.map((user) => user.id));

        const totalPages = response.data.totalPages ?? 0;
        if (page + 1 >= totalPages || content.length === 0) {
          break;
        }

        page += 1;
      } catch {
        this.logger.error('Failed to list users from ms-security');
        throw new HttpException(
          'User listing service unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    }

    return [...new Set(userIds)];
  }
}
