import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { BaseService } from '@/common/base.service';
import { RoleEntity } from '@/modules/user/role/role.entity';

@Injectable()
export class RoleService extends BaseService<RoleEntity> {
  constructor(
    @InjectRepository(RoleEntity)
    public readonly repository: EntityRepository<RoleEntity>,
  ) {
    super(repository);
  }
}
