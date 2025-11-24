import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { GroupController } from '@/modules/group/group.controller';
import { GroupService } from '@/modules/group/group.service';
import { GroupEntity } from '@/modules/group/group.entity';
import { GroupMemberService } from '@/modules/group/group-member/group-member.service';
import { GroupMemberEntity } from '@/modules/group/group-member/group-member.entity';
import { InviteMemberController } from '@/modules/group/invite-member/invite-member.controller';
import { InviteMemberService } from '@/modules/group/invite-member/invite-member.service';
import { InviteMemberEntity } from '@/modules/group/invite-member/invite-member.entity';

@Module({
  imports: [MikroOrmModule.forFeature([GroupEntity, GroupMemberEntity, InviteMemberEntity])],
  controllers: [GroupController, InviteMemberController],
  providers: [GroupService, GroupMemberService, InviteMemberService],
  exports: [GroupService, GroupMemberService, InviteMemberService],
})
export class GroupModule {}
