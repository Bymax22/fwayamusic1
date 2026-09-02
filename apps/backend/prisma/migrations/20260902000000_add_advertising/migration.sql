CREATE TYPE "AdvertisingMediaType" AS ENUM ('IMAGE', 'VIDEO');

CREATE TABLE "advertising_campaigns" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "frequency_cap" INTEGER NOT NULL DEFAULT 3,
    "cooldown_seconds" INTEGER NOT NULL DEFAULT 300,
    "created_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "advertising_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "advertisements" (
    "id" SERIAL NOT NULL,
    "campaign_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "media_type" "AdvertisingMediaType" NOT NULL,
    "media_url" TEXT NOT NULL,
    "click_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "advertisements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "advertising_campaigns_is_active_start_at_end_at_idx" ON "advertising_campaigns"("is_active", "start_at", "end_at");
CREATE INDEX "advertising_campaigns_created_by_id_idx" ON "advertising_campaigns"("created_by_id");
CREATE INDEX "advertisements_campaign_id_is_active_sort_order_idx" ON "advertisements"("campaign_id", "is_active", "sort_order");
ALTER TABLE "advertising_campaigns" ADD CONSTRAINT "advertising_campaigns_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "advertising_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;