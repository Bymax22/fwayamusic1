-- Add kycStatus column to users table
ALTER TABLE "public"."users" ADD COLUMN "kyc_status" TEXT NOT NULL DEFAULT 'NOT_SUBMITTED';
