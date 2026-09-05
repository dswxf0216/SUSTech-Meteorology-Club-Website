import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "daily_forecasts"
      ADD COLUMN "today_observation_rainfall_amount" numeric,
      ADD COLUMN "today_observation_precipitation_level" varchar,
      ADD COLUMN "tomorrow_forecast_rainfall_amount" numeric;

    ALTER TABLE "_daily_forecasts_v"
      ADD COLUMN "version_today_observation_rainfall_amount" numeric,
      ADD COLUMN "version_today_observation_precipitation_level" varchar,
      ADD COLUMN "version_tomorrow_forecast_rainfall_amount" numeric;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "daily_forecasts"
      DROP COLUMN "today_observation_rainfall_amount",
      DROP COLUMN "today_observation_precipitation_level",
      DROP COLUMN "tomorrow_forecast_rainfall_amount";

    ALTER TABLE "_daily_forecasts_v"
      DROP COLUMN "version_today_observation_rainfall_amount",
      DROP COLUMN "version_today_observation_precipitation_level",
      DROP COLUMN "version_tomorrow_forecast_rainfall_amount";
  `)
}
