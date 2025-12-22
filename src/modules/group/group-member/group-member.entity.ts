import { Entity, PrimaryKey, Property, Index, ManyToOne } from '@mikro-orm/core';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ETableName } from '@/common/enums';
import { BaseEntity } from '@/common/base.entity';
import { UserEntity } from '@/modules/user/user.entity';
import { GroupEntity } from '@/modules/group/group.entity';

@Entity({ tableName: ETableName.GROUPS_MEMBERS })
export class GroupMemberEntity extends BaseEntity {
  @ApiProperty()
  @PrimaryKey({ type: 'uuid' })
  id: string;

  // ==> [RELATION] COLUMNS <==
  @ApiProperty()
  @Property({ type: 'uuid', persist: false })
  @Index()
  groupId: string;

  @ApiProperty()
  @Property({ type: 'uuid', persist: false })
  @Index()
  memberId: string;

  // ==> [RELATION] TABLES <==
  @ApiPropertyOptional()
  @ManyToOne(() => GroupEntity, { fieldName: 'group_id' })
  group?: GroupEntity;

  @ApiPropertyOptional()
  @ManyToOne(() => UserEntity, { fieldName: 'member_id' })
  member?: UserEntity;
}
