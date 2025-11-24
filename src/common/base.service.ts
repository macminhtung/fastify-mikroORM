import {
  EntityManager,
  EntityRepository,
  FilterQuery,
  FindOneOptions,
  QueryOrder,
} from '@mikro-orm/postgresql';
import { EntityData, Loaded, RequiredEntityData } from '@mikro-orm/core';
import { v7 as uuidv7 } from 'uuid';
import { ERROR_MESSAGES } from '@/common/constants';
import { EOrder } from '@/common/enums';
import {
  ConflictException,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  GetPaginatedRecordsDto,
  DEFAULT_PAGE_NUM,
  DEFAULT_PAGE_TAKE,
  NUM_LIMIT_RECORDS,
  PaginatedResponseDto,
} from '@/common/dtos';

@Injectable()
export class BaseService<E extends object> {
  constructor(protected readonly repository: EntityRepository<E>) {
    this.entityName = this.repository.getEntityName();
    this.entityManager = this.repository.getEntityManager();
  }

  public entityName: string;
  public entityManager: EntityManager;

  // #=====================#
  // # ==> FIND_RECORD <== #
  // #=====================#
  async findRecord(payload: {
    filter: FilterQuery<E> & { deletedAt?: unknown };
    options?: FindOneOptions<E, Extract<keyof E, string>, Extract<keyof E, string>>;
  }) {
    const { filter, options } = payload;

    // CASE: Filter records with deletedAt IS NOT NULL
    if (!filter.deletedAt) filter.deletedAt = null;

    // Find record
    const existRecord = await this.repository.findOne(filter, options);

    return existRecord;
  }

  // #=====================#
  // # ==> CHECK_EXIST <== #
  // #=====================#
  async checkExist(
    p: Parameters<typeof this.findRecord>[0] & { errorMessage?: string },
  ): Promise<E>;
  async checkExist(
    payload: Parameters<typeof this.findRecord>[0] & { errorMessage?: string },
  ): Promise<E | Loaded<E, Extract<keyof E, string>, Extract<keyof E, string>>> {
    const { filter, options, errorMessage } = payload;

    // Find record
    const existRecord = await this.findRecord({ filter, options });

    // CASE: [NOT_FOUND] Does not existed
    if (!existRecord)
      throw new NotFoundException({
        message: errorMessage || `[${this.entityName}] ${ERROR_MESSAGES.NOT_FOUND}!`,
      });

    return existRecord;
  }

  // #========================#
  // # ==> CHECK_CONFLICT <== #
  // #========================#
  async checkConflict(payload: Parameters<typeof this.findRecord>[0] & { errorMessage?: string }) {
    const { filter, options, errorMessage } = payload;

    // Find record
    const existRecord = await this.findRecord({ filter, options });

    // CASE: [ALREADY_EXISTS] Conflict
    if (existRecord)
      throw new ConflictException({
        message: errorMessage || `[${this.entityName}] ${ERROR_MESSAGES.ALREADY_EXISTS}!`,
      });
  }

  // #=====================#
  // # ==> CREATE MANY <== #
  // #=====================#
  async createMany(payload: {
    listEntityData: RequiredEntityData<E>[];
    txRepository?: EntityRepository<E>;
  }): Promise<E[]> {
    const { listEntityData, txRepository } = payload;

    // Identify the repository
    const repository = txRepository || this.repository;

    // Create the entities
    const entities = listEntityData.map((item) => repository.create({ id: uuidv7(), ...item }));

    // Insert the entities
    await repository.insertMany(entities);

    return entities;
  }

  // #================#
  // # ==> CREATE <== #
  // #================#
  async create(payload: {
    entityData: RequiredEntityData<E>;
    txRepository?: EntityRepository<E>;
  }): Promise<E> {
    const { entityData, txRepository } = payload;

    // Identify the repository
    const repository = txRepository || this.repository;

    // Create the entity
    const entity = repository.create({ id: uuidv7(), ...entityData });

    // Insert the entity
    await repository.insert(entity);

    return entity;
  }

