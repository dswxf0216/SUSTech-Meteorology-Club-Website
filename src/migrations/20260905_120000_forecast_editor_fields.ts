import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "daily_forecasts"
      ADD COLUMN "today_observation_low_temperature" numeric,
      ADD COLUMN "today_observation_high_temperature" numeric,
      ADD COLUMN "today_observation_average_temperature_value" numeric,
      ADD COLUMN "tomorrow_forecast_low_temperature" numeric,
      ADD COLUMN "tomorrow_forecast_high_temperature" numeric,
      ADD COLUMN "tomorrow_forecast_rainfall" varchar,
      ADD COLUMN "tomorrow_forecast_precipitation_timing_intensity" varchar;

    ALTER TABLE "_daily_forecasts_v"
      ADD COLUMN "version_today_observation_low_temperature" numeric,
      ADD COLUMN "version_today_observation_high_temperature" numeric,
      ADD COLUMN "version_today_observation_average_temperature_value" numeric,
      ADD COLUMN "version_tomorrow_forecast_low_temperature" numeric,
      ADD COLUMN "version_tomorrow_forecast_high_temperature" numeric,
      ADD COLUMN "version_tomorrow_forecast_rainfall" varchar,
      ADD COLUMN "version_tomorrow_forecast_precipitation_timing_intensity" varchar;

    ALTER TABLE "daily_forecasts_three_day_forecast"
      ADD COLUMN "low_temperature" numeric,
      ADD COLUMN "high_temperature" numeric;

    ALTER TABLE "_daily_forecasts_v_version_three_day_forecast"
      ADD COLUMN "low_temperature" numeric,
      ADD COLUMN "high_temperature" numeric;

    UPDATE "daily_forecasts"
      SET "today_observation_period" = '昨日20时至今日20时',
          "tomorrow_forecast_period" = '今日20时至明日20时',
          "disclaimer" = '本预报为非官方天气预报，供服务校内师生使用，仅供参考';

    ALTER TABLE "daily_forecasts"
      ALTER COLUMN "today_observation_period" SET DEFAULT '昨日20时至今日20时',
      ALTER COLUMN "tomorrow_forecast_period" SET DEFAULT '今日20时至明日20时',
      ALTER COLUMN "disclaimer" SET DEFAULT '本预报为非官方天气预报，供服务校内师生使用，仅供参考';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "daily_forecasts"
      DROP COLUMN "today_observation_low_temperature",
      DROP COLUMN "today_observation_high_temperature",
      DROP COLUMN "today_observation_average_temperature_value",
      DROP COLUMN "tomorrow_forecast_low_temperature",
      DROP COLUMN "tomorrow_forecast_high_temperature",
      DROP COLUMN "tomorrow_forecast_rainfall",
      DROP COLUMN "tomorrow_forecast_precipitation_timing_intensity";

    ALTER TABLE "_daily_forecasts_v"
      DROP COLUMN "version_today_observation_low_temperature",
      DROP COLUMN "version_today_observation_high_temperature",
      DROP COLUMN "version_today_observation_average_temperature_value",
      DROP COLUMN "version_tomorrow_forecast_low_temperature",
      DROP COLUMN "version_tomorrow_forecast_high_temperature",
      DROP COLUMN "version_tomorrow_forecast_rainfall",
      DROP COLUMN "version_tomorrow_forecast_precipitation_timing_intensity";

    ALTER TABLE "daily_forecasts_three_day_forecast"
      DROP COLUMN "low_temperature",
      DROP COLUMN "high_temperature";

    ALTER TABLE "_daily_forecasts_v_version_three_day_forecast"
      DROP COLUMN "low_temperature",
      DROP COLUMN "high_temperature";

    ALTER TABLE "daily_forecasts"
      ALTER COLUMN "today_observation_period" DROP DEFAULT,
      ALTER COLUMN "tomorrow_forecast_period" DROP DEFAULT,
      ALTER COLUMN "disclaimer" DROP DEFAULT;
  `)
}
