import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_daily_forecasts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__daily_forecasts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__daily_forecasts_v_published_locale" AS ENUM('zh', 'en');
  CREATE TABLE "daily_forecasts_three_day_forecast" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" varchar,
  	"weather" varchar,
  	"temperature_range" varchar
  );
  
  CREATE TABLE "daily_forecasts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"forecast_date" timestamp(3) with time zone,
  	"headline" varchar,
  	"today_observation_period" varchar,
  	"today_observation_temperature_range" varchar,
  	"today_observation_average_temperature" varchar,
  	"today_observation_rainfall" varchar,
  	"tomorrow_forecast_period" varchar,
  	"tomorrow_forecast_weather" varchar,
  	"tomorrow_forecast_temperature_range" varchar,
  	"tomorrow_forecast_wind" varchar,
  	"tomorrow_forecast_rain_probability" varchar,
  	"shenzhen_overview" varchar,
  	"china_overview" varchar,
  	"disclaimer" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_daily_forecasts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_daily_forecasts_v_version_three_day_forecast" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" varchar,
  	"weather" varchar,
  	"temperature_range" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_daily_forecasts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_forecast_date" timestamp(3) with time zone,
  	"version_headline" varchar,
  	"version_today_observation_period" varchar,
  	"version_today_observation_temperature_range" varchar,
  	"version_today_observation_average_temperature" varchar,
  	"version_today_observation_rainfall" varchar,
  	"version_tomorrow_forecast_period" varchar,
  	"version_tomorrow_forecast_weather" varchar,
  	"version_tomorrow_forecast_temperature_range" varchar,
  	"version_tomorrow_forecast_wind" varchar,
  	"version_tomorrow_forecast_rain_probability" varchar,
  	"version_shenzhen_overview" varchar,
  	"version_china_overview" varchar,
  	"version_disclaimer" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__daily_forecasts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__daily_forecasts_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "daily_forecasts_id" integer;
  ALTER TABLE "daily_forecasts_three_day_forecast" ADD CONSTRAINT "daily_forecasts_three_day_forecast_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."daily_forecasts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_daily_forecasts_v_version_three_day_forecast" ADD CONSTRAINT "_daily_forecasts_v_version_three_day_forecast_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_daily_forecasts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_daily_forecasts_v" ADD CONSTRAINT "_daily_forecasts_v_parent_id_daily_forecasts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."daily_forecasts"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "daily_forecasts_three_day_forecast_order_idx" ON "daily_forecasts_three_day_forecast" USING btree ("_order");
  CREATE INDEX "daily_forecasts_three_day_forecast_parent_id_idx" ON "daily_forecasts_three_day_forecast" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "daily_forecasts_forecast_date_idx" ON "daily_forecasts" USING btree ("forecast_date");
  CREATE INDEX "daily_forecasts_updated_at_idx" ON "daily_forecasts" USING btree ("updated_at");
  CREATE INDEX "daily_forecasts_created_at_idx" ON "daily_forecasts" USING btree ("created_at");
  CREATE INDEX "daily_forecasts__status_idx" ON "daily_forecasts" USING btree ("_status");
  CREATE INDEX "_daily_forecasts_v_version_three_day_forecast_order_idx" ON "_daily_forecasts_v_version_three_day_forecast" USING btree ("_order");
  CREATE INDEX "_daily_forecasts_v_version_three_day_forecast_parent_id_idx" ON "_daily_forecasts_v_version_three_day_forecast" USING btree ("_parent_id");
  CREATE INDEX "_daily_forecasts_v_parent_idx" ON "_daily_forecasts_v" USING btree ("parent_id");
  CREATE INDEX "_daily_forecasts_v_version_version_forecast_date_idx" ON "_daily_forecasts_v" USING btree ("version_forecast_date");
  CREATE INDEX "_daily_forecasts_v_version_version_updated_at_idx" ON "_daily_forecasts_v" USING btree ("version_updated_at");
  CREATE INDEX "_daily_forecasts_v_version_version_created_at_idx" ON "_daily_forecasts_v" USING btree ("version_created_at");
  CREATE INDEX "_daily_forecasts_v_version_version__status_idx" ON "_daily_forecasts_v" USING btree ("version__status");
  CREATE INDEX "_daily_forecasts_v_created_at_idx" ON "_daily_forecasts_v" USING btree ("created_at");
  CREATE INDEX "_daily_forecasts_v_updated_at_idx" ON "_daily_forecasts_v" USING btree ("updated_at");
  CREATE INDEX "_daily_forecasts_v_snapshot_idx" ON "_daily_forecasts_v" USING btree ("snapshot");
  CREATE INDEX "_daily_forecasts_v_published_locale_idx" ON "_daily_forecasts_v" USING btree ("published_locale");
  CREATE INDEX "_daily_forecasts_v_latest_idx" ON "_daily_forecasts_v" USING btree ("latest");
  CREATE INDEX "_daily_forecasts_v_autosave_idx" ON "_daily_forecasts_v" USING btree ("autosave");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_daily_forecasts_fk" FOREIGN KEY ("daily_forecasts_id") REFERENCES "public"."daily_forecasts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_daily_forecasts_id_idx" ON "payload_locked_documents_rels" USING btree ("daily_forecasts_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "daily_forecasts_three_day_forecast" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "daily_forecasts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_daily_forecasts_v_version_three_day_forecast" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_daily_forecasts_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "daily_forecasts_three_day_forecast" CASCADE;
  DROP TABLE "daily_forecasts" CASCADE;
  DROP TABLE "_daily_forecasts_v_version_three_day_forecast" CASCADE;
  DROP TABLE "_daily_forecasts_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_daily_forecasts_fk";
  
  DROP INDEX "payload_locked_documents_rels_daily_forecasts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "daily_forecasts_id";
  DROP TYPE "public"."enum_daily_forecasts_status";
  DROP TYPE "public"."enum__daily_forecasts_v_version_status";
  DROP TYPE "public"."enum__daily_forecasts_v_published_locale";`)
}
