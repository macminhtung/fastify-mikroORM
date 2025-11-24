import { applyDecorators, Type } from '@nestjs/common';
import { ApiProperty, getSchemaPath, ApiOkResponse, ApiExtraModels } from '@nestjs/swagger';
import { GetPaginatedRecordsDto } from '@/common/dtos';

export const ApiOkResponsePaginated = <RecordDto extends Type<unknown>>(recordDto: RecordDto) =>
  applyDecorators(
    ApiExtraModels(PaginatedResponseDto, recordDto),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseDto) },
          {
            properties: {
              records: {
                type: 'array',
                items: { $ref: getSchemaPath(recordDto) },
              },
            },
          },
        ],
      },
    }),
  );

export class PaginatedResponseDto<E> {
  constructor(payload: { args: GetPaginatedRecordsDto; total: number; records: E[] }) {
    const { args, total, records } = payload;
    const { page = 1, take = 1 } = args;
    this.page = page;
    this.take = take;
    this.total = total;
    this.records = records;
  }

  @ApiProperty({ type: 'number' })
  page: number;

  @ApiProperty({ type: 'number' })
  take: number;

  @ApiProperty({ type: 'number' })
  total: number;

  @ApiProperty({ type: () => Array<E> })
  records: E[];
}
