import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { loadENVsFunc, ENV_VALIDATION } from '@/config';
import { ApiLoggingInterceptor } from '@/interceptors';
import { AuthGuard } from '@/guards';
import { ApiExceptionsFilter } from '@/filters';
import { ApiValidationPipe } from '@/pipes';
import { GatewayModule } from '@/modules/gateway/gateway.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { UserModule } from '@/modules/user/user.module';
import { GroupModule } from '@/modules/group/group.module';
import { ProductModule } from '@/modules/product/product.module';
import { SharedModule } from '@/modules/shared/shared.module';
import { ElasticModule } from '@/modules/elastic/elastic.module';
import { MikroORMModule } from '@/modules/mikro-orm/mikro-orm.module';
import { RedisCacheModule } from '@/modules/redis-cache/redis-cache.module';

@Module({
  imports: [
    // #=======================#
    // # ==> CONFIG MODULE <== #
    // #=======================#
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env',
      load: [loadENVsFunc],
      validationSchema: ENV_VALIDATION,
    }),

    // #==============================#
    // # ==> ELASTICSEARCH MODULE <== #
    // #==============================#
    ElasticModule,

    // #==========================#
    // # ==> MIKRO_ORM MODULE <== #
    // #==========================#
    MikroORMModule,

    // #============================#
    // # ==> REDIS CACHE MODULE <== #
    // #============================#
    RedisCacheModule,

    // #========================#
    // # ==> GATEWAY MODULE <== #
    // #========================#
    GatewayModule,

    SharedModule,
    UserModule,
    AuthModule,
    ProductModule,
    GroupModule,
  ],
  providers: [
    // #===================================#
    // # ==> [INTERCEPTOR] API LOGGING <== #
    // #===================================#
    { provide: APP_INTERCEPTOR, useClass: ApiLoggingInterceptor },

    // #================================#
    // # ==> [FILTER] API EXCEPTION <== #
    // #================================#
    { provide: APP_FILTER, useClass: ApiExceptionsFilter },

    // #===============================#
    // # ==> [PIPE] API VALIDATION <== #
    // #===============================#
    { provide: APP_PIPE, useClass: ApiValidationPipe },

    // #====================================#
    // # ==> [GUARD] API AUTHENTICATION <== #
    // #====================================#
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
