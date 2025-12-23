import { Injectable, BadRequestException, HttpStatus } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { hash, compare } from 'bcrypt';
import { ERROR_MESSAGES, DEFAULT_ROLES } from '@/common/constants';
import { ECookieKey, ETokenType } from '@/common/enums';
import type { TRequest } from '@/common/types';
import { BaseService } from '@/common/base.service';
import { UserService } from '@/modules/user/user.service';
import { UserEntity } from '@/modules/user/user.entity';
import { RoleEntity } from '@/modules/user/role/role.entity';
import { UserTokenEntity } from '@/modules/user/user-token/user-token.entity';
import { AuthCacheService } from '@/modules/redis-cache/auth-cache.service';
import {
  UserTokenService,
  EProcessUserTokenMode,
} from '@/modules/user/user-token/user-token.service';
import { JwtService, TVerifyToken, AwsS3Service } from '@/modules/shared/services';

import {
  SignUpDto,
  SignInDto,
  SignInResponseDto,
  RefreshAccessTokenDto,
  UpdatePasswordDto,
  UpdateProfileDto,
  GeneratePreSignedUrlDto,
} from '@/modules/auth/dtos';

@Injectable()
export class AuthService extends BaseService<UserEntity> {
  constructor(
    @InjectRepository(UserEntity)
    public readonly repository: EntityRepository<UserEntity>,

    private userService: UserService,
    private authCacheService: AuthCacheService,
    private userTokenService: UserTokenService,
    private jwtService: JwtService,
    private awsS3Service: AwsS3Service,
  ) {
    super(repository);
  }

  // #==================================#
  // # ==> VERIFY TOKEN AND CACHING <== #
  // #==================================#
  async verifyTokenAndCaching<T extends ETokenType>(
    payload: TVerifyToken<T> & { errorMessage?: string },
  ): Promise<UserEntity> {
    const { type, token, errorMessage } = payload;

    // Verify token
    const decodeToken = this.jwtService.verifyToken({ type, token });
    const { id: userId } = decodeToken;

    // Generate hashToken
    const hashToken = this.userTokenService.generateHashToken(token);

    // Get token cache data from redis
    const tokenCache = await this.authCacheService.getTokenCache({
      userId: decodeToken.id,
      hashToken,
    });

    // CASE: Token cache data already exists ==> Return cache data
    if (tokenCache) return tokenCache;

    // Check user already exists
    const existedUser = await this.checkExist({
      filter: { id: userId, userTokens: { type, hashToken } },
      options: {
        fields: [
          'id',
          'avatar',
          'email',
          'password',
          'firstName',
          'lastName',
          'roleId',
          'isEmailVerified',
        ],
      },
      errorMessage,
    });

    // Set the token cache data to redis
    await this.authCacheService.setTokenCache({ user: existedUser, type, hashToken });

    return existedUser;
  }

  // #================================#
  // # ==> GENERATE HASH PASSWORD <== #
  // #================================#
  async generateHashPassword(password: string): Promise<string> {
    const hashPassword = await hash(password, 10);
    return hashPassword;
  }

  // #===============================#
  // # ==> COMPARE HASH PASSWORD <== #
  // #===============================#
  async compareHashPassword(payload: { password: string; hashPassword: string }): Promise<boolean> {
    const { password, hashPassword } = payload;
    return await compare(password, hashPassword);
  }

