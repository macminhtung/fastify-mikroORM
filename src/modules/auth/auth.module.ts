import { Module } from '@nestjs/common';
import { AuthService } from '@/modules/auth/auth.service';
import { AuthController } from '@/modules/auth/auth.controller';
import { UserModule } from '@/modules/user/user.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UserEntity } from '@/modules/user/user.entity';
import { RedisCacheModule } from '@/modules/redis-cache/redis-cache.module';

@Module({
  imports: [MikroOrmModule.forFeature([UserEntity]), UserModule, RedisCacheModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
