BEGIN;
UPDATE "news" SET "authorId" = NULL WHERE "authorId" IS NOT NULL AND "authorId" NOT IN (SELECT id FROM "users");
COMMIT;
SELECT COUNT(*) AS remaining_orphan_news FROM "news" WHERE "authorId" IS NOT NULL AND "authorId" NOT IN (SELECT id FROM "users");
