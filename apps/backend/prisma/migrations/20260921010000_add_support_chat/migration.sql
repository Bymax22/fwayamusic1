ALTER TABLE "support_tickets"
  ADD COLUMN "assigned_to_id" INTEGER,
  ADD COLUMN "unread_count" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "support_messages" (
  "id" SERIAL NOT NULL,
  "ticket_id" INTEGER NOT NULL,
  "sender_id" INTEGER,
  "sender_name" TEXT,
  "body" TEXT NOT NULL,
  "is_staff" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "read_at" TIMESTAMP(3),

  CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_tickets_status_updated_at_idx" ON "support_tickets"("status", "updated_at");
CREATE INDEX "support_tickets_assigned_to_id_status_idx" ON "support_tickets"("assigned_to_id", "status");
CREATE INDEX "support_messages_ticket_id_created_at_idx" ON "support_messages"("ticket_id", "created_at");

ALTER TABLE "support_tickets"
  ADD CONSTRAINT "support_tickets_assigned_to_id_fkey"
  FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "support_messages"
  ADD CONSTRAINT "support_messages_ticket_id_fkey"
  FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "support_messages"
  ADD CONSTRAINT "support_messages_sender_id_fkey"
  FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "support_messages" ("ticket_id", "sender_name", "body", "is_staff", "created_at")
SELECT "id", COALESCE("name", "email"), "message", false, "created_at"
FROM "support_tickets";