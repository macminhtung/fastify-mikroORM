import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UserEntity } from '@/modules/user/user.entity';
import { UserService } from '@/modules/user/user.service';
import { UserController } from '@/modules/user/user.controller';
import { RoleEntity } from '@/modules/user/role/role.entity';
import { RoleService } from '@/modules/user/role/role.service';
import { UserTokenEntity } from '@/modules/user/user-token/user-token.entity';
import { UserTokenService } from '@/modules/user/user-token/user-token.service';

@Module({
  imports: [MikroOrmModule.forFeature([UserEntity, RoleEntity, UserTokenEntity])],
  controllers: [UserController],
  providers: [UserService, RoleService, UserTokenService],
  exports: [UserService, RoleService, UserTokenService],
})
export class UserModule {}
