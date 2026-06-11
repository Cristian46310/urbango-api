import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { GroupVisibility } from '../enums/group-visibility.enum';

export class CreateGroupDto {
  @ApiProperty({ example: 'Ciclistas UC', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    example: 'Grupo de interés para ciclistas',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: GroupVisibility, default: GroupVisibility.PUBLIC })
  @IsEnum(GroupVisibility)
  visibility!: GroupVisibility;

  @ApiProperty({
    description: 'IDs de ms-security de al menos 2 personas además del creador',
    example: ['665f1c2e9a1b2c3d4e5f6789', '665f1c2e9a1b2c3d4e5f6790'],
    minItems: 2,
  })
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  memberIds!: string[];
}
