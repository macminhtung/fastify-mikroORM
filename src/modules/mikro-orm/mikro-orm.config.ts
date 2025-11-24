import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { MikroORMNamingStrategy } from '@/modules/mikro-orm/mikro-orm.naming';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: process.env.NODE_ENV ? `.${process.env.NODE_ENV}.env` : '.env' });

export const config: MikroOrmModuleOptions = {
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
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  dbName: process.env.POSTGRES_DATABASE,
  // debug: true,
};

export default config;
