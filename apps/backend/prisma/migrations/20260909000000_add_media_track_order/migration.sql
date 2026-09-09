ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "track_order" INTEGER;

UPDATE "media" AS media
SET "track_order" = ordered.track_order
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY album_id ORDER BY created_at ASC, id ASC) - 1 AS track_order
  FROM "media"
  WHERE album_id IS NOT NULL
) AS ordered
WHERE media.id = ordered.id AND media."track_order" IS NULL;

CREATE INDEX IF NOT EXISTS "media_album_id_track_order_idx" ON "media" ("album_id", "track_order");