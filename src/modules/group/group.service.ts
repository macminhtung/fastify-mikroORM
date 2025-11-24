import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import type { TRequest } from '@/common/types';
import { GetPaginatedRecordsDto, PaginatedResponseDto } from '@/common/dtos';
import { BaseService } from '@/common/base.service';
import { UserEntity } from '@/modules/user/user.entity';
import { GroupEntity } from '@/modules/group/group.entity';
import { InviteMemberService } from '@/modules/group/invite-member/invite-member.service';
import { InviteMemberEntity } from '@/modules/group/invite-member/invite-member.entity';
import { CreateGroupDto } from '@/modules/group/dtos';

@Injectable()
export class GroupService extends BaseService<GroupEntity> {
  constructor(
    @InjectRepository(GroupEntity)
    public readonly repository: EntityRepository<GroupEntity>,

    private inviteMemberService: InviteMemberService,
  ) {
    super(repository);
  }

  // #======================#
  // # ==> CREATE GROUP <== #
  // #======================#
  async createGroup(req: TRequest, payload: CreateGroupDto): Promise<GroupEntity> {
    const { id: authId } = req.authUser;
    const { name, inviteMemberIds } = payload;

    // Prevent creating if the group's name already exists
    await this.checkConflict({ filter: { ownerId: authId, name } });

    // Start transaction
    const txManager = this.entityManager.fork();
    const resData = await this.handleTransactionAndRelease(
      txManager,

      // Process function
      async () => {
        // Identify the transaction group repository
        const txGroupRepo = txManager.getRepository(GroupEntity);

        // Create new group
        const newGroup = await this.create({
          entityData: {
            name,
            owner: this.entityManager.getReference(UserEntity, authId),
          },
          txRepository: txGroupRepo,
        });

        // Invite members
        if (inviteMemberIds?.length) {
          // Identify the transaction invite-member repository
          const txInviteMemberRepo = txManager.getRepository(InviteMemberEntity);

          // Create new invite-members
          await this.inviteMemberService.createMany({
            listEntityData: [],
            txRepository: txInviteMemberRepo,
          });
        }

        return newGroup;
      },
    );

    return resData;
  }

  // #==============================#
  // # ==> GET PAGINATED GROUPS <== #
  // #==============================#
  async getPaginatedGroups(
    queryParams: GetPaginatedRecordsDto,
  ): Promise<PaginatedResponseDto<GroupEntity>> {
    const paginationData = await this.getPaginatedRecords(queryParams, (qb) => {
      const { keySearch } = queryParams;
      qb.leftJoinAndSelect(`${this.entityName}.groupMembers`, 'GMs');

      // Filter based on keySearch
      if (keySearch) qb.andWhere({ name: { $ilike: `%${keySearch}%` } });
    });

    return paginationData;
  }
}
