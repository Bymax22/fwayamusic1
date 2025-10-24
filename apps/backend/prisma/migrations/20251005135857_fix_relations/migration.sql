/*
  Warnings:

  - A unique constraint covering the columns `[license_key]` on the table `downloads` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reseller_id,media_id]` on the table `reseller_links` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[fingerprint]` on the table `user_devices` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,device_id]` on the table `user_devices` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reseller_code]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `commission_rate` to the `commissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payment_method` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payment_provider` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('MOBILE_MONEY', 'BANK_TRANSFER', 'CREDIT_CARD', 'CRYPTO', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."PaymentProvider" AS ENUM ('MTN_MONEY', 'AIRTEL_MONEY', 'STRIPE', 'PAYPAL', 'FLUTTERWAVE', 'PAYSTACK', 'MPESA', 'BANK', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."Currency" AS ENUM ('USD', 'EUR', 'GBP', 'ZMW', 'ZAR', 'KES', 'NGN', 'GHS', 'UGX', 'TZS', 'XOF', 'XAF', 'AUD', 'CAD', 'JPY', 'CNY', 'INR', 'BRL', 'MXN');

-- CreateEnum
CREATE TYPE "public"."CommissionStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'HOLD');

-- CreateEnum
CREATE TYPE "public"."ResellerLinkStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."DeviceRestrictionLevel" AS ENUM ('NONE', 'BASIC', 'STRICT', 'ENCRYPTED');

-- CreateEnum
CREATE TYPE "public"."DownloadAccessType" AS ENUM ('OFFLINE', 'ONLINE', 'STREAMING');

-- AlterEnum
ALTER TYPE "public"."TransactionStatus" ADD VALUE 'PARTIALLY_REFUNDED';

-- AlterTable
ALTER TABLE "public"."commissions" ADD COLUMN     "commission_rate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "currency" "public"."Currency" NOT NULL DEFAULT 'USD',
ADD COLUMN     "payout_transaction_id" INTEGER,
ADD COLUMN     "status" "public"."CommissionStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "public"."downloads" ADD COLUMN     "access_type" "public"."DownloadAccessType" NOT NULL DEFAULT 'OFFLINE',
ADD COLUMN     "is_drm_protected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "license_key" TEXT;

-- AlterTable
ALTER TABLE "public"."library_items" ADD COLUMN     "purchased_at" TIMESTAMP(3),
ADD COLUMN     "transaction_id" INTEGER;

-- AlterTable
ALTER TABLE "public"."media" ADD COLUMN     "allow_reselling" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "artist_commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "encryption_key" TEXT,
ADD COLUMN     "is_drm_protected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "max_devices" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "platform_commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
ADD COLUMN     "reseller_commission_rate" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."reseller_links" ADD COLUMN     "conversion_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "custom_commission_rate" DOUBLE PRECISION,
ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "status" "public"."ResellerLinkStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "public"."transactions" ADD COLUMN     "currency" "public"."Currency" NOT NULL DEFAULT 'USD',
ADD COLUMN     "exchange_rate" DOUBLE PRECISION,
ADD COLUMN     "is_reseller_sale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "original_amount" DOUBLE PRECISION,
ADD COLUMN     "original_currency" "public"."Currency",
ADD COLUMN     "payment_method" "public"."PaymentMethod" NOT NULL,
ADD COLUMN     "payment_provider" "public"."PaymentProvider" NOT NULL,
ADD COLUMN     "provider_reference" TEXT,
ADD COLUMN     "reseller_link_id" INTEGER;

-- AlterTable
ALTER TABLE "public"."user_devices" ADD COLUMN     "device_type" TEXT,
ADD COLUMN     "fingerprint" TEXT,
ADD COLUMN     "os" TEXT;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "commission_rate" DOUBLE PRECISION DEFAULT 0.2,
ADD COLUMN     "country" TEXT DEFAULT 'US',
ADD COLUMN     "defaultCurrency" "public"."Currency" NOT NULL DEFAULT 'USD',
ADD COLUMN     "is_reseller" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paid_commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "reseller_code" TEXT,
ADD COLUMN     "total_commission" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."payment_accounts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "provider" "public"."PaymentProvider" NOT NULL,
    "account_type" "public"."PaymentMethod" NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_name" TEXT,
    "country" TEXT,
    "currency" "public"."Currency" NOT NULL DEFAULT 'USD',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payout_transactions" (
    "id" SERIAL NOT NULL,
    "payment_account_id" INTEGER NOT NULL,
    "transaction_id" INTEGER,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" "public"."Currency" NOT NULL DEFAULT 'USD',
    "status" "public"."TransactionStatus" NOT NULL,
    "reference" TEXT NOT NULL,
    "provider_reference" TEXT,
    "fees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payout_requests" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" "public"."Currency" NOT NULL DEFAULT 'USD',
    "status" "public"."TransactionStatus" NOT NULL,
    "payment_account_id" INTEGER,
    "reason" TEXT,
    "metadata" JSONB,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."device_licenses" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "device_id" INTEGER NOT NULL,
    "media_id" INTEGER NOT NULL,
    "transaction_id" INTEGER,
    "license_key" TEXT NOT NULL,
    "restriction_level" "public"."DeviceRestrictionLevel" NOT NULL DEFAULT 'STRICT',
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."currency_exchanges" (
    "id" SERIAL NOT NULL,
    "from_currency" "public"."Currency" NOT NULL,
    "to_currency" "public"."Currency" NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "currency_exchanges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_settings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_accounts_user_id_is_default_idx" ON "public"."payment_accounts"("user_id", "is_default");

-- CreateIndex
CREATE UNIQUE INDEX "payment_accounts_user_id_provider_account_number_key" ON "public"."payment_accounts"("user_id", "provider", "account_number");

-- CreateIndex
CREATE UNIQUE INDEX "payout_transactions_reference_key" ON "public"."payout_transactions"("reference");

-- CreateIndex
CREATE INDEX "payout_transactions_payment_account_id_status_idx" ON "public"."payout_transactions"("payment_account_id", "status");

-- CreateIndex
CREATE INDEX "payout_requests_user_id_status_idx" ON "public"."payout_requests"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "device_licenses_license_key_key" ON "public"."device_licenses"("license_key");

-- CreateIndex
CREATE INDEX "device_licenses_license_key_idx" ON "public"."device_licenses"("license_key");

-- CreateIndex
CREATE UNIQUE INDEX "device_licenses_user_id_device_id_media_id_key" ON "public"."device_licenses"("user_id", "device_id", "media_id");

-- CreateIndex
CREATE UNIQUE INDEX "currency_exchanges_from_currency_to_currency_key" ON "public"."currency_exchanges"("from_currency", "to_currency");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "public"."system_settings"("key");

-- CreateIndex
CREATE INDEX "commissions_reseller_id_status_idx" ON "public"."commissions"("reseller_id", "status");

-- CreateIndex
CREATE INDEX "commissions_transaction_id_idx" ON "public"."commissions"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "downloads_license_key_key" ON "public"."downloads"("license_key");

-- CreateIndex
CREATE INDEX "media_allow_reselling_idx" ON "public"."media"("allow_reselling");

-- CreateIndex
CREATE INDEX "reseller_links_code_idx" ON "public"."reseller_links"("code");

-- CreateIndex
CREATE UNIQUE INDEX "reseller_links_reseller_id_media_id_key" ON "public"."reseller_links"("reseller_id", "media_id");

-- CreateIndex
CREATE INDEX "transactions_user_id_status_idx" ON "public"."transactions"("user_id", "status");

-- CreateIndex
CREATE INDEX "transactions_payment_provider_provider_reference_idx" ON "public"."transactions"("payment_provider", "provider_reference");

-- CreateIndex
CREATE INDEX "transactions_reseller_link_id_idx" ON "public"."transactions"("reseller_link_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_fingerprint_key" ON "public"."user_devices"("fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_user_id_device_id_key" ON "public"."user_devices"("user_id", "device_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_reseller_code_key" ON "public"."users"("reseller_code");

-- CreateIndex
CREATE INDEX "users_is_reseller_idx" ON "public"."users"("is_reseller");

-- CreateIndex
CREATE INDEX "users_reseller_code_idx" ON "public"."users"("reseller_code");
