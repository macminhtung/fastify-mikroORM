import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { ETableName, ETokenType } from '@/common/enums';
import { UserEntity } from '@/modules/user/user.entity';
import { ACCESS_TOKEN_EXPIRES_IN } from '@/modules/shared/services';

const USER_TTL = 1 * 24 * 60 * 60 * 1000; // ==> 1 day

@Injectable()
export class RedisCacheService implements OnModuleInit {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly logger: Logger,
  ) {}

  // #============================#
  // # ==> CHECK REDIS HEALTH <== #
  // #============================#
  async onModuleInit() {
    const healthCheckKey = '__redis_healthcheck__';
    await this.cacheManager.set(healthCheckKey, '');
    const value = await this.cacheManager.get(healthCheckKey);

    if (value === undefined) {
      this.logger.error('❌ Redis connection failed', 'RedisCache');
    } else {
      this.logger.log('✅ Redis connection verified', 'RedisCache');
      this.cacheManager.del('__redis_healthcheck__');
    }
  }

  // #===============================#
  // # ==> GET CACHE DATA BY KEY <== #
  // #===============================#
  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  // #===============================#
  // # ==> SET CACHE DATA BY KEY <== #
  // #===============================#
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  // #==================================#
  // # ==> DELETE CACHE DATA BY KEY <== #
  // #==================================#
  async delete(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  // #========================#
  // # ==> GET AUTH CACHE <== #
  // #========================#
  async getAuthCache(payload: { userId: string; hashToken: string }): Promise<UserEntity | null> {
    const { userId, hashToken } = payload;

    // Get user cache from redis
    const userCacheKey = `${ETableName.USERS}/${userId}`;
    const userCache = await this.get<UserEntity>(userCacheKey);

    // CASE: Have no userCache
    if (!userCache) return null;

    // Get token cache from redis
    const tokenCacheKey = `${userCacheKey}/${hashToken}`;
    const tokenCache = await this.get<boolean>(tokenCacheKey);

    // CASE: Have no tokenCache
    if (!tokenCache) return null;

    // CASE: Cache data already exists
    return userCache;
  }

  // #========================#
  // # ==> SET AUTH CACHE <== #
  // #========================#
  async setAuthCache(payload: {
    user: UserEntity;
    type: ETokenType;
    hashToken: string;
  }): Promise<void> {
    const { user, type, hashToken } = payload;
    const ttl = type === ETokenType.ACCESS_TOKEN ? ACCESS_TOKEN_EXPIRES_IN : USER_TTL;

    // Get cache user from redis
    const userCacheKey = `${ETableName.USERS}/${user.id}`;
    const userCache = await this.get<UserEntity>(userCacheKey);

    // CASE: Have no userCache ==> Set new authCache
    if (!userCache) await this.set<UserEntity>(userCacheKey, user, USER_TTL);

    // CASE: Add more tokenCache
    const tokenCacheKey = `${userCacheKey}/${hashToken}`;
    await this.set<boolean>(tokenCacheKey, true, ttl);
  }

  // #===========================#
  // # ==> DELETE AUTH CACHE <== #
  // #===========================#
  async deleteAuthCache(payload: {
    userId: string;
    hashTokens: string[];
    isDeleteUserCache?: boolean;
  }): Promise<void> {
    const { userId, hashTokens, isDeleteUserCache } = payload;
    const cacheUserKey = `${ETableName.USERS}/${userId}`;
    if (isDeleteUserCache) await this.delete(cacheUserKey);

    // Delete auth cache keys
    await Promise.all(hashTokens.map((hashToken) => this.delete(`${cacheUserKey}/${hashToken}`)));
  }
}
