import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GeneratePreSignedUrlDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentType: string;

  @ApiProperty()
  @IsString()
  filename: string;
}
