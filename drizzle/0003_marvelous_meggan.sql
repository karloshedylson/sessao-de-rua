ALTER TABLE "films" ADD COLUMN "poster_tmdb_url" text;--> statement-breakpoint
-- Recomeço limpo do TMDB: filmes enriquecidos pela regra antiga (cartaz do TMDB gravado na coluna do cinema, junto
-- com ano/duração/gênero tirados de lá) voltam ao estado sem TMDB. A próxima coleta devolve os dados do próprio cinema
-- e o enriquecimento reavalia tudo com a regra nova (inclusive a trava por duração).
UPDATE "films" SET "poster_url" = NULL, "tmdb_id" = NULL, "tmdb_checked_at" = NULL, "year" = NULL, "minutes" = NULL, "genre" = NULL WHERE "poster_url" LIKE 'https://image.tmdb.org/%';
