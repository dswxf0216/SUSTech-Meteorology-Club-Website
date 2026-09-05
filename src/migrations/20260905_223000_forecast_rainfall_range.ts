import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "daily_forecasts"
      ADD COLUMN "tomorrow_forecast_rainfall_amount_min" numeric,
      ADD COLUMN "tomorrow_forecast_rainfall_amount_max" numeric;

    ALTER TABLE "_daily_forecasts_v"
      ADD COLUMN "version_tomorrow_forecast_rainfall_amount_min" numeric,
      ADD COLUMN "version_tomorrow_forecast_rainfall_amount_max" numeric;

    UPDATE "daily_forecasts"
      SET "tomorrow_forecast_rainfall_amount_min" = "tomorrow_forecast_rainfall_amount",
          "tomorrow_forecast_rainfall_amount_max" = "tomorrow_forecast_rainfall_amount"
      WHERE "tomorrow_forecast_rainfall_amount" IS NOT NULL;

    UPDATE "_daily_forecasts_v"
      SET "version_tomorrow_forecast_rainfall_amount_min" = "version_tomorrow_forecast_rainfall_amount",
          "version_tomorrow_forecast_rainfall_amount_max" = "version_tomorrow_forecast_rainfall_amount"
      WHERE "version_tomorrow_forecast_rainfall_amount" IS NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "daily_forecasts"
      DROP COLUMN "tomorrow_forecast_rainfall_amount_min",
      DROP COLUMN "tomorrow_forecast_rainfall_amount_max";

    ALTER TABLE "_daily_forecasts_v"
      DROP COLUMN "version_tomorrow_forecast_rainfall_amount_min",
      DROP COLUMN "version_tomorrow_forecast_rainfall_amount_max";
  `)
}
