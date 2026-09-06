import { sql } from '@payloadcms/db-postgres'
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "daily_forecasts_three_day_forecast"
      ALTER COLUMN "date" TYPE timestamp(3) with time zone
      USING CASE
        WHEN "date" IS NULL OR btrim("date") = '' THEN NULL
        WHEN btrim("date") ~ '^[0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日$' THEN
          make_timestamptz(
            substring(btrim("date") from '^([0-9]{4})年')::integer,
            substring(btrim("date") from '年([0-9]{1,2})月')::integer,
            substring(btrim("date") from '月([0-9]{1,2})日$')::integer,
            0, 0, 0, 'Asia/Shanghai'
          )
        WHEN btrim("date") ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN btrim("date")::timestamp with time zone
        ELSE NULL
      END;

    ALTER TABLE "_daily_forecasts_v_version_three_day_forecast"
      ALTER COLUMN "date" TYPE timestamp(3) with time zone
      USING CASE
        WHEN "date" IS NULL OR btrim("date") = '' THEN NULL
        WHEN btrim("date") ~ '^[0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日$' THEN
          make_timestamptz(
            substring(btrim("date") from '^([0-9]{4})年')::integer,
            substring(btrim("date") from '年([0-9]{1,2})月')::integer,
            substring(btrim("date") from '月([0-9]{1,2})日$')::integer,
            0, 0, 0, 'Asia/Shanghai'
          )
        WHEN btrim("date") ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN btrim("date")::timestamp with time zone
        ELSE NULL
      END;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "daily_forecasts_three_day_forecast"
      ALTER COLUMN "date" TYPE varchar
      USING to_char("date" AT TIME ZONE 'Asia/Shanghai', 'YYYY"年"FMMM"月"FMDD"日"');

    ALTER TABLE "_daily_forecasts_v_version_three_day_forecast"
      ALTER COLUMN "date" TYPE varchar
      USING to_char("date" AT TIME ZONE 'Asia/Shanghai', 'YYYY"年"FMMM"月"FMDD"日"');
  `)
}
