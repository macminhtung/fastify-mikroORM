/* eslint-disable @typescript-eslint/require-await */
import { Migration } from '@mikro-orm/migrations';
import { DEFAULT_ROLES } from '@/common/constants';
import { ETableName } from '@/common/enums';

export class Migration20251219103404 extends Migration {
  override async up(): Promise<void> {
    const DEFAULT_ROLES_VALUES = Object.values(DEFAULT_ROLES);

    // INSERT DEFAULT_ROLES
    this.addSql(`
      INSERT INTO "${ETableName.ROLES}" ("id", "name") VALUES
      ${DEFAULT_ROLES_VALUES.map((item) => `(${item.id}, '${item.name}')`)}
    `);

    // INSERT ADMIN ACCOUNT
    this.addSql(`
      INSERT INTO "${ETableName.USERS}" (id, role_id, email, first_name, last_name, password, is_email_verified)
      VALUES ('00000199-56aa-70dd-8757-bb3e84f4153d', ${DEFAULT_ROLES.ADMIN.id}, 'admin@gmail.com', 'T', 'MM', '$2b$10$yZcgS/ffS6xicYduxWzWdOayop7Dg/k06SxkzelJKJQ.9MnHF7yeO', TRUE);
    `);
  }

  override async down(): Promise<void> {
    // DELETE DEFAULT_ROLES
    this.addSql(`
      DELETE FROM "${ETableName.USERS}" WHERE id = '00000199-56aa-70dd-8757-bb3e84f4153d';
    `);

    // DELETE ADMIN ACCOUNT
    this.addSql(`
      DELETE FROM "${ETableName.ROLES}" WHERE id in (${Object.values(DEFAULT_ROLES)
        .map((role) => role.id)
        .join(',')});
    `);
  }
}
