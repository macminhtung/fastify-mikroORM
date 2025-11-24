import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateInviteMemberDto {
  @ApiProperty()
  @IsUUID('7')
  groupId: string;

  @ApiProperty()
  @IsUUID('7')
  memberId: string;
}
