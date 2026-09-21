ALTER TABLE "advertisements" ADD COLUMN "placement" TEXT NOT NULL DEFAULT 'HOME_BANNER';
ALTER TABLE "notifications"
  ADD COLUMN "broadcast_id" INTEGER,
  ADD COLUMN "delivery_status" TEXT NOT NULL DEFAULT 'DELIVERED',
  ADD COLUMN "delivered_at" TIMESTAMP(3),
  ADD COLUMN "failure_reason" TEXT,
  ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS "advertisement_events" (
  "id" SERIAL NOT NULL,
  "advertisement_id" INTEGER NOT NULL,
  "event_type" TEXT NOT NULL,
  "user_id" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "advertisement_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_broadcasts" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
  "audience" JSONB NOT NULL,
  "scheduled_at" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'SENT',
  "sent_at" TIMESTAMP(3),
  "total_recipients" INTEGER NOT NULL DEFAULT 0,
  "delivered_count" INTEGER NOT NULL DEFAULT 0,
  "failed_count" INTEGER NOT NULL DEFAULT 0,
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "failure_reason" TEXT,
  "created_by_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notification_broadcasts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin_analytics_snapshots" (
  "id" SERIAL NOT NULL,
  "day" TIMESTAMP(3) NOT NULL,
  "active_users" INTEGER NOT NULL,
  "active_users_24h" INTEGER NOT NULL,
  "pending_applications" INTEGER NOT NULL,
  "users_by_country" JSONB NOT NULL,
  "users_by_role" JSONB NOT NULL,
  "signups" INTEGER NOT NULL DEFAULT 0,
  "approvals" INTEGER NOT NULL DEFAULT 0,
  "plays" INTEGER NOT NULL DEFAULT 0,
  "downloads" INTEGER NOT NULL DEFAULT 0,
  "shares" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "admin_analytics_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admin_analytics_snapshots_day_key" ON "admin_analytics_snapshots"("day");
CREATE INDEX "notification_broadcasts_status_scheduled_at_idx" ON "notification_broadcasts"("status", "scheduled_at");
CREATE INDEX "notification_broadcasts_created_by_id_created_at_idx" ON "notification_broadcasts"("created_by_id", "created_at");
CREATE INDEX "advertisement_events_advertisement_id_created_at_idx" ON "advertisement_events"("advertisement_id", "created_at");

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_broadcast_id_fkey" FOREIGN KEY ("broadcast_id") REFERENCES "notification_broadcasts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notification_broadcasts" ADD CONSTRAINT "notification_broadcasts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "advertisement_events" ADD CONSTRAINT "advertisement_events_advertisement_id_fkey" FOREIGN KEY ("advertisement_id") REFERENCES "advertisements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "advertisement_events" ADD CONSTRAINT "advertisement_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;