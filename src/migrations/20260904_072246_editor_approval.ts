import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_approval_status" AS ENUM('pending', 'approved', 'rejected');
  ALTER TABLE "users" ADD COLUMN "application_reason" varchar;
  ALTER TABLE "users" ADD COLUMN "approval_status" "enum_users_approval_status" DEFAULT 'approved' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" DROP COLUMN "application_reason";
  ALTER TABLE "users" DROP COLUMN "approval_status";
  DROP TYPE "public"."enum_users_approval_status";`)
}
