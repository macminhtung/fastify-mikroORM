import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';

@Injectable()
export class MikroORMService implements OnModuleInit {
  constructor(@Inject() private readonly orm: MikroORM) {}

  async onModuleInit() {
    // Run table schemas
    await this.orm.getSchemaGenerator().updateSchema({ dropTables: false, safe: true });

    // Run migration files
    await this.orm.getMigrator().up();
  }
}
