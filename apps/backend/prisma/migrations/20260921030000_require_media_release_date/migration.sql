UPDATE "media" SET "release_date" = "created_at" WHERE "release_date" IS NULL;
ALTER TABLE "media" ALTER COLUMN "release_date" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "media" ALTER COLUMN "release_date" SET NOT NULL;