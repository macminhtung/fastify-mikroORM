import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { BaseService } from '@/common/base.service';
import { GroupMemberEntity } from '@/modules/group/group-member/group-member.entity';

@Injectable()
export class GroupMemberService extends BaseService<GroupMemberEntity> {
  constructor(
    @InjectRepository(GroupMemberEntity)
    public readonly repository: EntityRepository<GroupMemberEntity>,
  ) {
    super(repository);
  }
}
