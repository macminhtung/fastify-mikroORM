import { MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { MikroORMNamingStrategy } from '@/modules/mikro-orm/mikro-orm.naming';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env' });

const {
  MIKROORM_HOST,
  MIKROORM_PORT,
  MIKROORM_USER,
  MIKROORM_PASSWORD,
  MIKROORM_DATABASE,
  MIKROORM_DEBUG,
} = process.env;

console.log('MIKROORM_DATABASE =', MIKROORM_DATABASE);

export const config: MikroOrmModuleSyncOptions = {
  driver: PostgreSqlDriver,
  namingStrategy: MikroORMNamingStrategy,
  extensions: [Migrator],
  entities: [
    path.join(process.cwd(), __filename.endsWith('.js') ? 'dist' : 'src', '/modules/**/*.entity.*'),
  ],
  migrations: {
    tableName: 'migrations',
    path: path.join(process.cwd(), 'dist/migrations'),
    pathTs: path.join(process.cwd(), 'src/migrations'),
    glob: '!(*.d).{js,ts}',
  },
  host: MIKROORM_HOST,
  port: Number(MIKROORM_PORT) || 5432,
  user: MIKROORM_USER || 'postgres',
  password: MIKROORM_PASSWORD,
  dbName: MIKROORM_DATABASE,
  debug: MIKROORM_DEBUG === 'true',
};

export default config;
