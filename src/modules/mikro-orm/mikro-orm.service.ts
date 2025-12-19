import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';

const { NODE_ENV, MIKROORM_SYNCHRONIZE, MIKROORM_MIGRATIONS_RUN } = process.env;

@Injectable()
export class MikroORMService implements OnModuleInit {
  constructor(@Inject() private readonly orm: MikroORM) {}

  async onModuleInit() {
    // Sync DB schema
    if (NODE_ENV !== 'prod' && MIKROORM_SYNCHRONIZE === 'true')
      await this.orm.getSchemaGenerator().updateSchema();

    // Run migration files
    if (MIKROORM_MIGRATIONS_RUN === 'true') await this.orm.getMigrator().up();
  }
}
