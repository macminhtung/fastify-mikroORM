import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsBoolean } from 'class-validator';
import { EInviteMemberStatus } from '@/modules/group/invite-member/invite-member.entity';

export class ManageInviteMemberStatusDto {
  @ApiProperty()
  @IsIn([EInviteMemberStatus.ACCEPTED, EInviteMemberStatus.DECLINE])
  status: EInviteMemberStatus.ACCEPTED | EInviteMemberStatus.DECLINE;

  @ApiProperty()
  @IsBoolean()
  isPreventReinvite: boolean;
}
