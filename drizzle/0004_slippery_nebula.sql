ALTER TABLE "films" ADD COLUMN "synopsis" text;--> statement-breakpoint
ALTER TABLE "films" ADD COLUMN "director" text;--> statement-breakpoint
ALTER TABLE "films" ADD COLUMN "tmdb_score" real;--> statement-breakpoint
ALTER TABLE "films" ADD COLUMN "tmdb_votes" integer;--> statement-breakpoint
-- Preenche sinopse, direção e nota dos filmes que já têm id no TMDB: libera a próxima coleta para consultá-los.
UPDATE "films" SET "tmdb_checked_at" = NULL WHERE "tmdb_id" IS NOT NULL;
