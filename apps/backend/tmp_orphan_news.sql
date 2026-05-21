SELECT COUNT(*) AS orphan_news_count FROM "news" WHERE "authorId" IS NOT NULL AND "authorId" NOT IN (SELECT id FROM "users");

SELECT id, "authorId", title FROM "news" WHERE "authorId" IS NOT NULL AND "authorId" NOT IN (SELECT id FROM "users") LIMIT 50;
