import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  image: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(100)
  description: string;
}
