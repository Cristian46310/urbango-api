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

  constructor(private readonly configService: ConfigService) {
    this.securityServiceUrl =
      this.configService.get<string>('MS_SECURITY_URL') ??
      'http://localhost:8080';
  }

  async searchUsers(
    query: string,
    page: number,
    limit: number,
    token: string,
  ): Promise<{
    items: ResponseUserSummaryDto[];
    totalItems: number;
    totalPages: number;
  }> {
    try {
      const response = await axios.get<SecurityUserPage>(
        `${this.securityServiceUrl}/api/public/users`,
        {
          params: { q: query, page: page - 1, size: limit },
          headers: { Authorization: `Bearer ${token}` },
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

  async getUserById(
    userId: string,
    token: string,
  ): Promise<ResponseUserSummaryDto> {
    try {
      const response = await axios.get<{
        id: string;
        name: string;
        email: string;
      }>(`${this.securityServiceUrl}/api/public/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      });

      return {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
      };
    } catch {
      throw new NotFoundException(`User ${userId} not found`);
    }
  }
}
