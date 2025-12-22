import { Controller, Post, Get, Put, Delete, Param, Query, Body } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { Roles } from '@/decorators';
import { ETableName } from '@/common/enums';
import { DEFAULT_ROLES } from '@/common/constants';
import { ApiOkResponsePaginated } from '@/common/dtos';
import { UserService } from '@/modules/user/user.service';
import { UserEntity } from '@/modules/user/user.entity';
import { UpdateUserDto, GetUsersPaginatedDto } from '@/modules/user/dtos';

@Controller(ETableName.USER)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // #=====================#
  // # ==> UPDATE USER <== #
  // #=====================#
  @Roles([DEFAULT_ROLES.ADMIN.id])
  @ApiOkResponse({ type: UserEntity })
  @Put(':id')
  updateUser(@Param('id') id: string, @Body() payload: UpdateUserDto) {
    return this.userService.updateUser(id, payload);
  }

  // #==================#
  // # ==> GET USER <== #
  // #==================#
  @Roles([DEFAULT_ROLES.ADMIN.id])
  @ApiOkResponsePaginated(UserEntity)
  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.userService.getUser(id);
  }

  // #=====================#
  // # ==> DELETE USER <== #
  // #=====================#
  @Roles([DEFAULT_ROLES.ADMIN.id])
  @ApiOkResponse({ type: UserEntity })
  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }

  // #======================#
  // # ==> RESTORE USER <== #
  // #======================#
  @Roles([DEFAULT_ROLES.ADMIN.id])
  @ApiOkResponse({ type: UserEntity })
  @Post(':id')
  restoreUser(@Param('id') id: string) {
    return this.userService.restoreUser(id);
  }

  // #=============================#
  // # ==> GET PAGINATED USERS <== #
  // #=============================#
  @Roles([DEFAULT_ROLES.ADMIN.id])
  @ApiOkResponsePaginated(UserEntity)
  @Get('/paginated')
  getPaginatedUsers(@Query() queryParams: GetUsersPaginatedDto) {
    return this.userService.getPaginatedUsers(queryParams);
  }
}
