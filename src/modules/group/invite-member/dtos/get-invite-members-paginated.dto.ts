import { GetPaginatedRecordsDto } from '@/common/dtos';
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetInviteMembersPaginatedDto extends GetPaginatedRecordsDto {
  @ApiProperty()
  @IsUUID('7')
  groupId: string;
}
