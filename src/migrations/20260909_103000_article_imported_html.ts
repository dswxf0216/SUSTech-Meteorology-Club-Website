import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "imported_html" varchar;
    ALTER TABLE "_articles_v" ADD COLUMN IF NOT EXISTS "version_imported_html" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "articles" DROP COLUMN IF EXISTS "imported_html";
    ALTER TABLE "_articles_v" DROP COLUMN IF EXISTS "version_imported_html";
  `)
}
