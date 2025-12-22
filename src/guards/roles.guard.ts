import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { TRequest } from '@/common/types';
import { EMetadataKey } from '@/common/enums';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const contextFunc = context.getHandler();

    // Check public API
    const isPublicAPI = this.reflector.get(EMetadataKey.PUBLIC, contextFunc);
    if (isPublicAPI) return true;

    const request = context.switchToHttp().getRequest<TRequest>();
    const roleId = request.authUser.roleId || 0;

    // Get context roleIds
    const contextRoleIds = this.reflector.get<number[]>(EMetadataKey.ROLES, contextFunc);

    return contextRoleIds.includes(roleId);
  }
}
