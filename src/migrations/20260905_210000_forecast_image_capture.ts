import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "daily_forecasts"
      ADD COLUMN "capture_image_on_publish" boolean DEFAULT true;

    ALTER TABLE "_daily_forecasts_v"
      ADD COLUMN "version_capture_image_on_publish" boolean DEFAULT true;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "daily_forecasts"
      DROP COLUMN "capture_image_on_publish";

    ALTER TABLE "_daily_forecasts_v"
      DROP COLUMN "version_capture_image_on_publish";
  `)
}
