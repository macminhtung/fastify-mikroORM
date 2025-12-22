import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { ERROR_MESSAGES } from '@/common/constants';
import { ETokenType } from '@/common/enums';
import type { VerifyErrors, SignOptions } from 'jsonwebtoken';
import type { TEnvConfiguration } from '@/config';

export const ACCESS_TOKEN_EXPIRES_IN = 10 * 60 * 1000; // ==> 10 minutes
export const REFRESH_TOKEN_EXPIRES_IN = 30 * 24 * 60 * 60 * 1000; // ==> 30 days

type TDecodeToken<T extends ETokenType> = { type: T; token: string };

type TTokenPayload<T extends ETokenType> = {
  type: T;
  id: string;
  email: string;
};

type TGenerateToken<T extends ETokenType> = {
  tokenPayload: TTokenPayload<T>;
  options?: SignOptions;
};

export type TVerifyToken<T extends ETokenType> = TDecodeToken<T>;

@Injectable()
export class JwtService {
  constructor(private configService: ConfigService<TEnvConfiguration>) {
    // Update jwtSecretKey
    this.jwtSecretKey = this.configService.get('jwtSecretKey')!;
  }
  private jwtSecretKey: TEnvConfiguration['jwtSecretKey'];

  decodeToken<T extends ETokenType>(payload: TVerifyToken<T>): TTokenPayload<T>;
  decodeToken<T extends ETokenType>(payload: TVerifyToken<T>) {
    const decoded = jwt.decode(payload.token, { json: true }) || {};
    return decoded;
  }

  generateToken<T extends ETokenType>(payload: TGenerateToken<T>) {
    const { tokenPayload, options } = payload;
    return jwt.sign(
      tokenPayload,
      this.jwtSecretKey,
      options || {
        expiresIn:
          tokenPayload.type === ETokenType.ACCESS_TOKEN
            ? ACCESS_TOKEN_EXPIRES_IN
            : REFRESH_TOKEN_EXPIRES_IN,
      },
    );
  }

  verifyToken<T extends ETokenType>(payload: TVerifyToken<T>) {
    const { type, token } = payload;
    // Verify the ACCESS_TOKEN type is valid
    if (
      type === ETokenType.ACCESS_TOKEN &&
      this.decodeToken({ type: ETokenType.ACCESS_TOKEN, token }).type !== type
    ) {
      throw new BadRequestException({ message: ERROR_MESSAGES.ACCESS_TOKEN_INVALID });
    }

    // Verify the REFRESH_TOKEN type is valid
    else if (
      type === ETokenType.REFRESH_TOKEN &&
      this.decodeToken({ type: ETokenType.REFRESH_TOKEN, token }).type !== type
    ) {
      throw new BadRequestException({ message: ERROR_MESSAGES.REFRESH_TOKEN_INVALID });
    }

    // Verify token
    jwt.verify(token, this.jwtSecretKey, (err: VerifyErrors) => {
      if (err) throw new BadRequestException({ message: err.message });
    });

    // Decode token
    return this.decodeToken(payload);
  }
}
