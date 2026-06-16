import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateGroupIconDto {
  @ApiProperty({ example: 'https://cdn.example.com/icons/group.png' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  @MaxLength(2048)
  iconUrl!: string;
}