  // #================#
  // # ==> UPDATE <== #
  // #================#
  async update(payload: {
    filter: FilterQuery<E>;
    entityData: EntityData<E>;
    txRepository?: EntityRepository<E>;
  }) {
    const { filter, entityData, txRepository } = payload;

    // Identify the repository
    const repository = txRepository || this.repository;

    // Update the payload
    await repository.createQueryBuilder().update(entityData).where(filter).execute();
  }

  // #=====================#
  // # ==> SOFT DELETE <== #
  // #=====================#
  async softDelete(payload: { filter: FilterQuery<E>; txRepository?: EntityRepository<E> }) {
    const entityData: object = { deletedAt: new Date() };
    await this.update({ ...payload, entityData });
  }

  // #================#
  // # ==> DELETE <== #
  // #================#
  async delete(payload: { filter: FilterQuery<E>; txRepository?: EntityRepository<E> }) {
    const { filter, txRepository } = payload;

    // Identify the repository
    const repository = txRepository || this.repository;

    // CASE: Hard delete
    await repository.createQueryBuilder().delete(filter).execute();
  }

  // #=====================#
  // # ==> TRANSACTION <== #
  // #=====================#
  async handleTransactionAndRelease<T>(
    txManage: EntityManager,
    processFunc: (txManage: EntityManager) => Promise<T>,
    rollbackFunc?: () => void,
  ): Promise<T> {
    // Starts new transaction
    await txManage.begin();

    try {
      // Run processFunc
      const resData = await processFunc(txManage);

      // Commit transaction
      await txManage.commit();

      return resData;
    } catch (err) {
      // Transaction rollback
      await txManage.rollback();

      // Rollback func
      if (rollbackFunc) rollbackFunc();
      throw new BadRequestException({ message: err.message });
    }
  }

  // #===============================#
  // # ==> GET PAGINATED RECORDS <== #
  // #===============================#
  async getPaginatedRecords(
    args: GetPaginatedRecordsDto,
    customFilter?: (queryBuilder: ReturnType<EntityRepository<E>['createQueryBuilder']>) => void,
  ): Promise<PaginatedResponseDto<E>> {
    const {
      isDeleted,
      createdFrom,
      createdTo,
      includeIds = [],
      excludeIds = [],
      isSelectAll,
      order = EOrder.DESC,
      page = DEFAULT_PAGE_NUM,
      take = DEFAULT_PAGE_TAKE,
    } = args;

    const baseQB = this.repository.createQueryBuilder(this.entityName);

    baseQB.where({ deletedAt: null });

    // Query records based on includeIds
    if (includeIds.length) baseQB.where({ id: { $in: includeIds } });

    // Query records based on excludeIds
    if (excludeIds.length) baseQB.andWhere({ id: { $nin: excludeIds } });

    // Query records based on createdFrom
    if (createdFrom) baseQB.andWhere({ createdAt: { $gte: createdFrom } });

    // Query records based on createdTo
    if (createdTo) baseQB.andWhere({ createdAt: { $lte: createdTo } });

    // Query deleted records
    if (isDeleted) baseQB.andWhere({ deletedAt: { $not: null } });
    // Query records are not deleted
    else baseQB.where({ deletedAt: null });

    // Custom filter
    if (customFilter) customFilter(baseQB);

    // Sort records via createdAt
    baseQB.orderBy({ createdAt: order === EOrder.DESC ? QueryOrder.DESC : QueryOrder.ASC });

    if (isSelectAll) baseQB.limit(NUM_LIMIT_RECORDS);
    else baseQB.limit(take).offset((page - 1) * take);

    const [records, count] = await baseQB.getResultAndCount();
    return new PaginatedResponseDto<E>({ args, total: count, records });
  }
}
