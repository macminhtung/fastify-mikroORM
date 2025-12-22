import {
  Entity,
  PrimaryKey,
  Property,
  Index,
  ManyToOne,
  OneToMany,
  Cascade,
  Unique,
  Collection,
} from '@mikro-orm/core';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ETableName } from '@/common/enums';
import { BaseEntity } from '@/common/base.entity';
import { UserEntity } from '@/modules/user/user.entity';
import { GroupMemberEntity } from '@/modules/group/group-member/group-member.entity';

@Entity({ tableName: ETableName.GROUPS })
@Unique({ properties: ['ownerId', 'name'] })
export class GroupEntity extends BaseEntity {
  @ApiProperty()
  @PrimaryKey({ type: 'uuid' })
  id: string;

  @ApiProperty()
  @Property()
  @Index()
  name: string;

  // ==> [RELATION] COLUMNS <==
  @ApiProperty()
  @Property({ type: 'uuid', persist: false })
  @Index()
  ownerId?: string;

  // ==> [RELATION] TABLES <==
  @ApiPropertyOptional()
  @ManyToOne(() => UserEntity, { fieldName: 'owner_id' })
  owner?: UserEntity;

  @ApiPropertyOptional()
  @OneToMany(() => GroupMemberEntity, (e) => e.group, { cascade: [Cascade.ALL] })
  groupMembers = new Collection<GroupMemberEntity>(this);
}
