import { Controller, Get, Headers, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { SearchUsersQueryDto } from './dto/search-users-query.dto';
import { ResponseUserSummaryListDto } from './dto/response-user-summary-list.dto';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  @Authenticated()
  @ApiOperation({ summary: 'Buscar personas por nombre o email' })
  @ApiOkResponse({ type: ResponseUserSummaryListDto })
  async search(
    @Query() query: SearchUsersQueryDto,
    @Headers('authorization') authorization: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseUserSummaryListDto> {
    const token = authorization.replace(/^Bearer\s+/i, '');
    return this.usersService.search(query, token, user.id);
  }
}
