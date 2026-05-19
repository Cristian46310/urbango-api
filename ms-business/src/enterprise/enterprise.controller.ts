import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
} from '@nestjs/swagger';
import { EnterpriseService } from './enterprise.service';
import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import { ResponseEnterpriseListDto } from './dto/response-enterprise-list.dto';
import { ResponseEnterpriseDto } from './dto/response-enterprise.dto';

@ApiTags('Enterprises')
@Controller('enterprise')
export class EnterpriseController {
  constructor(private readonly enterpriseService: EnterpriseService) {}

  @Post()
  @ApiOperation({ summary: 'Crear empresa (requiere permisos RBAC)' })
  create(@Body() createEnterpriseDto: CreateEnterpriseDto) {
    return this.enterpriseService.create(createEnterpriseDto);
  }

  @Get()
  @Authenticated()
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Listar empresas (requiere JWT; sin permiso RBAC — para selects de registro)',
  })
  @ApiOkResponse({ type: ResponseEnterpriseListDto })
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.enterpriseService.findAll(pagination);
  }

  @Get(':id')
  @Authenticated()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener empresa por id (requiere JWT)' })
  @ApiOkResponse({ type: ResponseEnterpriseDto })
  findOne(@Param('id') id: string) {
    return this.enterpriseService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar empresa (requiere permisos RBAC)' })
  update(
    @Param('id') id: string,
    @Body() updateEnterpriseDto: UpdateEnterpriseDto,
  ) {
    return this.enterpriseService.update(id, updateEnterpriseDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar empresa (requiere permisos RBAC)' })
  remove(@Param('id') id: string) {
    return this.enterpriseService.remove(id);
  }
}
