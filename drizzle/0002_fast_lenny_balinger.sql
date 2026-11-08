ALTER TABLE "cinemas" ADD COLUMN "city" text DEFAULT 'sp' NOT NULL;--> statement-breakpoint
ALTER TABLE "films" ADD COLUMN "tmdb_id" integer;--> statement-breakpoint
ALTER TABLE "films" ADD COLUMN "tmdb_checked_at" timestamp with time zone;