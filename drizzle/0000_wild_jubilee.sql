CREATE TYPE "public"."link_level" AS ENUM('session', 'film', 'cinema');--> statement-breakpoint
CREATE TABLE "cinemas" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short" text NOT NULL,
	"bairro" text NOT NULL,
	"addr" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"tag" text NOT NULL,
	"full_price" integer NOT NULL,
	"label_side" integer NOT NULL,
	"website" text
);
--> statement-breakpoint
CREATE TABLE "films" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"title_key" text NOT NULL,
	"country" text,
	"year" integer,
	"minutes" integer,
	"rating" text,
	"language" text,
	"genre" text
);
--> statement-breakpoint
CREATE TABLE "scrape_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"cinema_id" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"ok" boolean DEFAULT false NOT NULL,
	"sessions_found" integer DEFAULT 0 NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"cinema_id" text NOT NULL,
	"film_id" integer NOT NULL,
	"day" date NOT NULL,
	"starts_at" time NOT NULL,
	"room" text,
	"ticket_url" text,
	"link_level" "link_level" DEFAULT 'cinema' NOT NULL,
	"scraped_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scrape_runs" ADD CONSTRAINT "scrape_runs_cinema_id_cinemas_id_fk" FOREIGN KEY ("cinema_id") REFERENCES "public"."cinemas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_cinema_id_cinemas_id_fk" FOREIGN KEY ("cinema_id") REFERENCES "public"."cinemas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_film_id_films_id_fk" FOREIGN KEY ("film_id") REFERENCES "public"."films"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "films_title_key_idx" ON "films" USING btree ("title_key");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_unique_idx" ON "sessions" USING btree ("cinema_id","film_id","day","starts_at","room");--> statement-breakpoint
CREATE INDEX "sessions_day_idx" ON "sessions" USING btree ("day");