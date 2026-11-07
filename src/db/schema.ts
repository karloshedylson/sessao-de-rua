import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  time,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Quão específico é o link de ingresso: sessão exata > filme no cinema > site do cinema. */
export const linkLevel = pgEnum("link_level", ["session", "film", "cinema"]);

export const cinemas = pgTable("cinemas", {
  /** Slug estável usado pelo front (ex.: "belas"). */
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  short: text("short").notNull(),
  bairro: text("bairro").notNull(),
  addr: text("addr").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  tag: text("tag").notNull(),
  fullPrice: integer("full_price").notNull(),
  labelSide: integer("label_side").notNull(),
  website: text("website"),
});

export const films = pgTable(
  "films",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    /** Título normalizado (sem acentos, minúsculo) para casar o mesmo filme entre cinemas. */
    titleKey: text("title_key").notNull(),
    country: text("country"),
    year: integer("year"),
    minutes: integer("minutes"),
    rating: text("rating"),
    language: text("language"),
    genre: text("genre"),
    /** URL da imagem do cartaz, como publicada pelo cinema de origem. */
    posterUrl: text("poster_url"),
  },
  (t) => [uniqueIndex("films_title_key_idx").on(t.titleKey)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    cinemaId: text("cinema_id")
      .notNull()
      .references(() => cinemas.id),
    filmId: integer("film_id")
      .notNull()
      .references(() => films.id),
    day: date("day").notNull(),
    startsAt: time("starts_at").notNull(),
    room: text("room"),
    /** Link mais específico disponível para essa sessão. */
    ticketUrl: text("ticket_url"),
    linkLevel: linkLevel("link_level").notNull().default("cinema"),
    scrapedAt: timestamp("scraped_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("sessions_unique_idx").on(t.cinemaId, t.filmId, t.day, t.startsAt, t.room),
    index("sessions_day_idx").on(t.day),
  ],
);

export const scrapeRuns = pgTable("scrape_runs", {
  id: serial("id").primaryKey(),
  cinemaId: text("cinema_id")
    .notNull()
    .references(() => cinemas.id),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  ok: boolean("ok").notNull().default(false),
  sessionsFound: integer("sessions_found").notNull().default(0),
  error: text("error"),
});
