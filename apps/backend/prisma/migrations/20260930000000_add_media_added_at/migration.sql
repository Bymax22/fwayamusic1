ALTER TABLE "media" ADD COLUMN "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "media" SET "added_at" = "created_at";