import { Injectable } from '@nestjs/common';
import { ETableName, ETokenType } from '@/common/enums';
import { UserEntity } from '@/modules/user/user.entity';
import { ACCESS_TOKEN_EXPIRES_IN } from '@/modules/shared/services';
import { RedisCacheService } from '@/modules/redis-cache/redis-cache.service';

const DEFAULT_TTL = 1 * 24 * 60 * 60 * 1000; // ==> 1 day

type TGetTokenCachePayload = { userId: string; hashToken: string };
type TSetTokenCachePayload = { user: UserEntity } & (
  | { type: ETokenType; hashToken: string }
  | { type: 'PAIR'; hashAccessToken: string; hashRefreshToken: string }
);
type TDeleteTokenCachePayload = { userId: string; hashTokens: string[] };

@Injectable()
export class AuthCacheService {
  constructor(private redisCacheService: RedisCacheService) {}
  // #========================#
  // # ==> GET USER CACHE <== #
  // #========================#
  async getUserCache(userId: string): Promise<UserEntity | undefined> {
    return await this.redisCacheService.get<UserEntity | undefined>(`${ETableName.USER}/${userId}`);
  }

  // #========================#
  // # ==> SET USER CACHE <== #
  // #========================#
  async setUserCache(user: UserEntity): Promise<void> {
    await this.redisCacheService.set(`${ETableName.USER}/${user.id}`, user, DEFAULT_TTL);
  }

  // #=========================#
  // # ==> GET TOKEN CACHE <== #
  // #=========================#
  async getTokenCache(payload: TGetTokenCachePayload): Promise<UserEntity | undefined> {
    const { userId, hashToken } = payload;

    // Get user cache from redis
    const userCache = await this.getUserCache(userId);

    // CASE: Have no userCache
    if (!userCache) return undefined;

    // Get token cache from redis
    const tokenCacheKey = `${ETableName.USER}/${userId}/${hashToken}`;
    const tokenCache = await this.redisCacheService.get<boolean>(tokenCacheKey);

    // CASE: Have no tokenCache
    if (!tokenCache) return undefined;

    // CASE: Cache data already exists
    return userCache;
  }

  // #=========================#
  // # ==> SET TOKEN CACHE <== #
  // #=========================#
  async setTokenCache(payload: TSetTokenCachePayload): Promise<void> {
    const { user, type } = payload;
    const userCacheKey = `${ETableName.USER}/${user.id}`;

    // Add one of token cache
    if (type !== 'PAIR') {
      // CASE: Add token to cache
      const tokenCacheKey = `${userCacheKey}/${payload.hashToken}`;
      await this.redisCacheService.set<boolean>(
        tokenCacheKey,
        true,
        type === ETokenType.ACCESS_TOKEN ? ACCESS_TOKEN_EXPIRES_IN * 1000 : DEFAULT_TTL,
      );
    }

    // Add token-pair to the cache
    else {
      const { hashAccessToken, hashRefreshToken } = payload;

      // CASE: Add access-token and refresh-token cache
      await Promise.all([
        this.redisCacheService.set<boolean>(
          `${userCacheKey}/${hashAccessToken}`,
          true,
          ACCESS_TOKEN_EXPIRES_IN * 1000,
        ),
        this.redisCacheService.set<boolean>(
          `${userCacheKey}/${hashRefreshToken}`,
          true,
          DEFAULT_TTL,
        ),
      ]);
    }

    // Get cache user from redis
    const userCache = await this.redisCacheService.get<UserEntity>(userCacheKey);

    // CASE: Have no userCache ==> Set new authCache
    if (!userCache) await this.setUserCache(user);
  }

  // #============================#
  // # ==> DELETE TOKEN CACHE <== #
  // #============================#
  async deleteTokenCache(payload: TDeleteTokenCachePayload): Promise<void> {
    const { userId, hashTokens } = payload;

    // Delete token cache keys
    await Promise.all(
      hashTokens.map((hashToken) =>
        this.redisCacheService.delete(`${ETableName.USER}/${userId}/${hashToken}`),
      ),
    );
  }
}
