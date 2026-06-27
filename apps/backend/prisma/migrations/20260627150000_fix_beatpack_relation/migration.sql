-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('AUDIO', 'VIDEO', 'PODCAST', 'LIVE_STREAM', 'ALBUM', 'COLLECTION', 'PLAYLIST');

-- CreateEnum
CREATE TYPE "VideoQuality" AS ENUM ('MOBILE', 'SD', 'HD', 'FULL_HD', 'QUAD_HD', 'ULTRA_HD', 'ULTRA_HD_8K');

-- CreateEnum
CREATE TYPE "VideoCodec" AS ENUM ('H264', 'H265_HEVC', 'VP9', 'AV1');

-- CreateEnum
CREATE TYPE "AudioCodec" AS ENUM ('AAC', 'MP3', 'OPUS', 'FLAC', 'ALAC', 'VORBIS');

-- CreateEnum
CREATE TYPE "PlaylistType" AS ENUM ('SYSTEM', 'USER', 'SMART', 'RADIO', 'COLLABORATIVE', 'ALGORITHM_GENERATED', 'TRENDING', 'CURATED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ARTIST', 'ADMIN', 'MODERATOR', 'RESELLER', 'PRODUCER', 'CONTENT_MANAGER', 'ANALYTICS_VIEWER');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'PROCESSING', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MediaAccessType" AS ENUM ('FREE', 'PREMIUM', 'PAY_PER_VIEW', 'SUBSCRIPTION', 'TIME_LIMITED', 'EXCLUSIVE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MOBILE_MONEY', 'BANK_TRANSFER', 'CREDIT_CARD', 'CRYPTO', 'OTHER', 'DEBIT_CARD', 'WALLET');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('MTN_MONEY', 'AIRTEL_MONEY', 'STRIPE', 'PAYPAL', 'FLUTTERWAVE', 'PAYSTACK', 'MPESA', 'BANK', 'OTHER', 'COINBASE', 'CRYPTO_GATEWAY');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'GBP', 'ZMW', 'ZAR', 'KES', 'NGN', 'GHS', 'UGX', 'TZS', 'XOF', 'XAF', 'AUD', 'CAD', 'JPY', 'CNY', 'INR', 'BRL', 'MXN', 'BWP', 'RWF', 'ETB', 'MUR', 'SCR');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'LIFETIME');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED', 'SUSPENDED', 'PENDING');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'HOLD', 'DISPUTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ResellerLinkStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DeviceRestrictionLevel" AS ENUM ('NONE', 'BASIC', 'STRICT', 'ENCRYPTED', 'ULTRA_SECURE');

-- CreateEnum
CREATE TYPE "DownloadAccessType" AS ENUM ('OFFLINE', 'ONLINE', 'STREAMING', 'BOTH');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'VERIFIED', 'REJECTED', 'DELETED_PENDING', 'DELETED_COMPLETED');

-- CreateEnum
CREATE TYPE "KYCStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ADDITIONAL_INFO_NEEDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE', 'BUSINESS_REGISTRATION', 'TAX_CERTIFICATE', 'UTILITY_BILL', 'BANK_STATEMENT', 'PROOF_OF_ADDRESS');

-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('EMAIL', 'PHONE', 'DOCUMENT', 'BIOMETRIC', 'SMS', 'TWO_FACTOR_AUTH');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'PUBLISHED', 'REJECTED', 'ARCHIVED', 'DELETED', 'SCHEDULED', 'PRIVATE');

-- CreateEnum
CREATE TYPE "DeletionReason" AS ENUM ('USER_REQUEST', 'DUPLICATE', 'COPYRIGHT_VIOLATION', 'POLICY_VIOLATION', 'ACCOUNT_DELETION', 'ADMIN_REMOVAL', 'EXPIRED', 'OTHER');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED', 'UNDER_REVIEW', 'APPEALED');

