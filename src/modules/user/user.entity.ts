import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Index,
  OneToMany,
  Cascade,
  Collection,
} from '@mikro-orm/core';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ETableName } from '@/common/enums';
import { BaseEntity } from '@/common/base.entity';
import { RoleEntity } from '@/modules/user/role/role.entity';
import { UserTokenEntity } from '@/modules/user/user-token/user-token.entity';
import { GroupMemberEntity } from '@/modules/group/group-member/group-member.entity';

@Entity({ tableName: ETableName.USER })
export class UserEntity extends BaseEntity {
  @ApiProperty()
  @PrimaryKey({ type: 'uuid' })
  id: string;

  @ApiProperty()
  @Property({ default: '' })
  avatar?: string;

  @ApiProperty()
  @Property({ unique: true })
  email: string;

  @Property({ hidden: true })
  password: string;

  @ApiProperty()
  @Property()
  @Index()
  firstName: string;

  @ApiProperty()
  @Property()
  @Index()
  lastName: string;

  @ApiProperty()
  @Property({ default: false })
  isEmailVerified: boolean;

  // ==> [RELATION] COLUMNS <==
  @ApiProperty({ type: 'integer' })
  @Property({ type: 'int4', persist: false })
  @Index()
  roleId?: number;

  @ApiProperty()
  @Property({ type: 'uuid', persist: false })
  @Index()
  companyId?: string;

  // ==> [RELATION] TABLES <==
  @ApiPropertyOptional()
  @ManyToOne(() => RoleEntity, { fieldName: 'role_id' })
  role?: RoleEntity;

  @OneToMany(() => UserTokenEntity, (e) => e.user, { cascade: [Cascade.ALL] })
  userTokens?: UserTokenEntity[];

  @ApiPropertyOptional()
  @OneToMany(() => GroupMemberEntity, (e) => e.member, { cascade: [Cascade.ALL] })
  groupMembers = new Collection<GroupMemberEntity>(this);
}
