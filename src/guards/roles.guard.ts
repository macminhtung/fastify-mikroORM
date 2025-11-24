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
    const roleName = request.authUser.role?.name || '';

    // Get context scopeNames
    const contextRoleNames = this.reflector.get<string[]>(EMetadataKey.ROLES, contextFunc);

    return contextRoleNames.includes(roleName);
  }
}
