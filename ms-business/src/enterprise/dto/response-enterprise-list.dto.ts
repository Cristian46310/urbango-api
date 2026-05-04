import { ApiProperty } from '@nestjs/swagger';
import { ResponseEnterpriseDto } from './response-enterprise.dto';

export class ResponseEnterpriseListDto {
  @ApiProperty({ type: [ResponseEnterpriseDto] })
  items!: ResponseEnterpriseDto[];

  @ApiProperty()
  meta!: any;
}
