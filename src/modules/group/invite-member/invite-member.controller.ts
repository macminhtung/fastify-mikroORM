import { Controller, Get, Post, Put, Delete, Query, Body, Req, Param } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { ETableName } from '@/common/enums';
import type { TRequest } from '@/common/types';
import { ApiOkResponsePaginated } from '@/common/dtos';
import { InviteMemberService } from '@/modules/group/invite-member/invite-member.service';
import { InviteMemberEntity } from '@/modules/group/invite-member/invite-member.entity';
import {
  CreateInviteMemberDto,
  ManageInviteMemberStatusDto,
  GetInviteMembersPaginatedDto,
} from '@/modules/group/invite-member/dtos';

@Controller(ETableName.INVITE_MEMBER)
export class InviteMemberController {
  constructor(private readonly service: InviteMemberService) {}

  // #==============================#
  // # ==> CREATE INVITE MEMBER <== #
  // #==============================#
  @ApiOkResponse({ type: InviteMemberEntity })
  @Post()
  createInviteMember(@Req() req: TRequest, @Body() payload: CreateInviteMemberDto) {
    return this.service.createInviteMember(req, payload);
  }

  // #=====================================#
  // # ==> MANAGE INVITE MEMBER STATUS <== #
  // #=====================================#
  @ApiOkResponse({ type: InviteMemberEntity })
  @Put('/:id/status')
  manageInviteMemberStatus(
    @Req() req: TRequest,
    @Param('id') inviteMemberId: string,
    @Body() payload: ManageInviteMemberStatusDto,
  ) {
    return this.service.manageInviteMemberStatus(req, inviteMemberId, payload);
  }

  // #==============================#
  // # ==> DELETE INVITE MEMBER <== #
  // #==============================#
  @ApiOkResponse({ type: InviteMemberEntity })
  @Delete('/:id')
  deleteInviteMember(@Req() req: TRequest, @Param('id') inviteMemberId: string) {
    return this.service.deleteInviteMember(req, inviteMemberId);
  }

  // #======================================#
  // # ==> GET PAGINATED INVITE MEMBERS <== #
  // #======================================#
  @ApiOkResponsePaginated(InviteMemberEntity)
  @Get('/paginated')
  getPaginatedInviteMembers(@Query() queryParams: GetInviteMembersPaginatedDto) {
    return this.service.getPaginatedInviteMembers(queryParams);
  }
}
