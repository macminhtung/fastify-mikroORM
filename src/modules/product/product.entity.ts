import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { ETableName } from '@/common/enums';
import { BaseEntity } from '@/common/base.entity';

@Entity({ tableName: ETableName.PRODUCT })
export class ProductEntity extends BaseEntity {
  @ApiProperty()
  @PrimaryKey({ type: 'uuid' })
  id: string;

  @ApiProperty()
  @Property()
  image: string;

  @ApiProperty()
  @Property({ unique: true, length: 100 })
  name: string;

  @ApiProperty()
  @Property({ length: 1000 })
  description: string;
}
