CREATE TYPE "public"."body_type" AS ENUM('SUV', 'SEDAN', 'SEDAN_SMALL', 'SEDAN_LUX', 'JEEP', 'JEEP_LUX', 'COUPE', 'HATCHBACK', 'VAN', 'PICKUP_SMALL', 'PICKUP_LARGE', 'ANTIQUE');--> statement-breakpoint
CREATE TYPE "public"."car_source" AS ENUM('MANUAL', 'HARAJ');--> statement-breakpoint
CREATE TYPE "public"."car_status" AS ENUM('DRAFT', 'PUBLISHED', 'SOLD', 'RENTED_OUT');--> statement-breakpoint
CREATE TYPE "public"."catalog_request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."car_condition" AS ENUM('NEW', 'USED');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('SHOWROOM_VIEW', 'CAR_VIEW', 'CONTACT_CLICK');--> statement-breakpoint
CREATE TYPE "public"."fuel" AS ENUM('GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC');--> statement-breakpoint
CREATE TYPE "public"."gear" AS ENUM('AUTO', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."import_status" AS ENUM('RUNNING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."link_platform" AS ENUM('WHATSAPP', 'PHONE', 'SNAPCHAT', 'INSTAGRAM', 'TIKTOK', 'X', 'WEBSITE', 'MAPS');--> statement-breakpoint
CREATE TYPE "public"."listing_type" AS ENUM('SALE', 'RENT');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agencies" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"slug" varchar(40) NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text,
	"locales" jsonb DEFAULT '["ar"]'::jsonb NOT NULL,
	"logo_path" text,
	"cover_path" text,
	"accent_color" varchar(32),
	"about_ar" text,
	"about_en" text,
	"city" text,
	"haraj_username" text,
	"suspended" boolean DEFAULT false NOT NULL,
	"onboarded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agency_links" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"platform" "link_platform" NOT NULL,
	"value" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"target_id" text,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_images" (
	"id" text PRIMARY KEY NOT NULL,
	"car_id" text NOT NULL,
	"path" text NOT NULL,
	"width" integer,
	"height" integer,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_makes" (
	"id" text PRIMARY KEY NOT NULL,
	"code" varchar(64) NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "car_models" (
	"id" text PRIMARY KEY NOT NULL,
	"make_id" text NOT NULL,
	"code" varchar(64) NOT NULL,
	"name_ar" text NOT NULL,
	"name_en" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cars" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"listing_type" "listing_type" NOT NULL,
	"status" "car_status" DEFAULT 'DRAFT' NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"make_id" text,
	"model_id" text,
	"other_make" text,
	"other_model" text,
	"year" integer,
	"mileage" integer,
	"fuel" "fuel",
	"gear" "gear",
	"condition" "car_condition",
	"body_type" "body_type",
	"city" text,
	"price" integer,
	"rate_daily" integer,
	"rate_weekly" integer,
	"rate_monthly" integer,
	"title_ar" text,
	"title_en" text,
	"description_ar" text,
	"description_en" text,
	"source" "car_source" DEFAULT 'MANUAL' NOT NULL,
	"haraj_post_id" integer,
	"haraj_url" text,
	"haraj_diff" jsonb,
	"haraj_missing" boolean DEFAULT false NOT NULL,
	"haraj_synced_at" timestamp,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"make_id" text,
	"make_name" text,
	"model_name" text,
	"status" "catalog_request_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"status" "import_status" DEFAULT 'RUNNING' NOT NULL,
	"haraj_username" text NOT NULL,
	"pages" integer DEFAULT 0 NOT NULL,
	"fetched" integer DEFAULT 0 NOT NULL,
	"imported" integer DEFAULT 0 NOT NULL,
	"skipped" integer DEFAULT 0 NOT NULL,
	"changed" integer DEFAULT 0 NOT NULL,
	"stop_reason" text,
	"error" text,
	"logs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"heartbeat_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text DEFAULT 'user',
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"must_change_password" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "view_events" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"car_id" text,
	"type" "event_type" NOT NULL,
	"visitor_hash" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_links" ADD CONSTRAINT "agency_links_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_images" ADD CONSTRAINT "car_images_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_models" ADD CONSTRAINT "car_models_make_id_car_makes_id_fk" FOREIGN KEY ("make_id") REFERENCES "public"."car_makes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cars" ADD CONSTRAINT "cars_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cars" ADD CONSTRAINT "cars_make_id_car_makes_id_fk" FOREIGN KEY ("make_id") REFERENCES "public"."car_makes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cars" ADD CONSTRAINT "cars_model_id_car_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."car_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_requests" ADD CONSTRAINT "catalog_requests_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_requests" ADD CONSTRAINT "catalog_requests_make_id_car_makes_id_fk" FOREIGN KEY ("make_id") REFERENCES "public"."car_makes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_runs" ADD CONSTRAINT "import_runs_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_events" ADD CONSTRAINT "view_events_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_events" ADD CONSTRAINT "view_events_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agencies_slug_uq" ON "agencies" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "agencies_user_uq" ON "agencies" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agency_links_uq" ON "agency_links" USING btree ("agency_id","platform");--> statement-breakpoint
CREATE INDEX "agency_links_agency_idx" ON "agency_links" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "audit_log_time_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "car_images_car_idx" ON "car_images" USING btree ("car_id","sort");--> statement-breakpoint
CREATE UNIQUE INDEX "car_makes_code_uq" ON "car_makes" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "car_models_code_uq" ON "car_models" USING btree ("make_id","code");--> statement-breakpoint
CREATE INDEX "car_models_make_idx" ON "car_models" USING btree ("make_id");--> statement-breakpoint
CREATE INDEX "cars_agency_idx" ON "cars" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "cars_agency_status_idx" ON "cars" USING btree ("agency_id","status","is_hidden");--> statement-breakpoint
CREATE INDEX "cars_listing_type_idx" ON "cars" USING btree ("agency_id","listing_type");--> statement-breakpoint
CREATE UNIQUE INDEX "cars_haraj_uq" ON "cars" USING btree ("agency_id","haraj_post_id");--> statement-breakpoint
CREATE INDEX "catalog_requests_status_idx" ON "catalog_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "import_runs_agency_idx" ON "import_runs" USING btree ("agency_id","started_at");--> statement-breakpoint
CREATE INDEX "view_events_agency_time_idx" ON "view_events" USING btree ("agency_id","created_at");--> statement-breakpoint
CREATE INDEX "view_events_car_idx" ON "view_events" USING btree ("car_id","created_at");--> statement-breakpoint
CREATE INDEX "view_events_dedupe_idx" ON "view_events" USING btree ("visitor_hash","created_at");