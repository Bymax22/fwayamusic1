-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."KYCStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ADDITIONAL_INFO_NEEDED');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE', 'BUSINESS_REGISTRATION', 'TAX_CERTIFICATE', 'UTILITY_BILL', 'BANK_STATEMENT');

-- CreateEnum
CREATE TYPE "public"."VerificationMethod" AS ENUM ('EMAIL', 'PHONE', 'DOCUMENT', 'BIOMETRIC');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "accepted_privacy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "accepted_terms" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "address" JSONB,
ADD COLUMN     "artist_name" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "business_name" TEXT,
ADD COLUMN     "business_type" TEXT,
ADD COLUMN     "consent_date" TIMESTAMP(3),
ADD COLUMN     "data_sharing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "date_of_birth" TIMESTAMP(3),
ADD COLUMN     "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marketing_emails" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone_number" TEXT,
ADD COLUMN     "social_links" JSONB,
ADD COLUMN     "stage_name" TEXT,
ADD COLUMN     "status" "public"."UserStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "tax_id" TEXT,
ADD COLUMN     "tax_number" TEXT,
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "public"."kyc_documents" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "document_type" "public"."DocumentType" NOT NULL,
    "document_number" TEXT,
    "front_image_url" TEXT NOT NULL,
    "back_image_url" TEXT,
    "selfie_image_url" TEXT,
    "status" "public"."KYCStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "rejection_reason" TEXT,
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "method" "public"."VerificationMethod" NOT NULL,
    "code" TEXT,
    "token" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resource_id" INTEGER,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kyc_documents_user_id_status_idx" ON "public"."kyc_documents"("user_id", "status");

-- CreateIndex
CREATE INDEX "kyc_documents_document_type_status_idx" ON "public"."kyc_documents"("document_type", "status");

-- CreateIndex
CREATE INDEX "verifications_token_expires_at_idx" ON "public"."verifications"("token", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_user_id_method_key" ON "public"."verifications"("user_id", "method");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_action_idx" ON "public"."audit_logs"("user_id", "action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resource_id_idx" ON "public"."audit_logs"("resource", "resource_id");