-- CreateEnum
CREATE TYPE "LiveStreamStatus" AS ENUM ('SCHEDULED', 'LIVE', 'PAUSED', 'ENDED', 'CANCELLED', 'PROCESSING', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('TRENDING', 'PERSONALIZED', 'COLLABORATIVE', 'CONTENT_BASED', 'SOCIAL', 'TRENDING_LOCAL', 'TRENDING_GLOBAL', 'SIMILAR_ARTIST');

-- CreateEnum
CREATE TYPE "StreamingQualityPreset" AS ENUM ('ADAPTIVE', 'MOBILE_FIRST', 'BALANCED', 'HIGH_QUALITY', 'DATA_SAVER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_RELEASE', 'FOLLOW', 'LIKE', 'COMMENT', 'SHARE', 'PURCHASE', 'DOWNLOAD_COMPLETE', 'STREAM_MILESTONE', 'SYSTEM', 'PROMOTION', 'LIVE_STREAM_START', 'COLLABORATION_REQUEST');

-- CreateEnum
CREATE TYPE "AudioFeatureCategory" AS ENUM ('ENERGETIC', 'ACOUSTIC', 'DANCEABLE', 'MELANCHOLIC', 'UPLIFTING', 'DARK', 'RELAXED', 'AGGRESSIVE', 'INSTRUMENTAL', 'VOCAL_HEAVY');

-- CreateEnum
CREATE TYPE "CollaborationType" AS ENUM ('PRODUCER', 'FEATURE_ARTIST', 'SONGWRITER', 'ENGINEER', 'MIXER', 'MASTERING', 'BAND_MEMBER', 'GUEST_ARTIST');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('SAMPLE', 'LOOP', 'TEMPLATE', 'PRESET', 'SOUND');

-- CreateEnum
CREATE TYPE "RatingValue" AS ENUM ('ONE', 'TWO', 'THREE', 'FOUR', 'FIVE');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "is_social_auth" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT,
    "social_id" TEXT,
    "last_login_at" TIMESTAMP(3),
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "premium_until" TIMESTAMP(3),
    "wallet_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "commission_rate" DOUBLE PRECISION DEFAULT 0.2,
    "country" TEXT DEFAULT 'US',
    "is_reseller" BOOLEAN NOT NULL DEFAULT false,
    "paid_commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reseller_code" TEXT,
    "total_commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "accepted_privacy" BOOLEAN NOT NULL DEFAULT false,
    "accepted_terms" BOOLEAN NOT NULL DEFAULT false,
    "address" JSONB,
    "artist_name" TEXT,
    "bio" TEXT,
    "business_name" TEXT,
    "business_type" TEXT,
    "consent_date" TIMESTAMP(3),
    "data_sharing" BOOLEAN NOT NULL DEFAULT false,
    "date_of_birth" TIMESTAMP(3),
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "marketing_emails" BOOLEAN NOT NULL DEFAULT false,
    "phone_number" TEXT,
    "social_links" JSONB,
    "stage_name" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "tax_id" TEXT,
    "tax_number" TEXT,
    "website" TEXT,
    "accepted_cookies" BOOLEAN NOT NULL DEFAULT false,
    "account_deactivated_at" TIMESTAMP(3),
    "allow_explicit" BOOLEAN NOT NULL DEFAULT true,
    "artist_bio" TEXT,
    "auto_download_quality" "VideoQuality",
    "auto_renew_subscription" BOOLEAN NOT NULL DEFAULT true,
    "business_license" TEXT,
    "business_registration" TEXT,
    "business_verified" BOOLEAN NOT NULL DEFAULT false,
    "cloudinary_public_id" TEXT,
    "cover_cloudinary_id" TEXT,
    "cover_image_url" TEXT,
    "default_currency" "Currency" NOT NULL DEFAULT 'USD',
    "deletion_details" JSONB,
    "deletion_reason" TEXT,
    "deletion_requested_at" TIMESTAMP(3),
    "free_trial_expires_at" TIMESTAMP(3),
    "free_trial_used" BOOLEAN NOT NULL DEFAULT false,
    "gender" TEXT,
    "is_account_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_artist" BOOLEAN NOT NULL DEFAULT false,
    "is_producer" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT DEFAULT 'en',
    "last_login_ip" TEXT,
    "last_password_reset" TIMESTAMP(3),
    "monthly_earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthly_spend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notification_settings" JSONB,
    "password_changed_at" TIMESTAMP(3),
    "producer_bio" TEXT,
    "producer_followers" INTEGER NOT NULL DEFAULT 0,
    "producer_name" TEXT,
    "producer_website" TEXT,
    "referral_code" TEXT,
    "reseller_earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "streaming_quality_pref" "StreamingQualityPreset" NOT NULL DEFAULT 'ADAPTIVE',
    "subscription_plan" "SubscriptionPlan",
    "timezone" TEXT DEFAULT 'UTC',
    "total_followers" INTEGER NOT NULL DEFAULT 0,
    "total_following" INTEGER NOT NULL DEFAULT 0,
    "total_spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_streams" INTEGER NOT NULL DEFAULT 0,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" TEXT,
    "verified_artist" BOOLEAN NOT NULL DEFAULT false,
    "verified_artist_at" TIMESTAMP(3),
    "verified_producer" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "art_cover_url" TEXT,
    "thumbnail_url" TEXT,
    "format" TEXT,
    "duration" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "genre" TEXT,
    "tags" TEXT[],
    "type" "MediaType" NOT NULL DEFAULT 'AUDIO',
    "access_type" "MediaAccessType" NOT NULL DEFAULT 'FREE',
    "price" DOUBLE PRECISION DEFAULT 0,
    "is_explicit" BOOLEAN NOT NULL DEFAULT false,
    "play_count" INTEGER NOT NULL DEFAULT 0,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "share_count" INTEGER NOT NULL DEFAULT 0,
    "last_played_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER,
    "cloudinary_public_id" TEXT,
    "bpm" INTEGER,
    "key" TEXT,
    "energy" DOUBLE PRECISION,
    "danceability" DOUBLE PRECISION,
    "valence" DOUBLE PRECISION,
    "acousticness" DOUBLE PRECISION,
    "allow_reselling" BOOLEAN NOT NULL DEFAULT true,
    "artist_commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "encryption_key" TEXT,
    "is_drm_protected" BOOLEAN NOT NULL DEFAULT false,
    "max_devices" INTEGER NOT NULL DEFAULT 1,
    "platform_commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "reseller_commission_rate" DOUBLE PRECISION,
    "album_id" INTEGER,
    "allow_commercial_use" BOOLEAN NOT NULL DEFAULT true,
    "allow_derivatives" BOOLEAN NOT NULL DEFAULT true,
    "audio_channels" INTEGER,
    "audio_codec" "AudioCodec",
    "audio_feature_category" "AudioFeatureCategory",
    "bitrate" INTEGER,
    "composer" TEXT,
    "content_status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "copyright_owner" TEXT,
    "copyright_year" INTEGER,
    "deleted_at" TIMESTAMP(3),
    "deletion_details" JSONB,
    "deletion_reason" "DeletionReason",
    "file_size" BIGINT,
    "frame_rate" DOUBLE PRECISION,
    "height" INTEGER,
    "isrc" TEXT,
    "language" TEXT,
    "license_type" TEXT,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "lyricist" TEXT,
    "mood" TEXT,
    "original_media_id" INTEGER,
    "release_date" TIMESTAMP(3),
    "rights" JSONB,
    "sample_rate" INTEGER,
    "thumbnail_cloudinary_id" TEXT,
    "total_streaming_time" BIGINT NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "video_codec" "VideoCodec",
    "width" INTEGER,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_variants" (
    "id" SERIAL NOT NULL,
    "media_id" INTEGER NOT NULL,
    "quality" "VideoQuality" NOT NULL,
    "url" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "bitrate" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "codec" "VideoCodec" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "albums" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "user_id" INTEGER NOT NULL,
    "cover_url" TEXT,
    "cloudinary_public_id" TEXT,
    "release_date" TIMESTAMP(3),
    "type" TEXT,
    "record_label" TEXT,
    "credits" JSONB,
    "content_status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "play_count" INTEGER NOT NULL DEFAULT 0,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_ratings" (
    "id" SERIAL NOT NULL,
    "media_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "rating" "RatingValue" NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watch_history" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "media_id" INTEGER NOT NULL,
    "watched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "watch_duration" INTEGER,
    "completion_percent" DOUBLE PRECISION,
    "quality" "VideoQuality",
    "device_type" TEXT,
    "is_offline_watch" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "watch_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_for_later" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "media_id" INTEGER NOT NULL,
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "saved_for_later_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_categories" (
    "media_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_categories_pkey" PRIMARY KEY ("media_id","category_id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_comments" (
    "id" SERIAL NOT NULL,
    "media_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "parent_id" INTEGER,
    "content" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "edited_at" TIMESTAMP(3),
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "media_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_interactions" (
    "id" SERIAL NOT NULL,
    "media_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "liked" BOOLEAN DEFAULT false,
    "saved" BOOLEAN DEFAULT false,
    "played" BOOLEAN DEFAULT false,
    "position" INTEGER,
    "interacted_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "last_played_position" INTEGER,

    CONSTRAINT "media_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlists" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cover_url" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "type" "PlaylistType" NOT NULL DEFAULT 'USER',
    "rules" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "is_collaborative" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "playlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_entries" (
    "id" SERIAL NOT NULL,
    "playlist_id" INTEGER NOT NULL,
    "media_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "added_by" INTEGER,

    CONSTRAINT "playlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "now_playing" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "media_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_playing" BOOLEAN NOT NULL DEFAULT false,
    "device_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "now_playing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_history" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "query" TEXT NOT NULL,
    "results" INTEGER,
    "clicked_result_id" INTEGER,
    "searched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_recommendations" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "media_id" INTEGER NOT NULL,
    "type" "RecommendationType" NOT NULL,
    "score" DOUBLE PRECISION,
    "reason" TEXT,
    "displayed_at" TIMESTAMP(3),
    "clicked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_devices" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "device_id" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "last_active_at" TIMESTAMP(3),
    "device_type" TEXT,
    "fingerprint" TEXT,
    "os" TEXT,
    "app_version" TEXT,
    "browser_agent" TEXT,
    "ip_address" TEXT,
    "is_current_device" BOOLEAN NOT NULL DEFAULT false,
    "is_trusted" BOOLEAN NOT NULL DEFAULT false,
    "os_version" TEXT,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "token" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refresh_expires_at" TIMESTAMP(3),
    "refresh_token" TEXT,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers" (
    "id" SERIAL NOT NULL,
    "follower_id" INTEGER NOT NULL,
    "following_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "followers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "downloads" (
    "id" SERIAL NOT NULL,
    "media_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "device_id" TEXT,
    "downloaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "access_type" "DownloadAccessType" NOT NULL DEFAULT 'OFFLINE',
    "is_drm_protected" BOOLEAN NOT NULL DEFAULT false,
    "license_key" TEXT,
    "extra_data" JSONB,
    "download_progress" DOUBLE PRECISION,
    "file_size" BIGINT,
    "quality" "VideoQuality",

    CONSTRAINT "downloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "user_id" INTEGER,
    "media_id" INTEGER,
    "reference" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "exchange_rate" DOUBLE PRECISION,
    "is_reseller_sale" BOOLEAN NOT NULL DEFAULT false,
    "original_amount" DOUBLE PRECISION,
    "original_currency" "Currency",
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_provider" "PaymentProvider" NOT NULL,
    "provider_reference" TEXT,
    "reseller_link_id" INTEGER,
    "processed_at" TIMESTAMP(3),
    "receipt" TEXT,
    "receipt_url" TEXT,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reseller_id" INTEGER NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "media_id" INTEGER NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commission_rate" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "payout_transaction_id" INTEGER,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reseller_links" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "reseller_id" INTEGER NOT NULL,
    "media_id" INTEGER NOT NULL,
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversion_count" INTEGER NOT NULL DEFAULT 0,
    "custom_commission_rate" DOUBLE PRECISION,
    "expires_at" TIMESTAMP(3),
    "status" "ResellerLinkStatus" NOT NULL DEFAULT 'ACTIVE',
    "earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "reseller_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "libraries" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_private" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "libraries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_items" (
    "id" SERIAL NOT NULL,
    "library_id" INTEGER NOT NULL,
    "media_id" INTEGER NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchased_at" TIMESTAMP(3),
    "transaction_id" INTEGER,

    CONSTRAINT "library_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_licenses" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "device_id" INTEGER NOT NULL,
    "media_id" INTEGER NOT NULL,
    "transaction_id" INTEGER,
    "license_key" TEXT NOT NULL,
    "restriction_level" "DeviceRestrictionLevel" NOT NULL DEFAULT 'STRICT',
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_accounts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "account_type" "PaymentMethod" NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_name" TEXT,
    "country" TEXT,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "account_holder" TEXT,
    "verified_at" TIMESTAMP(3),

    CONSTRAINT "payment_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_transactions" (
    "id" SERIAL NOT NULL,
    "payment_account_id" INTEGER NOT NULL,
    "transaction_id" INTEGER,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "status" "TransactionStatus" NOT NULL,
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
CREATE TABLE "payout_requests" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "status" "TransactionStatus" NOT NULL,
    "payment_account_id" INTEGER,
    "reason" TEXT,
    "metadata" JSONB,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queued_payouts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "next_retry_at" TIMESTAMP(3),

    CONSTRAINT "queued_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "price" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "provider" "PaymentProvider",
    "provider_subscription_id" TEXT,
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "canceled_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSONB,
    "read_at" TIMESTAMP(3),
    "type" "NotificationType" NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tags" TEXT[],
    "metadata" JSONB,
    "author_id" INTEGER,
    "cloudinary_public_id" TEXT,
    "image_url" TEXT,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduled_at" TIMESTAMP(3),

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_likes" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "news_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "news_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_shares" (
    "id" SERIAL NOT NULL,
    "news_id" INTEGER NOT NULL,
    "shared_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "news_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_comments" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "news_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "news_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_bookmarks" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "news_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "news_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_views" (
    "id" SERIAL NOT NULL,
    "ip_address" TEXT,
    "news_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_reports" (
    "id" SERIAL NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "news_id" INTEGER NOT NULL,
    "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "news_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_reactions" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "news_id" INTEGER NOT NULL,
    "reacted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "news_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_documents" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "document_number" TEXT,
    "front_image_url" TEXT NOT NULL,
    "back_image_url" TEXT,
    "selfie_image_url" TEXT,
    "status" "KYCStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "rejection_reason" TEXT,
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "method" "VerificationMethod" NOT NULL,
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
CREATE TABLE "audit_logs" (
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

-- CreateTable
CREATE TABLE "system_alerts" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_by" INTEGER,

    CONSTRAINT "system_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "category" TEXT,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_moderations" (
    "id" SERIAL NOT NULL,
    "media_id" INTEGER NOT NULL,
    "content_creator_id" INTEGER NOT NULL,
    "reviewer_id" INTEGER,
    "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "flags" TEXT[],
    "notes" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "appealed" BOOLEAN NOT NULL DEFAULT false,
    "appeal_reason" TEXT,
    "appealed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_moderations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency_exchanges" (
    "id" SERIAL NOT NULL,
    "from_currency" "Currency" NOT NULL,
    "to_currency" "Currency" NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "currency_exchanges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "float_accounts" (
    "id" SERIAL NOT NULL,
    "currency" "Currency" NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "float_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "float_transactions" (
    "id" SERIAL NOT NULL,
    "float_account_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "balance_after" DOUBLE PRECISION NOT NULL,
    "reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "float_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_streams" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "user_id" INTEGER NOT NULL,
    "status" "LiveStreamStatus" NOT NULL DEFAULT 'SCHEDULED',
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "scheduled_for" TIMESTAMP(3),
    "stream_url" TEXT,
    "stream_key" TEXT,
    "thumbnail_url" TEXT,
    "viewer_count" INTEGER NOT NULL DEFAULT 0,
    "peak_viewer_count" INTEGER NOT NULL DEFAULT 0,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "is_recorded" BOOLEAN NOT NULL DEFAULT false,
    "recorded_media_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_streams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_stream_sessions" (
    "id" SERIAL NOT NULL,
    "live_stream_id" INTEGER NOT NULL,
    "media_id" INTEGER,
    "bitrate" INTEGER,
    "fps" DOUBLE PRECISION,
    "resolution" TEXT,
    "codec" "VideoCodec",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_stream_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_stream_viewers" (
    "id" SERIAL NOT NULL,
    "live_stream_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "watch_duration" INTEGER,

    CONSTRAINT "live_stream_viewers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producer_collaborations" (
    "id" SERIAL NOT NULL,
    "media_id" INTEGER NOT NULL,
    "producer_id" INTEGER NOT NULL,
    "artist_id" INTEGER NOT NULL,
    "type" "CollaborationType" NOT NULL,
    "role_description" TEXT,
    "is_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producer_collaborations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beat_packs" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "genre" TEXT,
    "user_id" INTEGER NOT NULL,
    "cover_url" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "access_type" "MediaAccessType" NOT NULL DEFAULT 'FREE',
    "play_count" INTEGER NOT NULL DEFAULT 0,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beat_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beat_pack_beats" (
    "id" SERIAL NOT NULL,
    "pack_id" INTEGER NOT NULL,
    "beat_id" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beat_pack_beats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "resourceType" "ResourceType" NOT NULL,
    "genre" TEXT,
    "user_id" INTEGER NOT NULL,
    "file_url" TEXT,
    "thumbnail_url" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "access_type" "MediaAccessType" NOT NULL DEFAULT 'FREE',
    "play_count" INTEGER NOT NULL DEFAULT 0,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions_legacy" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "token" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_legacy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_reseller_code_key" ON "users"("reseller_code");

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_is_artist_idx" ON "users"("is_artist");

-- CreateIndex
CREATE INDEX "users_is_producer_idx" ON "users"("is_producer");

-- CreateIndex
CREATE INDEX "users_is_reseller_idx" ON "users"("is_reseller");

-- CreateIndex
CREATE INDEX "users_reseller_code_idx" ON "users"("reseller_code");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_is_premium_idx" ON "users"("is_premium");

-- CreateIndex
CREATE INDEX "users_verified_artist_idx" ON "users"("verified_artist");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "media_url_key" ON "media"("url");

-- CreateIndex
CREATE INDEX "media_user_id_idx" ON "media"("user_id");

-- CreateIndex
CREATE INDEX "media_access_type_idx" ON "media"("access_type");

-- CreateIndex
CREATE INDEX "media_allow_reselling_idx" ON "media"("allow_reselling");

-- CreateIndex
CREATE INDEX "media_content_status_idx" ON "media"("content_status");

-- CreateIndex
CREATE INDEX "media_type_idx" ON "media"("type");

-- CreateIndex
CREATE INDEX "media_deleted_at_idx" ON "media"("deleted_at");

-- CreateIndex
CREATE INDEX "media_created_at_idx" ON "media"("created_at");

-- CreateIndex
CREATE INDEX "media_genre_idx" ON "media"("genre");

-- CreateIndex
CREATE INDEX "media_play_count_idx" ON "media"("play_count");

-- CreateIndex
CREATE UNIQUE INDEX "video_variants_media_id_quality_key" ON "video_variants"("media_id", "quality");

-- CreateIndex
CREATE INDEX "albums_user_id_idx" ON "albums"("user_id");

-- CreateIndex
CREATE INDEX "albums_release_date_idx" ON "albums"("release_date");

-- CreateIndex
CREATE UNIQUE INDEX "media_ratings_media_id_user_id_key" ON "media_ratings"("media_id", "user_id");

-- CreateIndex
CREATE INDEX "watch_history_user_id_watched_at_idx" ON "watch_history"("user_id", "watched_at");

-- CreateIndex
CREATE INDEX "watch_history_media_id_idx" ON "watch_history"("media_id");

-- CreateIndex
CREATE UNIQUE INDEX "watch_history_user_id_media_id_key" ON "watch_history"("user_id", "media_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_for_later_user_id_media_id_key" ON "saved_for_later"("user_id", "media_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "media_comments_media_id_idx" ON "media_comments"("media_id");

-- CreateIndex
CREATE INDEX "media_comments_user_id_idx" ON "media_comments"("user_id");

-- CreateIndex
CREATE INDEX "media_comments_parent_id_idx" ON "media_comments"("parent_id");

-- CreateIndex
CREATE INDEX "media_interactions_user_id_idx" ON "media_interactions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_interactions_media_id_user_id_key" ON "media_interactions"("media_id", "user_id");

-- CreateIndex
CREATE INDEX "playlists_user_id_idx" ON "playlists"("user_id");

-- CreateIndex
CREATE INDEX "playlists_is_public_idx" ON "playlists"("is_public");

-- CreateIndex
CREATE UNIQUE INDEX "playlist_entries_playlist_id_media_id_key" ON "playlist_entries"("playlist_id", "media_id");

-- CreateIndex
CREATE UNIQUE INDEX "now_playing_user_id_key" ON "now_playing"("user_id");

-- CreateIndex
CREATE INDEX "search_history_user_id_searched_at_idx" ON "search_history"("user_id", "searched_at");

-- CreateIndex
CREATE INDEX "user_recommendations_user_id_type_idx" ON "user_recommendations"("user_id", "type");

-- CreateIndex
CREATE INDEX "user_recommendations_media_id_idx" ON "user_recommendations"("media_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_fingerprint_key" ON "user_devices"("fingerprint");

-- CreateIndex
CREATE INDEX "user_devices_user_id_idx" ON "user_devices"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_user_id_device_id_key" ON "user_devices"("user_id", "device_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_key" ON "sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "followers_follower_id_idx" ON "followers"("follower_id");

-- CreateIndex
CREATE INDEX "followers_following_id_idx" ON "followers"("following_id");

-- CreateIndex
CREATE UNIQUE INDEX "followers_follower_id_following_id_key" ON "followers"("follower_id", "following_id");

-- CreateIndex
CREATE UNIQUE INDEX "downloads_license_key_key" ON "downloads"("license_key");

-- CreateIndex
CREATE INDEX "downloads_user_id_idx" ON "downloads"("user_id");

-- CreateIndex
CREATE INDEX "downloads_device_id_idx" ON "downloads"("device_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_reference_key" ON "transactions"("reference");

-- CreateIndex
CREATE INDEX "transactions_user_id_status_idx" ON "transactions"("user_id", "status");

-- CreateIndex
CREATE INDEX "transactions_payment_provider_provider_reference_idx" ON "transactions"("payment_provider", "provider_reference");

-- CreateIndex
CREATE INDEX "transactions_reseller_link_id_idx" ON "transactions"("reseller_link_id");

-- CreateIndex
CREATE INDEX "transactions_created_at_idx" ON "transactions"("created_at");

-- CreateIndex
CREATE INDEX "commissions_reseller_id_status_idx" ON "commissions"("reseller_id", "status");

-- CreateIndex
CREATE INDEX "commissions_transaction_id_idx" ON "commissions"("transaction_id");

-- CreateIndex
CREATE INDEX "commissions_status_idx" ON "commissions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "reseller_links_code_key" ON "reseller_links"("code");

-- CreateIndex
CREATE INDEX "reseller_links_code_idx" ON "reseller_links"("code");

-- CreateIndex
CREATE INDEX "reseller_links_status_idx" ON "reseller_links"("status");

-- CreateIndex
CREATE UNIQUE INDEX "reseller_links_reseller_id_media_id_key" ON "reseller_links"("reseller_id", "media_id");

-- CreateIndex
CREATE INDEX "libraries_user_id_idx" ON "libraries"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "library_items_library_id_media_id_key" ON "library_items"("library_id", "media_id");

-- CreateIndex
CREATE UNIQUE INDEX "device_licenses_license_key_key" ON "device_licenses"("license_key");

-- CreateIndex
CREATE INDEX "device_licenses_license_key_idx" ON "device_licenses"("license_key");

-- CreateIndex
CREATE INDEX "device_licenses_expires_at_idx" ON "device_licenses"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "device_licenses_user_id_device_id_media_id_key" ON "device_licenses"("user_id", "device_id", "media_id");

-- CreateIndex
CREATE INDEX "payment_accounts_user_id_is_default_idx" ON "payment_accounts"("user_id", "is_default");

-- CreateIndex
CREATE INDEX "payment_accounts_is_verified_idx" ON "payment_accounts"("is_verified");

-- CreateIndex
CREATE UNIQUE INDEX "payment_accounts_user_id_provider_account_number_key" ON "payment_accounts"("user_id", "provider", "account_number");

-- CreateIndex
CREATE UNIQUE INDEX "payout_transactions_reference_key" ON "payout_transactions"("reference");

-- CreateIndex
CREATE INDEX "payout_transactions_payment_account_id_status_idx" ON "payout_transactions"("payment_account_id", "status");

-- CreateIndex
CREATE INDEX "payout_transactions_status_idx" ON "payout_transactions"("status");

-- CreateIndex
CREATE INDEX "payout_requests_user_id_status_idx" ON "payout_requests"("user_id", "status");

-- CreateIndex
CREATE INDEX "payout_requests_status_idx" ON "payout_requests"("status");

-- CreateIndex
CREATE INDEX "queued_payouts_status_created_at_idx" ON "queued_payouts"("status", "created_at");

-- CreateIndex
CREATE INDEX "queued_payouts_user_id_status_idx" ON "queued_payouts"("user_id", "status");

-- CreateIndex
CREATE INDEX "queued_payouts_next_retry_at_idx" ON "queued_payouts"("next_retry_at");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_status_idx" ON "subscriptions"("user_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_expires_at_idx" ON "subscriptions"("expires_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "news_slug_key" ON "news"("slug");

-- CreateIndex
CREATE INDEX "news_author_id_idx" ON "news"("author_id");

-- CreateIndex
CREATE INDEX "news_published_at_idx" ON "news"("published_at");

-- CreateIndex
CREATE INDEX "news_is_published_idx" ON "news"("is_published");

-- CreateIndex
CREATE UNIQUE INDEX "news_likes_news_id_user_id_key" ON "news_likes"("news_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "news_bookmarks_news_id_user_id_key" ON "news_bookmarks"("news_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "news_reactions_news_id_user_id_type_key" ON "news_reactions"("news_id", "user_id", "type");

-- CreateIndex
CREATE INDEX "kyc_documents_user_id_status_idx" ON "kyc_documents"("user_id", "status");

-- CreateIndex
CREATE INDEX "kyc_documents_document_type_status_idx" ON "kyc_documents"("document_type", "status");

-- CreateIndex
CREATE INDEX "verifications_token_expires_at_idx" ON "verifications"("token", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_user_id_method_key" ON "verifications"("user_id", "method");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_action_idx" ON "audit_logs"("user_id", "action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resource_id_idx" ON "audit_logs"("resource", "resource_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "system_alerts_type_resolved_idx" ON "system_alerts"("type", "resolved");

-- CreateIndex
CREATE INDEX "system_alerts_severity_created_at_idx" ON "system_alerts"("severity", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_category_idx" ON "system_settings"("category");

-- CreateIndex
CREATE INDEX "content_moderations_status_idx" ON "content_moderations"("status");

-- CreateIndex
CREATE INDEX "content_moderations_media_id_idx" ON "content_moderations"("media_id");

-- CreateIndex
CREATE INDEX "content_moderations_created_at_idx" ON "content_moderations"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "currency_exchanges_from_currency_to_currency_key" ON "currency_exchanges"("from_currency", "to_currency");

-- CreateIndex
CREATE UNIQUE INDEX "float_accounts_currency_key" ON "float_accounts"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "float_transactions_reference_key" ON "float_transactions"("reference");

-- CreateIndex
CREATE INDEX "float_transactions_float_account_id_created_at_idx" ON "float_transactions"("float_account_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "live_streams_stream_key_key" ON "live_streams"("stream_key");

-- CreateIndex
CREATE INDEX "live_streams_user_id_status_idx" ON "live_streams"("user_id", "status");

-- CreateIndex
CREATE INDEX "live_streams_status_idx" ON "live_streams"("status");

-- CreateIndex
CREATE INDEX "live_stream_viewers_live_stream_id_idx" ON "live_stream_viewers"("live_stream_id");

-- CreateIndex
CREATE UNIQUE INDEX "live_stream_viewers_live_stream_id_user_id_key" ON "live_stream_viewers"("live_stream_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "producer_collaborations_media_id_producer_id_type_key" ON "producer_collaborations"("media_id", "producer_id", "type");

-- CreateIndex
CREATE INDEX "beat_packs_user_id_idx" ON "beat_packs"("user_id");

-- CreateIndex
CREATE INDEX "beat_packs_access_type_idx" ON "beat_packs"("access_type");

-- CreateIndex
CREATE INDEX "beat_packs_created_at_idx" ON "beat_packs"("created_at");

-- CreateIndex
CREATE INDEX "beat_pack_beats_pack_id_idx" ON "beat_pack_beats"("pack_id");

-- CreateIndex
CREATE UNIQUE INDEX "beat_pack_beats_pack_id_beat_id_key" ON "beat_pack_beats"("pack_id", "beat_id");

-- CreateIndex
CREATE INDEX "resources_user_id_idx" ON "resources"("user_id");

-- CreateIndex
CREATE INDEX "resources_resourceType_idx" ON "resources"("resourceType");

-- CreateIndex
CREATE INDEX "resources_access_type_idx" ON "resources"("access_type");

-- CreateIndex
CREATE INDEX "resources_created_at_idx" ON "resources"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_legacy_token_key" ON "sessions_legacy"("token");

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_original_media_id_fkey" FOREIGN KEY ("original_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_variants" ADD CONSTRAINT "video_variants_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albums" ADD CONSTRAINT "albums_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_ratings" ADD CONSTRAINT "media_ratings_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_ratings" ADD CONSTRAINT "media_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_history" ADD CONSTRAINT "watch_history_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_history" ADD CONSTRAINT "watch_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_for_later" ADD CONSTRAINT "saved_for_later_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_for_later" ADD CONSTRAINT "saved_for_later_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_categories" ADD CONSTRAINT "media_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_categories" ADD CONSTRAINT "media_categories_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_comments" ADD CONSTRAINT "media_comments_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_comments" ADD CONSTRAINT "media_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "media_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_comments" ADD CONSTRAINT "media_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_interactions" ADD CONSTRAINT "media_interactions_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_interactions" ADD CONSTRAINT "media_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_entries" ADD CONSTRAINT "playlist_entries_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_entries" ADD CONSTRAINT "playlist_entries_playlist_id_fkey" FOREIGN KEY ("playlist_id") REFERENCES "playlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "now_playing" ADD CONSTRAINT "now_playing_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "now_playing" ADD CONSTRAINT "now_playing_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_recommendations" ADD CONSTRAINT "user_recommendations_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_recommendations" ADD CONSTRAINT "user_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers" ADD CONSTRAINT "followers_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers" ADD CONSTRAINT "followers_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "downloads" ADD CONSTRAINT "downloads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_reseller_link_id_fkey" FOREIGN KEY ("reseller_link_id") REFERENCES "reseller_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_payout_transaction_id_fkey" FOREIGN KEY ("payout_transaction_id") REFERENCES "payout_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_reseller_id_fkey" FOREIGN KEY ("reseller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reseller_links" ADD CONSTRAINT "reseller_links_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reseller_links" ADD CONSTRAINT "reseller_links_reseller_id_fkey" FOREIGN KEY ("reseller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "libraries" ADD CONSTRAINT "libraries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_library_id_fkey" FOREIGN KEY ("library_id") REFERENCES "libraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_licenses" ADD CONSTRAINT "device_licenses_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "user_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_licenses" ADD CONSTRAINT "device_licenses_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_licenses" ADD CONSTRAINT "device_licenses_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_licenses" ADD CONSTRAINT "device_licenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_accounts" ADD CONSTRAINT "payment_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_transactions" ADD CONSTRAINT "payout_transactions_payment_account_id_fkey" FOREIGN KEY ("payment_account_id") REFERENCES "payment_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_transactions" ADD CONSTRAINT "payout_transactions_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_payment_account_id_fkey" FOREIGN KEY ("payment_account_id") REFERENCES "payment_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queued_payouts" ADD CONSTRAINT "queued_payouts_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queued_payouts" ADD CONSTRAINT "queued_payouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_likes" ADD CONSTRAINT "news_likes_news_id_fkey" FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_likes" ADD CONSTRAINT "news_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_shares" ADD CONSTRAINT "news_shares_news_id_fkey" FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_shares" ADD CONSTRAINT "news_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_comments" ADD CONSTRAINT "news_comments_news_id_fkey" FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_comments" ADD CONSTRAINT "news_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_bookmarks" ADD CONSTRAINT "news_bookmarks_news_id_fkey" FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_bookmarks" ADD CONSTRAINT "news_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_views" ADD CONSTRAINT "news_views_news_id_fkey" FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_views" ADD CONSTRAINT "news_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_reports" ADD CONSTRAINT "news_reports_news_id_fkey" FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_reports" ADD CONSTRAINT "news_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_reactions" ADD CONSTRAINT "news_reactions_news_id_fkey" FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_reactions" ADD CONSTRAINT "news_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_moderations" ADD CONSTRAINT "content_moderations_content_creator_id_fkey" FOREIGN KEY ("content_creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_moderations" ADD CONSTRAINT "content_moderations_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_moderations" ADD CONSTRAINT "content_moderations_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "float_transactions" ADD CONSTRAINT "float_transactions_float_account_id_fkey" FOREIGN KEY ("float_account_id") REFERENCES "float_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_streams" ADD CONSTRAINT "live_streams_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_stream_sessions" ADD CONSTRAINT "live_stream_sessions_live_stream_id_fkey" FOREIGN KEY ("live_stream_id") REFERENCES "live_streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_stream_sessions" ADD CONSTRAINT "live_stream_sessions_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_stream_viewers" ADD CONSTRAINT "live_stream_viewers_live_stream_id_fkey" FOREIGN KEY ("live_stream_id") REFERENCES "live_streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_stream_viewers" ADD CONSTRAINT "live_stream_viewers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producer_collaborations" ADD CONSTRAINT "producer_collaborations_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producer_collaborations" ADD CONSTRAINT "producer_collaborations_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producer_collaborations" ADD CONSTRAINT "producer_collaborations_producer_id_fkey" FOREIGN KEY ("producer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beat_packs" ADD CONSTRAINT "beat_packs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beat_pack_beats" ADD CONSTRAINT "beat_pack_beats_pack_id_fkey" FOREIGN KEY ("pack_id") REFERENCES "beat_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beat_pack_beats" ADD CONSTRAINT "beat_pack_beats_beat_id_fkey" FOREIGN KEY ("beat_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

