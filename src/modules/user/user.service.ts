import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { hash, compare } from 'bcrypt';
import { BaseService } from '@/common/base.service';
import { DEFAULT_ROLES } from '@/common/constants';
import { PaginatedResponseDto } from '@/common/dtos';
import { UserEntity } from '@/modules/user/user.entity';
import { CreateUserDto, UpdateUserDto, GetUsersPaginatedDto } from '@/modules/user/dtos';
import { RoleEntity } from './role/role.entity';

@Injectable()
export class UserService extends BaseService<UserEntity> {
  constructor(
    @InjectRepository(UserEntity)
    public readonly repository: EntityRepository<UserEntity>,
  ) {
    super(repository);
  }

  // #=========================#
  // # ==> RANDOM PASSWORD <== #
  // #=========================#
  randomPassword(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * 62))).join('');
  }

  // #================================#
  // # ==> GENERATE HASH PASSWORD <== #
  // #================================#
  async generateHashPassword(password: string) {
    const hashPassword = await hash(password, 10);
    return hashPassword;
  }

  // #===============================#
  // # ==> COMPARE HASH PASSWORD <== #
  // #===============================#
  async compareHashPassword(payload: { password: string; hashPassword: string }) {
    const { password, hashPassword } = payload;
    return await compare(password, hashPassword);
  }

  // #=====================#
  // # ==> CREATE USER <== #
  // #=====================#
  async createUser(payload: CreateUserDto) {
    const { email, roleId } = payload;
    // Prevent creating if email has conflict
    await this.checkConflict({ filter: { email } });

    // Hash the password
    const temporaryPassword = this.randomPassword(); // TODO: ==> Send the temporaryPassword via email
    const hashPassword = await this.generateHashPassword(temporaryPassword);

    // Create newUser
    const newUser = await this.create({
      entityData: {
        ...payload,
        password: hashPassword,
        role: this.entityManager.getReference(RoleEntity, roleId),
      },
    });

    return newUser;
  }

  // #=====================#
  // # ==> UPDATE USER <== #
  // #=====================#
  async updateUser(id: string, payload: UpdateUserDto): Promise<UserEntity> {
    const existedUser = await this.checkExist({ filter: { id } });
    await this.update({ filter: { id }, entityData: payload });
    return { ...existedUser, ...payload };
  }

  // #==================#
  // # ==> GET USER <== #
  // #==================#
  async getUser(id: string): Promise<UserEntity> {
    const existedUser = await this.checkExist({ filter: { id }, options: { populate: ['role'] } });
    return existedUser;
  }

  // #=====================#
  // # ==> DELETE USER <== #
  // #=====================#
  async deleteUser(id: string): Promise<string> {
    // Check the user already exists
    await this.checkExist({ filter: { id, roleId: { $ne: DEFAULT_ROLES.ADMIN.id } } });

    // Soft delete the user
    await this.softDelete({ filter: { id } });

    return id;
  }

  // #======================#
  // # ==> RESTORE USER <== #
  // #======================#
  async restoreUser(id: string): Promise<UserEntity> {
    // Check the user already exists
    const existedUser = await this.checkExist({
      filter: { id, roleId: { $ne: DEFAULT_ROLES.ADMIN.id }, deletedAt: { $not: null } },
    });

    // Restore the user
    await this.update({ filter: { id }, entityData: { deletedAt: null } });

    return { ...existedUser, deletedAt: undefined };
  }

  // #=============================#
  // # ==> GET PAGINATED USERS <== #
  // #=============================#
  async getPaginatedUsers(
    queryParams: GetUsersPaginatedDto,
  ): Promise<PaginatedResponseDto<UserEntity>> {
    const paginationData = await this.getPaginatedRecords(queryParams, (qb) => {
      const { keySearch, roleIds } = queryParams;

      qb.leftJoinAndSelect(`${this.entityName}.role`, 'R');

      // Filter based on roleIds
      if (roleIds?.length) qb.andWhere({ roleId: { $in: roleIds } });

      // Filter based on keySearch
      if (keySearch) {
        qb.andWhere({
          $or: [
            { firstName: { $ilike: `%${keySearch}%` } },
            { lastName: { $ilike: `%${keySearch}%` } },
          ],
        });
      }
    });

    return paginationData;
  }
}
