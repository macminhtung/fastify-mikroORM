import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import * as dotenv from 'dotenv';

dotenv.config({ path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env' });

const { MIKROORM_MIGRATIONS_RUN } = process.env;

@Injectable()
export class MikroORMService implements OnModuleInit {
  constructor(@Inject() private readonly orm: MikroORM) {}

  async onModuleInit() {
    // Run migration files
    if (MIKROORM_MIGRATIONS_RUN === 'true') await this.orm.getMigrator().up();
  }
}
