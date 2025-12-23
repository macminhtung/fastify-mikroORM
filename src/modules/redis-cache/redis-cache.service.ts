import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { Cache } from 'cache-manager';

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
}
