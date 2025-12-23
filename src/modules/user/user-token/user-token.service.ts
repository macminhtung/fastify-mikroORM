import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import crypto from 'crypto';
import { BaseService } from '@/common/base.service';
import { ETokenType } from '@/common/enums';
import { UserTokenEntity } from '@/modules/user/user-token/user-token.entity';
import { AuthCacheService } from '@/modules/redis-cache/auth-cache.service';
import { UserService } from '@/modules/user/user.service';
import { UserEntity } from '@/modules/user/user.entity';

export enum EProcessUserTokenMode {
  RESET_AND_CREATE_NEW_TOKEN_PAIR = 'RESET_AND_CREATE_NEW_TOKEN_PAIR',
  CREATE_NEW_TOKEN_PAIR = 'CREATE_NEW_TOKEN_PAIR',
  DELETE_TOKEN_PAIR = 'DELETE_TOKEN_PAIR',
  REFRESH_ACCESS_TOKEN = 'REFRESH_ACCESS_TOKEN',
}

type TStoreNewTokenPair = (
  | {
      mode:
        | EProcessUserTokenMode.RESET_AND_CREATE_NEW_TOKEN_PAIR
        | EProcessUserTokenMode.CREATE_NEW_TOKEN_PAIR;
      newRefreshToken: string;
      newAccessToken: string;
      user: UserEntity;
    }
  | {
      mode: EProcessUserTokenMode.DELETE_TOKEN_PAIR;
      refreshTokenId: string;
      userId: string;
    }
  | {
      mode: EProcessUserTokenMode.REFRESH_ACCESS_TOKEN;
      refreshTokenId: string;
      newAccessToken: string;
      oldHashAccessToken: string;
      userId: string;
    }
) & {
  txRepository?: EntityRepository<UserTokenEntity>; // Use for run with transaction
};

@Injectable()
export class UserTokenService extends BaseService<UserTokenEntity> {
  constructor(
    @InjectRepository(UserTokenEntity)
    public readonly repository: EntityRepository<UserTokenEntity>,

    private authCacheService: AuthCacheService,
    private userService: UserService,
  ) {
    super(repository);
  }

  // #=============================#
  // # ==> GENERATE HASH TOKEN <== #
  // #=============================#
  generateHashToken(token: string) {
    const hashToken = crypto.createHash('sha256').update(token).digest('hex');
    return hashToken;
  }

  // #============================#
  // # ==> PROCESS USER TOKEN <== #
  // #============================#
  async processUserToken(payload: TStoreNewTokenPair) {
    const { mode, txRepository } = payload;

    // Delete [OLD] accessToken
    if (mode === EProcessUserTokenMode.REFRESH_ACCESS_TOKEN) {
      const { newAccessToken, refreshTokenId, userId, oldHashAccessToken } = payload;

      // Delete [OLD] accessToken
      await this.delete({ filter: { refreshTokenId }, txRepository });

      // Create [NEW] accessToken
      await this.create({
        entityData: {
          user: this.entityManager.getReference(UserEntity, userId),
          type: ETokenType.ACCESS_TOKEN,
          hashToken: this.generateHashToken(newAccessToken),
          refreshTokenId,
        },
        txRepository,
      });

      // Identify the existedUser
      const existedUser =
        (await this.authCacheService.getUserCache(userId)) ||
        (await this.userService.checkExist({
          filter: { id: userId },
          options: { fields: ['id', 'email', 'password', 'firstName', 'lastName', 'roleId'] },
        }));

      // Set new accessToken cache
      await this.authCacheService.setTokenCache({
        user: existedUser,
        type: ETokenType.ACCESS_TOKEN,
        hashToken: this.generateHashToken(newAccessToken),
      });

      // Delete old token cache
      await this.authCacheService.deleteTokenCache({
        userId,
        hashTokens: [oldHashAccessToken],
      });
    }

    // Delete token pair (refresh & access token)
    else if (mode === EProcessUserTokenMode.DELETE_TOKEN_PAIR) {
      const { refreshTokenId, userId } = payload;

      // Get the token pair
      const tokens = await this.repository.find(
        { $or: [{ id: refreshTokenId }, { refreshTokenId }] },
        { fields: ['id', 'hashToken'] },
      );

      // Delete the token pair
      await this.delete({ filter: [tokens.map((i) => i.id)], txRepository });

      // Delete token pair caches
      const delHashTokens = tokens.map(({ hashToken }) => hashToken);
      await this.authCacheService.deleteTokenCache({ userId, hashTokens: delHashTokens });
    }

    // CASE: ==> RESET_AND_CREATE_NEW_TOKEN_PAIR | CREATE_NEW_TOKEN_PAIR <==
    else if (
      mode === EProcessUserTokenMode.RESET_AND_CREATE_NEW_TOKEN_PAIR ||
      mode === EProcessUserTokenMode.CREATE_NEW_TOKEN_PAIR
    ) {
      const { newRefreshToken, newAccessToken, user } = payload;
      const { id: userId } = user;

      // CASE: ==> RESET_AND_CREATE_NEW_TOKEN_PAIR
      if (mode === EProcessUserTokenMode.RESET_AND_CREATE_NEW_TOKEN_PAIR) {
        // Clear all tokens belong to the userId
        const allTokens = await this.repository.find({ userId }, { fields: ['id', 'hashToken'] });
        await this.delete({ filter: allTokens.map((i) => i.id), txRepository });

        // Delete all token caches
        const delHashTokens = allTokens.map(({ hashToken }) => hashToken);
        await this.authCacheService.deleteTokenCache({ userId, hashTokens: delHashTokens });
      }

      // Create [NEW] refreshToken
      const { id: refreshTokenId } = await this.create({
        entityData: {
          user: this.entityManager.getReference(UserEntity, userId),
          type: ETokenType.REFRESH_TOKEN,
          hashToken: this.generateHashToken(newRefreshToken),
        },
        txRepository,
      });

      // Create [NEW] accessToken
      await this.create({
        entityData: {
          user: this.entityManager.getReference(UserEntity, userId),
          type: ETokenType.ACCESS_TOKEN,
          hashToken: this.generateHashToken(newAccessToken),
          refreshTokenId,
        },
        txRepository,
      });

      // Set the accessToken & refreshToken cache to redis
      await this.authCacheService.setTokenCache({
        type: 'PAIR',
        user,
        hashAccessToken: this.generateHashToken(newAccessToken),
        hashRefreshToken: this.generateHashToken(newRefreshToken),
      });
    }
  }
}
