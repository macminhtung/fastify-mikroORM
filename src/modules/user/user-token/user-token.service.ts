import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import crypto from 'crypto';
import { BaseService } from '@/common/base.service';

import { ETokenType } from '@/common/enums';
import { UserEntity } from '@/modules/user/user.entity';
import { UserTokenEntity } from '@/modules/user/user-token/user-token.entity';

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
    }
  | {
      mode: EProcessUserTokenMode.DELETE_TOKEN_PAIR | EProcessUserTokenMode.REFRESH_ACCESS_TOKEN;
      refreshTokenId: string;
    }
) & {
  txRepository?: EntityRepository<UserTokenEntity>;
  userId: string;
  newAccessToken: string;
};

@Injectable()
export class UserTokenService extends BaseService<UserTokenEntity> {
  constructor(
    @InjectRepository(UserTokenEntity)
    public readonly repository: EntityRepository<UserTokenEntity>,
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
    const { mode, txRepository, userId, newAccessToken } = payload;

    if (
      mode === EProcessUserTokenMode.DELETE_TOKEN_PAIR ||
      mode === EProcessUserTokenMode.REFRESH_ACCESS_TOKEN
    ) {
      const { refreshTokenId } = payload;

      // Delete [OLD] accessToken
      if (mode === EProcessUserTokenMode.REFRESH_ACCESS_TOKEN) {
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
      }

      // Delete token pair (refresh & access token)
      else
        await this.delete({ filter: [{ id: refreshTokenId }, { refreshTokenId }], txRepository });
    }

    // Create [NEW] refreshToken
    else if (
      mode === EProcessUserTokenMode.RESET_AND_CREATE_NEW_TOKEN_PAIR ||
      mode === EProcessUserTokenMode.CREATE_NEW_TOKEN_PAIR
    ) {
      // Clear all tokens belong to the userId
      if (mode === EProcessUserTokenMode.RESET_AND_CREATE_NEW_TOKEN_PAIR)
        await this.delete({ filter: { userId }, txRepository });

      // Create [NEW] refreshToken
      const { id: refreshTokenId } = await this.create({
        entityData: {
          user: this.entityManager.getReference(UserEntity, userId),
          type: ETokenType.REFRESH_TOKEN,
          hashToken: this.generateHashToken(payload.newRefreshToken),
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
    }
  }
}
