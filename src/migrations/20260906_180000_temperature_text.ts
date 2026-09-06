import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "daily_forecasts"
      ALTER COLUMN "today_observation_low_temperature" TYPE varchar USING "today_observation_low_temperature"::varchar,
      ALTER COLUMN "today_observation_high_temperature" TYPE varchar USING "today_observation_high_temperature"::varchar,
      ALTER COLUMN "today_observation_average_temperature_value" TYPE varchar USING "today_observation_average_temperature_value"::varchar,
      ALTER COLUMN "tomorrow_forecast_low_temperature" TYPE varchar USING "tomorrow_forecast_low_temperature"::varchar,
      ALTER COLUMN "tomorrow_forecast_high_temperature" TYPE varchar USING "tomorrow_forecast_high_temperature"::varchar;

    ALTER TABLE "_daily_forecasts_v"
      ALTER COLUMN "version_today_observation_low_temperature" TYPE varchar USING "version_today_observation_low_temperature"::varchar,
      ALTER COLUMN "version_today_observation_high_temperature" TYPE varchar USING "version_today_observation_high_temperature"::varchar,
      ALTER COLUMN "version_today_observation_average_temperature_value" TYPE varchar USING "version_today_observation_average_temperature_value"::varchar,
      ALTER COLUMN "version_tomorrow_forecast_low_temperature" TYPE varchar USING "version_tomorrow_forecast_low_temperature"::varchar,
      ALTER COLUMN "version_tomorrow_forecast_high_temperature" TYPE varchar USING "version_tomorrow_forecast_high_temperature"::varchar;

    ALTER TABLE "daily_forecasts_three_day_forecast"
      ALTER COLUMN "low_temperature" TYPE varchar USING "low_temperature"::varchar,
      ALTER COLUMN "high_temperature" TYPE varchar USING "high_temperature"::varchar;

    ALTER TABLE "_daily_forecasts_v_version_three_day_forecast"
      ALTER COLUMN "low_temperature" TYPE varchar USING "low_temperature"::varchar,
      ALTER COLUMN "high_temperature" TYPE varchar USING "high_temperature"::varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "daily_forecasts"
      ALTER COLUMN "today_observation_low_temperature" TYPE numeric USING "today_observation_low_temperature"::numeric,
      ALTER COLUMN "today_observation_high_temperature" TYPE numeric USING "today_observation_high_temperature"::numeric,
      ALTER COLUMN "today_observation_average_temperature_value" TYPE numeric USING "today_observation_average_temperature_value"::numeric,
      ALTER COLUMN "tomorrow_forecast_low_temperature" TYPE numeric USING "tomorrow_forecast_low_temperature"::numeric,
      ALTER COLUMN "tomorrow_forecast_high_temperature" TYPE numeric USING "tomorrow_forecast_high_temperature"::numeric;

    ALTER TABLE "_daily_forecasts_v"
      ALTER COLUMN "version_today_observation_low_temperature" TYPE numeric USING "version_today_observation_low_temperature"::numeric,
      ALTER COLUMN "version_today_observation_high_temperature" TYPE numeric USING "version_today_observation_high_temperature"::numeric,
      ALTER COLUMN "version_today_observation_average_temperature_value" TYPE numeric USING "version_today_observation_average_temperature_value"::numeric,
      ALTER COLUMN "version_tomorrow_forecast_low_temperature" TYPE numeric USING "version_tomorrow_forecast_low_temperature"::numeric,
      ALTER COLUMN "version_tomorrow_forecast_high_temperature" TYPE numeric USING "version_tomorrow_forecast_high_temperature"::numeric;

    ALTER TABLE "daily_forecasts_three_day_forecast"
      ALTER COLUMN "low_temperature" TYPE numeric USING "low_temperature"::numeric,
      ALTER COLUMN "high_temperature" TYPE numeric USING "high_temperature"::numeric;

    ALTER TABLE "_daily_forecasts_v_version_three_day_forecast"
      ALTER COLUMN "low_temperature" TYPE numeric USING "low_temperature"::numeric,
      ALTER COLUMN "high_temperature" TYPE numeric USING "high_temperature"::numeric;
  `)
}
