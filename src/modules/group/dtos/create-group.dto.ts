import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsArray,
  IsUUID,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class CreateGroupDto {
  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsUUID('7', { each: true })
  @ArrayMinSize(0)
  @ArrayMaxSize(1000)
  inviteMemberIds: string[];
}