  // #=======================================#
  // # ==> SET REFRESH_TOKEN INTO COOKIE <== #
  // #=======================================#
  setRefreshTokenIntoCookie(reply: FastifyReply, refreshToken: string) {
    const isProductionMode = process.env.NODE_ENV === 'prod';

    reply.setCookie(ECookieKey.REFRESH_TOKEN, refreshToken, {
      domain: isProductionMode ? process.env.DOMAIN : undefined,
      secure: isProductionMode,
      httpOnly: isProductionMode,
      sameSite: isProductionMode ? 'strict' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  // #================#
  // # ==> SIGNUP <== #
  // #================#
  async signUp(payload: SignUpDto): Promise<UserEntity> {
    const { email, password, firstName, lastName } = payload;

    // Check if email has conflict
    await this.checkConflict({ filter: { email } });

    // Hash the password
    const hashPassword = await this.generateHashPassword(password);

    // Create a new user
    const newUser = await this.create({
      entityData: {
        email,
        password: hashPassword,
        firstName,
        lastName,
        isEmailVerified: true,
        role: this.entityManager.getReference(RoleEntity, DEFAULT_ROLES.USER.id),
      },
    });

    return newUser;
  }

  // #================#
  // # ==> SIGNIN <== #
  // #================#
  async signIn(res: FastifyReply, payload: SignInDto): Promise<SignInResponseDto> {
    const { email, password } = payload;

    // Check email already exists
    const existedUser = await this.checkExist({
      filter: { email, isEmailVerified: true },
      options: { fields: ['id', 'email', 'password', 'firstName', 'lastName', 'roleId'] },
    });
    const { id } = existedUser;

    // Check password is valid
    const isValidPassword = await this.compareHashPassword({
      password,
      hashPassword: existedUser.password,
    });
    if (!isValidPassword)
      throw new BadRequestException({ message: ERROR_MESSAGES.PASSWORD_INCORRECT });

    // Generate new accessToken
    const commonTokenPayload = { id, email };
    const newAccessToken = this.jwtService.generateToken({
      tokenPayload: { ...commonTokenPayload, type: ETokenType.ACCESS_TOKEN },
    });

    // Generate new refreshToken
    const newRefreshToken = this.jwtService.generateToken({
      tokenPayload: { ...commonTokenPayload, type: ETokenType.REFRESH_TOKEN },
    });

    // Start transaction
    const txManager = this.entityManager.fork();
    await this.handleTransactionAndRelease(
      txManager,

      // Process function
      async () => {
        // Identify the transaction repository
        const txRepository = txManager.getRepository(UserTokenEntity);

        // Store user tokens
        await this.userTokenService.processUserToken({
          mode: EProcessUserTokenMode.CREATE_NEW_TOKEN_PAIR,
          txRepository,
          user: existedUser,
          newRefreshToken,
          newAccessToken,
        });
      },
    );

    // Set refreshToken into cookie
    this.setRefreshTokenIntoCookie(res, newRefreshToken);

    return { accessToken: newAccessToken };
  }

  // #=================#
  // # ==> SIGNOUT <== #
  // #=================#
  async signOut(req: TRequest, res: FastifyReply): Promise<HttpStatus> {
    const { id: authId } = req.authUser;
    const refreshToken = req.cookies[ECookieKey.REFRESH_TOKEN]!;

    // Check the refreshToken already exist
    const { id: refreshTokenId } = await this.userTokenService.checkExist({
      filter: {
        userId: authId,
        type: ETokenType.REFRESH_TOKEN,
        hashToken: this.userTokenService.generateHashToken(refreshToken),
      },
    });

    //  Process user tokens
    await this.userTokenService.processUserToken({
      mode: EProcessUserTokenMode.DELETE_TOKEN_PAIR,
      userId: authId,
      refreshTokenId,
    });

    // Clear refreshToken into cookie
    this.setRefreshTokenIntoCookie(res, '');

    return HttpStatus.OK;
  }

  // #==============================#
  // # ==> REFRESH ACCESS TOKEN <== #
  // #==============================#
  async refreshAccessToken(
    req: TRequest,
    payload: RefreshAccessTokenDto,
  ): Promise<SignInResponseDto> {
    const refreshToken = req.cookies[ECookieKey.REFRESH_TOKEN]!;
    const { accessToken } = payload;

    // [JWT] Verify refreshToken
    const decodeToken = this.jwtService.verifyToken({
      type: ETokenType.REFRESH_TOKEN,
      token: refreshToken,
    });
    const { id: userId, email } = decodeToken;

    // [JWT] Verify accessToken has expired
    try {
      // ==> Should be throw jwt expired error
      this.jwtService.verifyToken({ type: ETokenType.ACCESS_TOKEN, token: accessToken });

      // ==> Not throw jwt expired ==> This means the token is still alive
      return { accessToken: accessToken };
    } catch (error) {
      if (error.message !== 'jwt expired')
        throw new BadRequestException({ message: ERROR_MESSAGES.ACCESS_TOKEN_INVALID });
    }

    // [DATABASE] Check the refreshToken already exists
    const { id: refreshTokenId } = await this.userTokenService.checkExist({
      filter: {
        userId,
        type: ETokenType.REFRESH_TOKEN,
        hashToken: this.userTokenService.generateHashToken(refreshToken),
      },
      errorMessage: ERROR_MESSAGES.REFRESH_TOKEN_INVALID,
    });

    // [DATABASE] Check the accessToken already exists
    const hashAccessToken = this.userTokenService.generateHashToken(accessToken);
    await this.userTokenService.checkExist({
      filter: {
        userId,
        type: ETokenType.ACCESS_TOKEN,
        hashToken: hashAccessToken,
        refreshTokenId,
      },
      errorMessage: ERROR_MESSAGES.ACCESS_TOKEN_INVALID,
    });

    // Generate new accessToken
    const newAccessToken = this.jwtService.generateToken({
      tokenPayload: { id: userId, email, type: ETokenType.ACCESS_TOKEN },
    });

    // Start transaction
    const txManager = this.entityManager.fork();
    await this.handleTransactionAndRelease(
      txManager,

      // Process function
      async () => {
        // Identify the transaction repository
        const txRepository = txManager.getRepository(UserTokenEntity);

        // Store new accessToken
        await this.userTokenService.processUserToken({
          mode: EProcessUserTokenMode.REFRESH_ACCESS_TOKEN,
          txRepository,
          userId,
          refreshTokenId,
          newAccessToken,
          oldHashAccessToken: hashAccessToken,
        });
      },
    );

    return { accessToken: newAccessToken };
  }

  // #=========================#
  // # ==> UPDATE PASSWORD <== #
  // #=========================#
  async updatePassword(
    req: TRequest,
    res: FastifyReply,
    payload: UpdatePasswordDto,
  ): Promise<SignInResponseDto> {
    const { id: authId, email, password } = req.authUser;
    const { oldPassword, newPassword } = payload;

    // Compare hashPassword with oldPassword
    const isCorrectPassword = await this.compareHashPassword({
      password: oldPassword,
      hashPassword: password,
    });
    if (!isCorrectPassword)
      throw new BadRequestException({ message: ERROR_MESSAGES.PASSWORD_INCORRECT });

    const isReusedPassword = await this.compareHashPassword({
      password: newPassword,
      hashPassword: password,
    });
    if (isReusedPassword)
      throw new BadRequestException({ message: ERROR_MESSAGES.PASSWORD_REUSED });

    // Generate newHashPassword
    const newHashPassword = await this.generateHashPassword(newPassword);

    // Generate accessToken
    const commonTokenPayload = { id: authId, email };
    const newAccessToken = this.jwtService.generateToken({
      tokenPayload: { ...commonTokenPayload, type: ETokenType.ACCESS_TOKEN },
    });

    // Generate refreshToken
    const newRefreshToken = this.jwtService.generateToken({
      tokenPayload: { ...commonTokenPayload, type: ETokenType.REFRESH_TOKEN },
    });

    // Start transaction
    const txManager = this.entityManager.fork();
    await this.handleTransactionAndRelease(
      txManager,

      // Process function
      async () => {
        // Identify the transaction repository
        const txUserRepository = txManager.getRepository(UserEntity);
        const txTokenManagementRepository = txManager.getRepository(UserTokenEntity);

        // Set new password
        await this.userService.update({
          filter: { id: authId },
          entityData: { password: newHashPassword },
          txRepository: txUserRepository,
        });

        //  Process user tokens
        await this.userTokenService.processUserToken({
          mode: EProcessUserTokenMode.RESET_AND_CREATE_NEW_TOKEN_PAIR,
          txRepository: txTokenManagementRepository,
          user: req.authUser,
          newRefreshToken,
          newAccessToken,
        });
      },
    );

    // Set refreshToken into cookie
    this.setRefreshTokenIntoCookie(res, newRefreshToken);

    return { accessToken: newAccessToken };
  }

  // #=====================#
  // # ==> GET PROFILE <== #
  // #=====================#
  getProfile(req: TRequest): UserEntity {
    return { ...req.authUser, password: '' };
  }

  // #========================#
  // # ==> UPDATE PROFILE <== #
  // #========================#
  async updateProfile(req: TRequest, payload: UpdateProfileDto): Promise<UpdateProfileDto> {
    await this.update({ filter: { id: req.authUser.id }, entityData: payload });
    return payload;
  }

  // # =============================== #
  // # ==> GENERATE PRE-SIGNED URL <== #
  // # =============================== #
  async generatePreSignedUrl(req: TRequest, payload: GeneratePreSignedUrlDto): Promise<string> {
    const { id: authId } = req.authUser;
    const { filename, contentType } = payload;

    return await this.awsS3Service.generatePreSignedUrl({
      key: `${authId}/${filename}`,
      contentType,
    });
  }
}
