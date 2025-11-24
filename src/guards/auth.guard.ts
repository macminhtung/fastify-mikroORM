import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { TRequest } from '@/common/types';
import { EMetadataKey } from '@/common/enums';
import { AuthService } from '@/modules/auth/auth.service';
import { ETokenType } from '@/common/enums';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get token from request
    const request = context.switchToHttp().getRequest<TRequest>();
    const accessToken = request.headers?.authorization?.replace('Bearer ', '') || '';

    // #==========================#
    // # ==> CASE: PUBLIC API <== #
    // #==========================#
    const isPublicAPI = this.reflector.get<boolean>(EMetadataKey.PUBLIC, context.getHandler());
    if (isPublicAPI && !accessToken) return true;

    // #==================================#
    // # ==> CASE: CHECK ACCESS TOKEN <== #
    // #==================================#
    const authUser = await this.authService.checkToken({
      type: ETokenType.ACCESS_TOKEN,
      token: accessToken,
    });

    // Update authUser for the request
    request.authUser = authUser;

    return true;
  }
}
