-- One-shot cleanup migration.
--
-- Drops the legacy "Product"."sourceUrl" column. The application code
-- no longer references this column; running this leaves the database
-- in a state with zero external product import traces.
--
-- Apply with:
--   npm run db:generate   # regenerate the Prisma client from the new schema
--   psql "$DIRECT_URL" -f scripts/drop-source-url.sql
-- or use a Prisma migration created via `npm run db:migrate -- --name drop_source_url`.

BEGIN;

ALTER TABLE "Product" DROP COLUMN IF EXISTS "sourceUrl";

COMMIT;
