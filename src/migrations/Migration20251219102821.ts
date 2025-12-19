/* eslint-disable @typescript-eslint/require-await */
import { Migration } from '@mikro-orm/migrations';

export class Migration20251219102821 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "product" ("id" uuid not null, "created_at" timestamptz not null default 'Fri Dec 19 2025', "updated_at" timestamptz null, "deleted_at" timestamptz null, "image" varchar(255) not null, "name" varchar(100) not null, "description" varchar(1000) not null, constraint "product_pkey" primary key ("id"));`,
    );
    this.addSql(`alter table "product" add constraint "product_name_unique" unique ("name");`);

    this.addSql(
      `create table "role" ("id" serial primary key, "created_at" timestamptz not null default 'Fri Dec 19 2025', "updated_at" timestamptz null, "deleted_at" timestamptz null, "name" text check ("name" in ('admin', 'staff', 'user')) not null, "description" varchar(255) null);`,
    );

    this.addSql(
      `create table "user" ("id" uuid not null, "created_at" timestamptz not null default 'Fri Dec 19 2025', "updated_at" timestamptz null, "deleted_at" timestamptz null, "avatar" varchar(255) not null default '', "email" varchar(255) not null, "password" varchar(255) not null, "first_name" varchar(255) not null, "last_name" varchar(255) not null, "is_email_verified" boolean not null default false, "role_id" int not null, constraint "user_pkey" primary key ("id"));`,
    );
    this.addSql(`alter table "user" add constraint "user_email_unique" unique ("email");`);
    this.addSql(`create index "user_first_name_index" on "user" ("first_name");`);
    this.addSql(`create index "user_last_name_index" on "user" ("last_name");`);

    this.addSql(
      `create table "group" ("id" uuid not null, "created_at" timestamptz not null default 'Fri Dec 19 2025', "updated_at" timestamptz null, "deleted_at" timestamptz null, "name" varchar(255) not null, "owner_id" uuid not null, constraint "group_pkey" primary key ("id"));`,
    );
    this.addSql(`create index "group_name_index" on "group" ("name");`);
    this.addSql(
      `alter table "group" add constraint "group_owner_id_name_unique" unique ("owner_id", "name");`,
    );

    this.addSql(
      `create table "invite_member" ("id" uuid not null, "created_at" timestamptz not null default 'Fri Dec 19 2025', "updated_at" timestamptz null, "deleted_at" timestamptz null, "status" text check ("status" in ('REQUESTING', 'ACCEPTED', 'DECLINE')) not null default 'REQUESTING', "is_prevent_reinvite" boolean not null default false, "group_id" uuid not null, "member_id" uuid not null, constraint "invite_member_pkey" primary key ("id"));`,
    );
    this.addSql(`create index "invite_member_status_index" on "invite_member" ("status");`);

    this.addSql(
      `create table "group_member" ("id" uuid not null, "created_at" timestamptz not null default 'Fri Dec 19 2025', "updated_at" timestamptz null, "deleted_at" timestamptz null, "group_id" uuid not null, "member_id" uuid not null, constraint "group_member_pkey" primary key ("id"));`,
    );

    this.addSql(
      `create table "user_token" ("id" uuid not null, "created_at" timestamptz not null default 'Fri Dec 19 2025', "updated_at" timestamptz null, "deleted_at" timestamptz null, "hash_token" varchar(255) not null, "type" text check ("type" in ('ACCESS_TOKEN', 'REFRESH_TOKEN')) not null, "refresh_token_id" uuid null, "user_id" uuid not null, constraint "user_token_pkey" primary key ("id"));`,
    );
    this.addSql(
      `alter table "user_token" add constraint "user_token_refresh_token_id_unique" unique ("refresh_token_id");`,
    );
    this.addSql(
      `create index "user_token_user_id_type_hash_token_index" on "user_token" ("user_id", "type", "hash_token");`,
    );

    this.addSql(
      `alter table "user" add constraint "user_role_id_foreign" foreign key ("role_id") references "role" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "group" add constraint "group_owner_id_foreign" foreign key ("owner_id") references "user" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "invite_member" add constraint "invite_member_group_id_foreign" foreign key ("group_id") references "group" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "invite_member" add constraint "invite_member_member_id_foreign" foreign key ("member_id") references "user" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "group_member" add constraint "group_member_group_id_foreign" foreign key ("group_id") references "group" ("id") on update cascade;`,
    );
    this.addSql(
      `alter table "group_member" add constraint "group_member_member_id_foreign" foreign key ("member_id") references "user" ("id") on update cascade;`,
    );

    this.addSql(
      `alter table "user_token" add constraint "user_token_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" drop constraint "user_role_id_foreign";`);

    this.addSql(`alter table "group" drop constraint "group_owner_id_foreign";`);

    this.addSql(`alter table "invite_member" drop constraint "invite_member_member_id_foreign";`);

    this.addSql(`alter table "group_member" drop constraint "group_member_member_id_foreign";`);

    this.addSql(`alter table "user_token" drop constraint "user_token_user_id_foreign";`);

    this.addSql(`alter table "invite_member" drop constraint "invite_member_group_id_foreign";`);

    this.addSql(`alter table "group_member" drop constraint "group_member_group_id_foreign";`);

    this.addSql(`drop table if exists "product" cascade;`);

    this.addSql(`drop table if exists "role" cascade;`);

    this.addSql(`drop table if exists "user" cascade;`);

    this.addSql(`drop table if exists "group" cascade;`);

    this.addSql(`drop table if exists "invite_member" cascade;`);

    this.addSql(`drop table if exists "group_member" cascade;`);

    this.addSql(`drop table if exists "user_token" cascade;`);
  }
}
