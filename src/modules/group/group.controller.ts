import { Controller, Get, Post, Query, Body, Req } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { ETableName } from '@/common/enums';
import { ApiOkResponsePaginated, GetPaginatedRecordsDto } from '@/common/dtos';
import { GroupService } from '@/modules/group/group.service';
import { GroupEntity } from '@/modules/group/group.entity';
import { CreateGroupDto } from '@/modules/group/dtos';
import type { TRequest } from '@/common/types';

@Controller(ETableName.GROUPS)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  // #======================#
  // # ==> CREATE GROUP <== #
  // #======================#
  @ApiOkResponse({ type: GroupEntity })
  @Post()
  createGroup(@Req() req: TRequest, @Body() payload: CreateGroupDto) {
    return this.groupService.createGroup(req, payload);
  }

  // #==============================#
  // # ==> GET PAGINATED GROUPS <== #
  // #==============================#
  @ApiOkResponsePaginated(GroupEntity)
  @Get('/paginated')
  getPaginatedUsers(@Query() queryParams: GetPaginatedRecordsDto) {
    return this.groupService.getPaginatedGroups(queryParams);
  }
}
