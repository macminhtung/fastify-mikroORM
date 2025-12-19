import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis, { RedisClientOptions } from '@keyv/redis';
import type { TEnvConfiguration } from '@/config';
import { RedisCacheService } from '@/modules/redis-cache/redis-cache.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<TEnvConfiguration>) => {
        const { host, port, password, username, ttl } =
          configService.get<TEnvConfiguration['redis']>('redis')!;
        const redisOption: RedisClientOptions = {
          socket: {
            host,
            port,
            reconnectStrategy: (retries) => Math.min(retries * 50, 3000), // Exponential backoff, max 3s
          },
          username,
          password,
          database: 0,
        };

        return { stores: [new KeyvRedis(redisOption)], ttl };
      },
    }),
  ],
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class RedisCacheModule {}
