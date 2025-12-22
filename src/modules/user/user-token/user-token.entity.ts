import { Entity, PrimaryKey, Property, ManyToOne, Index, Enum } from '@mikro-orm/core';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ETableName, ETokenType } from '@/common/enums';
import { BaseEntity } from '@/common/base.entity';
import { UserEntity } from '@/modules/user/user.entity';

@Entity({ tableName: ETableName.USERS_TOKENS })
@Index({ properties: ['userId', 'type', 'hashToken'] })
export class UserTokenEntity extends BaseEntity {
  @ApiProperty()
  @PrimaryKey({ type: 'uuid' })
  id: string;

  @ApiProperty()
  @Property()
  hashToken: string;

  @ApiProperty()
  @Enum({ type: 'enum', items: () => ETokenType })
  type: ETokenType;

  @ApiProperty()
  @Property({ type: 'uuid', nullable: true, unique: true })
  refreshTokenId?: string;

  // ==> [RELATION] COLUMNS <==
  @ApiProperty()
  @Property({ type: 'uuid', persist: false })
  userId?: string;

  // ==> [RELATION] TABLES <==
  @ApiPropertyOptional()
  @ManyToOne(() => UserEntity, { fieldName: 'user_id' })
  user?: UserEntity;
}
