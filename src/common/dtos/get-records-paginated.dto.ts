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
  IsBoolean,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EOrder } from '@/common/enums';

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

  @ApiPropertyOptional({ type: 'boolean', default: false })
  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;

  @ApiPropertyOptional({ type: Array<string> })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  includeIds?: string[];

  @ApiPropertyOptional({ type: Array<string> })
  @IsOptional()
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

  @ApiPropertyOptional({ type: 'boolean', default: false })
  @IsOptional()
  @IsBoolean()
  isSelectAll?: boolean;
}
