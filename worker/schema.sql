-- D1 schema for the blog-engagement Worker (views and reactions under each article).
-- Apply with:  npx wrangler d1 execute blog-engagement --remote --file=schema.sql

-- The totals shown on the blog. kind is 'view' or a reaction key (fire, eyes, bulb, target).
CREATE TABLE IF NOT EXISTS counts (
  path TEXT    NOT NULL,
  kind TEXT    NOT NULL,
  n    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (path, kind)
) WITHOUT ROWID;

-- Who was already counted today, so a reload or a second click adds nothing.
-- visitor is a keyed hash that changes every day, never an IP address.
-- The Worker's daily cron deletes the rows of earlier days.
CREATE TABLE IF NOT EXISTS seen (
  day     TEXT NOT NULL, -- UTC date, YYYY-MM-DD
  visitor TEXT NOT NULL,
  path    TEXT NOT NULL,
  kind    TEXT NOT NULL,
  PRIMARY KEY (day, visitor, path, kind)
) WITHOUT ROWID;
