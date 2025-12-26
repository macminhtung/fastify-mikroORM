import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsArray,
  IsDateString,
  Max,
  Min,
  ArrayMinSize,
  ArrayMaxSize,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EOrder, EBoolean } from '@/common/enums';
import { Transform } from 'class-transformer';

export const NUM_LIMIT_RECORDS = 100000;
export const DEFAULT_PAGE_NUM = 1;
export const DEFAULT_PAGE_TAKE = 30;

export function IsBefore(property: string, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: {
        validate(value: Date, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = args.object?.[relatedPropertyName];
          return relatedValue ? value <= relatedValue : true;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${args.property} must be before ${relatedPropertyName}`;
        },
      },
    });
  };
}

export class GetPaginatedRecordsDto {
  @ApiPropertyOptional({ enum: EOrder })
  @IsOptional()
  @IsEnum(EOrder)
  order?: EOrder;

  @ApiPropertyOptional({ type: 'number', default: DEFAULT_PAGE_NUM })
  @IsOptional()
  @IsInt()
  @Min(DEFAULT_PAGE_NUM)
  page?: number;

  @ApiPropertyOptional({ type: 'number', default: DEFAULT_PAGE_TAKE })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keySearch?: string;

  @ApiPropertyOptional({ enum: EBoolean })
  @IsOptional()
  @IsEnum(EBoolean)
  isDeleted?: EBoolean;

  @ApiPropertyOptional({ type: Array<string> })
  @IsOptional()
  @Transform(({ value }) => (value ? (Array.isArray(value) ? value : [value]) : undefined))
  @IsUUID('7', { each: true })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  includeIds?: string[];

  @ApiPropertyOptional({ type: Array<string> })
  @IsOptional()
  @Transform(({ value }) => (value ? (Array.isArray(value) ? value : [value]) : undefined))
  @IsUUID('7', { each: true })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  excludeIds?: string[];

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @IsBefore('createdTo')
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ type: Date })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({ enum: EBoolean })
  @IsOptional()
  @IsEnum(EBoolean)
  isSelectAll?: EBoolean;
}
