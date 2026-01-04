--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP INDEX IF EXISTS public.verifications_user_id_method_key;
DROP INDEX IF EXISTS public.verifications_token_expires_at_idx;
DROP INDEX IF EXISTS public.users_username_key;
DROP INDEX IF EXISTS public.users_username_idx;
DROP INDEX IF EXISTS public.users_reseller_code_key;
DROP INDEX IF EXISTS public.users_reseller_code_idx;
DROP INDEX IF EXISTS public.users_is_reseller_idx;
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public.users_email_idx;
DROP INDEX IF EXISTS public.user_devices_user_id_device_id_key;
DROP INDEX IF EXISTS public.user_devices_fingerprint_key;
DROP INDEX IF EXISTS public.transactions_user_id_status_idx;
DROP INDEX IF EXISTS public.transactions_reseller_link_id_idx;
DROP INDEX IF EXISTS public.transactions_reference_key;
DROP INDEX IF EXISTS public.transactions_payment_provider_provider_reference_idx;
DROP INDEX IF EXISTS public.system_settings_key_key;
DROP INDEX IF EXISTS public.sessions_token_key;
DROP INDEX IF EXISTS public.reseller_links_reseller_id_media_id_key;
DROP INDEX IF EXISTS public.reseller_links_code_key;
DROP INDEX IF EXISTS public.reseller_links_code_idx;
DROP INDEX IF EXISTS public.payout_transactions_reference_key;
DROP INDEX IF EXISTS public.payout_transactions_payment_account_id_status_idx;
DROP INDEX IF EXISTS public.payout_requests_user_id_status_idx;
DROP INDEX IF EXISTS public.payment_accounts_user_id_provider_account_number_key;
DROP INDEX IF EXISTS public.payment_accounts_user_id_is_default_idx;
DROP INDEX IF EXISTS public.now_playing_user_id_key;
DROP INDEX IF EXISTS public.news_slug_key;
DROP INDEX IF EXISTS public."news_reactions_newsId_userId_type_key";
DROP INDEX IF EXISTS public."news_likes_newsId_userId_key";
DROP INDEX IF EXISTS public."news_bookmarks_newsId_userId_key";
DROP INDEX IF EXISTS public.media_user_id_idx;
DROP INDEX IF EXISTS public.media_url_key;
DROP INDEX IF EXISTS public.media_interactions_media_id_user_id_key;
DROP INDEX IF EXISTS public.media_allow_reselling_idx;
DROP INDEX IF EXISTS public.media_access_type_idx;
DROP INDEX IF EXISTS public.library_items_library_id_media_id_key;
DROP INDEX IF EXISTS public.kyc_documents_user_id_status_idx;
DROP INDEX IF EXISTS public.kyc_documents_document_type_status_idx;
DROP INDEX IF EXISTS public.followers_follower_id_following_id_key;
DROP INDEX IF EXISTS public.downloads_license_key_key;
DROP INDEX IF EXISTS public.device_licenses_user_id_device_id_media_id_key;
DROP INDEX IF EXISTS public.device_licenses_license_key_key;
DROP INDEX IF EXISTS public.device_licenses_license_key_idx;
DROP INDEX IF EXISTS public.currency_exchanges_from_currency_to_currency_key;
DROP INDEX IF EXISTS public.commissions_transaction_id_idx;
DROP INDEX IF EXISTS public.commissions_reseller_id_status_idx;
DROP INDEX IF EXISTS public.categories_slug_key;
DROP INDEX IF EXISTS public.categories_name_key;
DROP INDEX IF EXISTS public.audit_logs_user_id_action_idx;
DROP INDEX IF EXISTS public.audit_logs_resource_resource_id_idx;
ALTER TABLE IF EXISTS ONLY public.verifications DROP CONSTRAINT IF EXISTS verifications_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.user_devices DROP CONSTRAINT IF EXISTS user_devices_pkey;
ALTER TABLE IF EXISTS ONLY public.transactions DROP CONSTRAINT IF EXISTS transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.system_settings DROP CONSTRAINT IF EXISTS system_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.reseller_links DROP CONSTRAINT IF EXISTS reseller_links_pkey;
ALTER TABLE IF EXISTS ONLY public.playlists DROP CONSTRAINT IF EXISTS playlists_pkey;
ALTER TABLE IF EXISTS ONLY public.playlist_entries DROP CONSTRAINT IF EXISTS playlist_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.payout_transactions DROP CONSTRAINT IF EXISTS payout_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.payout_requests DROP CONSTRAINT IF EXISTS payout_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.payment_accounts DROP CONSTRAINT IF EXISTS payment_accounts_pkey;
ALTER TABLE IF EXISTS ONLY public.now_playing DROP CONSTRAINT IF EXISTS now_playing_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.news_views DROP CONSTRAINT IF EXISTS news_views_pkey;
ALTER TABLE IF EXISTS ONLY public.news_shares DROP CONSTRAINT IF EXISTS news_shares_pkey;
ALTER TABLE IF EXISTS ONLY public.news_reports DROP CONSTRAINT IF EXISTS news_reports_pkey;
ALTER TABLE IF EXISTS ONLY public.news_reactions DROP CONSTRAINT IF EXISTS news_reactions_pkey;
ALTER TABLE IF EXISTS ONLY public.news DROP CONSTRAINT IF EXISTS news_pkey;
ALTER TABLE IF EXISTS ONLY public.news_likes DROP CONSTRAINT IF EXISTS news_likes_pkey;
ALTER TABLE IF EXISTS ONLY public.news_comments DROP CONSTRAINT IF EXISTS news_comments_pkey;
ALTER TABLE IF EXISTS ONLY public.news_bookmarks DROP CONSTRAINT IF EXISTS news_bookmarks_pkey;
ALTER TABLE IF EXISTS ONLY public.media DROP CONSTRAINT IF EXISTS media_pkey;
ALTER TABLE IF EXISTS ONLY public.media_interactions DROP CONSTRAINT IF EXISTS media_interactions_pkey;
ALTER TABLE IF EXISTS ONLY public.media_categories DROP CONSTRAINT IF EXISTS media_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.library_items DROP CONSTRAINT IF EXISTS library_items_pkey;
ALTER TABLE IF EXISTS ONLY public.libraries DROP CONSTRAINT IF EXISTS libraries_pkey;
ALTER TABLE IF EXISTS ONLY public.kyc_documents DROP CONSTRAINT IF EXISTS kyc_documents_pkey;
ALTER TABLE IF EXISTS ONLY public.followers DROP CONSTRAINT IF EXISTS followers_pkey;
ALTER TABLE IF EXISTS ONLY public.downloads DROP CONSTRAINT IF EXISTS downloads_pkey;
ALTER TABLE IF EXISTS ONLY public.device_licenses DROP CONSTRAINT IF EXISTS device_licenses_pkey;
ALTER TABLE IF EXISTS ONLY public.currency_exchanges DROP CONSTRAINT IF EXISTS currency_exchanges_pkey;
ALTER TABLE IF EXISTS ONLY public.commissions DROP CONSTRAINT IF EXISTS commissions_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS public.verifications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.user_devices ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.system_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sessions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.reseller_links ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.playlists ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.playlist_entries ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.payout_transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.payout_requests ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.payment_accounts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.now_playing ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notifications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.news_views ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.news_shares ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.news_reports ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.news_reactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.news_likes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.news_comments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.news_bookmarks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.news ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.media_interactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.media ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.library_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.libraries ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.kyc_documents ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.followers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.downloads ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.device_licenses ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.currency_exchanges ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.commissions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.categories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.verifications_id_seq;
DROP TABLE IF EXISTS public.verifications;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.user_devices_id_seq;
DROP TABLE IF EXISTS public.user_devices;
DROP SEQUENCE IF EXISTS public.transactions_id_seq;
DROP TABLE IF EXISTS public.transactions;
DROP SEQUENCE IF EXISTS public.system_settings_id_seq;
DROP TABLE IF EXISTS public.system_settings;
DROP SEQUENCE IF EXISTS public.sessions_id_seq;
DROP TABLE IF EXISTS public.sessions;
DROP SEQUENCE IF EXISTS public.reseller_links_id_seq;
DROP TABLE IF EXISTS public.reseller_links;
DROP SEQUENCE IF EXISTS public.playlists_id_seq;
DROP TABLE IF EXISTS public.playlists;
DROP SEQUENCE IF EXISTS public.playlist_entries_id_seq;
DROP TABLE IF EXISTS public.playlist_entries;
DROP SEQUENCE IF EXISTS public.payout_transactions_id_seq;
DROP TABLE IF EXISTS public.payout_transactions;
DROP SEQUENCE IF EXISTS public.payout_requests_id_seq;
DROP TABLE IF EXISTS public.payout_requests;
DROP SEQUENCE IF EXISTS public.payment_accounts_id_seq;
DROP TABLE IF EXISTS public.payment_accounts;
DROP SEQUENCE IF EXISTS public.now_playing_id_seq;
DROP TABLE IF EXISTS public.now_playing;
DROP SEQUENCE IF EXISTS public.notifications_id_seq;
DROP TABLE IF EXISTS public.notifications;
DROP SEQUENCE IF EXISTS public.news_views_id_seq;
DROP TABLE IF EXISTS public.news_views;
DROP SEQUENCE IF EXISTS public.news_shares_id_seq;
DROP TABLE IF EXISTS public.news_shares;
DROP SEQUENCE IF EXISTS public.news_reports_id_seq;
DROP TABLE IF EXISTS public.news_reports;
DROP SEQUENCE IF EXISTS public.news_reactions_id_seq;
DROP TABLE IF EXISTS public.news_reactions;
DROP SEQUENCE IF EXISTS public.news_likes_id_seq;
DROP TABLE IF EXISTS public.news_likes;
DROP SEQUENCE IF EXISTS public.news_id_seq;
DROP SEQUENCE IF EXISTS public.news_comments_id_seq;
DROP TABLE IF EXISTS public.news_comments;
DROP SEQUENCE IF EXISTS public.news_bookmarks_id_seq;
DROP TABLE IF EXISTS public.news_bookmarks;
DROP TABLE IF EXISTS public.news;
DROP SEQUENCE IF EXISTS public.media_interactions_id_seq;
DROP TABLE IF EXISTS public.media_interactions;
DROP SEQUENCE IF EXISTS public.media_id_seq;
DROP TABLE IF EXISTS public.media_categories;
DROP TABLE IF EXISTS public.media;
DROP SEQUENCE IF EXISTS public.library_items_id_seq;
DROP TABLE IF EXISTS public.library_items;
DROP SEQUENCE IF EXISTS public.libraries_id_seq;
DROP TABLE IF EXISTS public.libraries;
DROP SEQUENCE IF EXISTS public.kyc_documents_id_seq;
DROP TABLE IF EXISTS public.kyc_documents;
DROP SEQUENCE IF EXISTS public.followers_id_seq;
DROP TABLE IF EXISTS public.followers;
DROP SEQUENCE IF EXISTS public.downloads_id_seq;
DROP TABLE IF EXISTS public.downloads;
DROP SEQUENCE IF EXISTS public.device_licenses_id_seq;
DROP TABLE IF EXISTS public.device_licenses;
DROP SEQUENCE IF EXISTS public.currency_exchanges_id_seq;
DROP TABLE IF EXISTS public.currency_exchanges;
DROP SEQUENCE IF EXISTS public.commissions_id_seq;
DROP TABLE IF EXISTS public.commissions;
DROP SEQUENCE IF EXISTS public.categories_id_seq;
DROP TABLE IF EXISTS public.categories;
DROP SEQUENCE IF EXISTS public.audit_logs_id_seq;
DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TYPE IF EXISTS public."VerificationMethod";
DROP TYPE IF EXISTS public."UserStatus";
DROP TYPE IF EXISTS public."UserRole";
DROP TYPE IF EXISTS public."TransactionStatus";
DROP TYPE IF EXISTS public."ResellerLinkStatus";
DROP TYPE IF EXISTS public."PlaylistType";
DROP TYPE IF EXISTS public."PaymentProvider";
DROP TYPE IF EXISTS public."PaymentMethod";
DROP TYPE IF EXISTS public."MediaType";
DROP TYPE IF EXISTS public."MediaAccessType";
DROP TYPE IF EXISTS public."KYCStatus";
DROP TYPE IF EXISTS public."DownloadAccessType";
DROP TYPE IF EXISTS public."DocumentType";
DROP TYPE IF EXISTS public."DeviceRestrictionLevel";
DROP TYPE IF EXISTS public."Currency";
DROP TYPE IF EXISTS public."CommissionStatus";
--
-- Name: CommissionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CommissionStatus" AS ENUM (
    'PENDING',
    'PAID',
    'FAILED',
    'HOLD'
);


--
-- Name: Currency; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Currency" AS ENUM (
    'USD',
    'EUR',
    'GBP',
    'ZMW',
    'ZAR',
    'KES',
    'NGN',
    'GHS',
    'UGX',
    'TZS',
    'XOF',
    'XAF',
    'AUD',
    'CAD',
    'JPY',
    'CNY',
    'INR',
    'BRL',
    'MXN'
);


--
-- Name: DeviceRestrictionLevel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DeviceRestrictionLevel" AS ENUM (
    'NONE',
    'BASIC',
    'STRICT',
    'ENCRYPTED'
);


--
-- Name: DocumentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DocumentType" AS ENUM (
    'NATIONAL_ID',
    'PASSPORT',
    'DRIVERS_LICENSE',
    'BUSINESS_REGISTRATION',
    'TAX_CERTIFICATE',
    'UTILITY_BILL',
    'BANK_STATEMENT'
);


--
-- Name: DownloadAccessType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DownloadAccessType" AS ENUM (
    'OFFLINE',
    'ONLINE',
    'STREAMING'
);


--
-- Name: KYCStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."KYCStatus" AS ENUM (
    'NOT_SUBMITTED',
    'PENDING_REVIEW',
    'APPROVED',
    'REJECTED',
    'ADDITIONAL_INFO_NEEDED'
);


--
-- Name: MediaAccessType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MediaAccessType" AS ENUM (
    'FREE',
    'PREMIUM',
    'PAY_PER_VIEW'
);


--
-- Name: MediaType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MediaType" AS ENUM (
    'AUDIO',
    'VIDEO',
    'PODCAST',
    'LIVE_STREAM'
);


--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'MOBILE_MONEY',
    'BANK_TRANSFER',
    'CREDIT_CARD',
    'CRYPTO',
    'OTHER'
);


--
-- Name: PaymentProvider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentProvider" AS ENUM (
    'MTN_MONEY',
    'AIRTEL_MONEY',
    'STRIPE',
    'PAYPAL',
    'FLUTTERWAVE',
    'PAYSTACK',
    'MPESA',
    'BANK',
    'OTHER'
);


--
-- Name: PlaylistType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PlaylistType" AS ENUM (
    'SYSTEM',
    'USER',
    'SMART',
    'RADIO'
);


--
-- Name: ResellerLinkStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ResellerLinkStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED'
);


--
-- Name: TransactionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TransactionStatus" AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'REFUNDED',
    'PARTIALLY_REFUNDED'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'ARTIST',
    'ADMIN',
    'MODERATOR',
    'RESELLER'
);


--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserStatus" AS ENUM (
    'PENDING',
    'ACTIVE',
    'SUSPENDED',
    'VERIFIED',
    'REJECTED'
);


--
-- Name: VerificationMethod; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."VerificationMethod" AS ENUM (
    'EMAIL',
    'PHONE',
    'DOCUMENT',
    'BIOMETRIC'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer,
    action text NOT NULL,
    resource text,
    resource_id integer,
    old_values jsonb,
    new_values jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    slug text NOT NULL
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: commissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commissions (
    id integer NOT NULL,
    amount double precision NOT NULL,
    reseller_id integer NOT NULL,
    transaction_id integer NOT NULL,
    media_id integer NOT NULL,
    is_paid boolean DEFAULT false NOT NULL,
    paid_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    commission_rate double precision NOT NULL,
    currency public."Currency" DEFAULT 'USD'::public."Currency" NOT NULL,
    payout_transaction_id integer,
    status public."CommissionStatus" DEFAULT 'PENDING'::public."CommissionStatus" NOT NULL
);


--
-- Name: commissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.commissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: commissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.commissions_id_seq OWNED BY public.commissions.id;


--
-- Name: currency_exchanges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.currency_exchanges (
    id integer NOT NULL,
    from_currency public."Currency" NOT NULL,
    to_currency public."Currency" NOT NULL,
    rate double precision NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_updated timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: currency_exchanges_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.currency_exchanges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: currency_exchanges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.currency_exchanges_id_seq OWNED BY public.currency_exchanges.id;


--
-- Name: device_licenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_licenses (
    id integer NOT NULL,
    user_id integer NOT NULL,
    device_id integer NOT NULL,
    media_id integer NOT NULL,
    transaction_id integer,
    license_key text NOT NULL,
    restriction_level public."DeviceRestrictionLevel" DEFAULT 'STRICT'::public."DeviceRestrictionLevel" NOT NULL,
    expires_at timestamp(3) without time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: device_licenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.device_licenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: device_licenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.device_licenses_id_seq OWNED BY public.device_licenses.id;


--
-- Name: downloads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.downloads (
    id integer NOT NULL,
    media_id integer NOT NULL,
    user_id integer NOT NULL,
    device_id text,
    downloaded_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at timestamp(3) without time zone,
    access_type public."DownloadAccessType" DEFAULT 'OFFLINE'::public."DownloadAccessType" NOT NULL,
    is_drm_protected boolean DEFAULT false NOT NULL,
    license_key text,
    extra_data jsonb
);


--
-- Name: downloads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.downloads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: downloads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.downloads_id_seq OWNED BY public.downloads.id;


--
-- Name: followers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.followers (
    id integer NOT NULL,
    follower_id integer NOT NULL,
    following_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: followers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.followers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: followers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.followers_id_seq OWNED BY public.followers.id;


--
-- Name: kyc_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kyc_documents (
    id integer NOT NULL,
    user_id integer NOT NULL,
    document_type public."DocumentType" NOT NULL,
    document_number text,
    front_image_url text NOT NULL,
    back_image_url text,
    selfie_image_url text,
    status public."KYCStatus" DEFAULT 'PENDING_REVIEW'::public."KYCStatus" NOT NULL,
    rejection_reason text,
    reviewed_by integer,
    reviewed_at timestamp(3) without time zone,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: kyc_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.kyc_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: kyc_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.kyc_documents_id_seq OWNED BY public.kyc_documents.id;


--
-- Name: libraries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.libraries (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name text NOT NULL,
    description text,
    is_private boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: libraries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.libraries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: libraries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.libraries_id_seq OWNED BY public.libraries.id;


--
-- Name: library_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.library_items (
    id integer NOT NULL,
    library_id integer NOT NULL,
    media_id integer NOT NULL,
    added_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    purchased_at timestamp(3) without time zone,
    transaction_id integer
);


--
-- Name: library_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.library_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: library_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.library_items_id_seq OWNED BY public.library_items.id;


--
-- Name: media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media (
    id integer NOT NULL,
    url text NOT NULL,
    art_cover_url text,
    thumbnail_url text,
    format text,
    duration integer,
    title text NOT NULL,
    description text,
    genre text,
    tags text[],
    type public."MediaType" NOT NULL,
    access_type public."MediaAccessType" DEFAULT 'FREE'::public."MediaAccessType" NOT NULL,
    price double precision DEFAULT 0,
    is_explicit boolean DEFAULT false NOT NULL,
    play_count integer DEFAULT 0 NOT NULL,
    download_count integer DEFAULT 0 NOT NULL,
    share_count integer DEFAULT 0 NOT NULL,
    last_played_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    user_id integer NOT NULL,
    cloudinary_public_id text,
    bpm integer,
    key text,
    energy double precision,
    danceability double precision,
    valence double precision,
    acousticness double precision,
    allow_reselling boolean DEFAULT true NOT NULL,
    artist_commission_rate double precision DEFAULT 0.5 NOT NULL,
    encryption_key text,
    is_drm_protected boolean DEFAULT false NOT NULL,
    max_devices integer DEFAULT 1 NOT NULL,
    platform_commission_rate double precision DEFAULT 0.3 NOT NULL,
    reseller_commission_rate double precision
);


--
-- Name: media_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_categories (
    media_id integer NOT NULL,
    category_id integer NOT NULL,
    assigned_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: media_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.media_id_seq OWNED BY public.media.id;


--
-- Name: media_interactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_interactions (
    id integer NOT NULL,
    media_id integer NOT NULL,
    user_id integer NOT NULL,
    liked boolean DEFAULT false,
    saved boolean DEFAULT false,
    played boolean DEFAULT false,
    "position" integer,
    interacted_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: media_interactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.media_interactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: media_interactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.media_interactions_id_seq OWNED BY public.media_interactions.id;


--
-- Name: news; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news (
    id integer NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    summary text,
    content text NOT NULL,
    "imageUrl" text,
    "authorId" integer,
    "publishedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isPublished" boolean DEFAULT true NOT NULL,
    tags text[],
    metadata jsonb
);


--
-- Name: news_bookmarks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news_bookmarks (
    id integer NOT NULL,
    "newsId" integer NOT NULL,
    "userId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: news_bookmarks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.news_bookmarks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: news_bookmarks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.news_bookmarks_id_seq OWNED BY public.news_bookmarks.id;


--
-- Name: news_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news_comments (
    id integer NOT NULL,
    "newsId" integer NOT NULL,
    "userId" integer NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: news_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.news_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: news_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.news_comments_id_seq OWNED BY public.news_comments.id;


--
-- Name: news_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.news_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: news_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.news_id_seq OWNED BY public.news.id;


--
-- Name: news_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news_likes (
    id integer NOT NULL,
    "newsId" integer NOT NULL,
    "userId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: news_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.news_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: news_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.news_likes_id_seq OWNED BY public.news_likes.id;


--
-- Name: news_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news_reactions (
    id integer NOT NULL,
    "newsId" integer NOT NULL,
    "userId" integer NOT NULL,
    type text NOT NULL,
    "reactedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: news_reactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.news_reactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: news_reactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.news_reactions_id_seq OWNED BY public.news_reactions.id;


--
-- Name: news_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news_reports (
    id integer NOT NULL,
    "newsId" integer NOT NULL,
    "userId" integer NOT NULL,
    reason text NOT NULL,
    details text,
    "reportedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: news_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.news_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: news_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.news_reports_id_seq OWNED BY public.news_reports.id;


--
-- Name: news_shares; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news_shares (
    id integer NOT NULL,
    "newsId" integer NOT NULL,
    "userId" integer NOT NULL,
    "sharedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: news_shares_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.news_shares_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: news_shares_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.news_shares_id_seq OWNED BY public.news_shares.id;


--
-- Name: news_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.news_views (
    id integer NOT NULL,
    "newsId" integer NOT NULL,
    "userId" integer,
    "viewedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ipAddress" text
);


--
-- Name: news_views_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.news_views_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: news_views_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.news_views_id_seq OWNED BY public.news_views.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    type text NOT NULL,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: now_playing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.now_playing (
    id integer NOT NULL,
    user_id integer NOT NULL,
    media_id integer NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    is_playing boolean DEFAULT false NOT NULL,
    device_id text,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: now_playing_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.now_playing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: now_playing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.now_playing_id_seq OWNED BY public.now_playing.id;


--
-- Name: payment_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_accounts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    provider public."PaymentProvider" NOT NULL,
    account_type public."PaymentMethod" NOT NULL,
    account_number text NOT NULL,
    account_name text,
    country text,
    currency public."Currency" DEFAULT 'USD'::public."Currency" NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: payment_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_accounts_id_seq OWNED BY public.payment_accounts.id;


--
-- Name: payout_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payout_requests (
    id integer NOT NULL,
    user_id integer NOT NULL,
    amount double precision NOT NULL,
    currency public."Currency" DEFAULT 'USD'::public."Currency" NOT NULL,
    status public."TransactionStatus" NOT NULL,
    payment_account_id integer,
    reason text,
    metadata jsonb,
    processed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: payout_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payout_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payout_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payout_requests_id_seq OWNED BY public.payout_requests.id;


--
-- Name: payout_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payout_transactions (
    id integer NOT NULL,
    payment_account_id integer NOT NULL,
    transaction_id integer,
    amount double precision NOT NULL,
    currency public."Currency" DEFAULT 'USD'::public."Currency" NOT NULL,
    status public."TransactionStatus" NOT NULL,
    reference text NOT NULL,
    provider_reference text,
    fees double precision DEFAULT 0 NOT NULL,
    metadata jsonb,
    processed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: payout_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payout_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payout_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payout_transactions_id_seq OWNED BY public.payout_transactions.id;


--
-- Name: playlist_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.playlist_entries (
    id integer NOT NULL,
    playlist_id integer NOT NULL,
    media_id integer NOT NULL,
    "position" integer NOT NULL,
    added_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    added_by integer
);


--
-- Name: playlist_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.playlist_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: playlist_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.playlist_entries_id_seq OWNED BY public.playlist_entries.id;


--
-- Name: playlists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.playlists (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    cover_url text,
    is_public boolean DEFAULT false NOT NULL,
    type public."PlaylistType" NOT NULL,
    rules jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    user_id integer NOT NULL
);


--
-- Name: playlists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.playlists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: playlists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.playlists_id_seq OWNED BY public.playlists.id;


--
-- Name: reseller_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reseller_links (
    id integer NOT NULL,
    code text NOT NULL,
    reseller_id integer NOT NULL,
    media_id integer NOT NULL,
    click_count integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    conversion_count integer DEFAULT 0 NOT NULL,
    custom_commission_rate double precision,
    expires_at timestamp(3) without time zone,
    status public."ResellerLinkStatus" DEFAULT 'ACTIVE'::public."ResellerLinkStatus" NOT NULL
);


--
-- Name: reseller_links_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reseller_links_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reseller_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reseller_links_id_seq OWNED BY public.reseller_links.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token text NOT NULL,
    ip_address text,
    user_agent text,
    expires_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    description text,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    amount double precision NOT NULL,
    status public."TransactionStatus" NOT NULL,
    user_id integer NOT NULL,
    media_id integer,
    reference text NOT NULL,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    currency public."Currency" DEFAULT 'USD'::public."Currency" NOT NULL,
    exchange_rate double precision,
    is_reseller_sale boolean DEFAULT false NOT NULL,
    original_amount double precision,
    original_currency public."Currency",
    payment_method public."PaymentMethod" NOT NULL,
    payment_provider public."PaymentProvider" NOT NULL,
    provider_reference text,
    reseller_link_id integer
);


--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: user_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_devices (
    id integer NOT NULL,
    user_id integer NOT NULL,
    device_id text NOT NULL,
    device_name text NOT NULL,
    last_active_at timestamp(3) without time zone,
    device_type text,
    fingerprint text,
    os text
);


--
-- Name: user_devices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_devices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_devices_id_seq OWNED BY public.user_devices.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    display_name text,
    avatar_url text,
    is_social_auth boolean DEFAULT false NOT NULL,
    provider text,
    social_id text,
    last_login_at timestamp(3) without time zone,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    is_premium boolean DEFAULT false NOT NULL,
    premium_until timestamp(3) without time zone,
    wallet_balance double precision DEFAULT 0 NOT NULL,
    total_earnings double precision DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    commission_rate double precision DEFAULT 0.2,
    country text DEFAULT 'US'::text,
    "defaultCurrency" public."Currency" DEFAULT 'USD'::public."Currency" NOT NULL,
    is_reseller boolean DEFAULT false NOT NULL,
    paid_commission double precision DEFAULT 0 NOT NULL,
    reseller_code text,
    total_commission double precision DEFAULT 0 NOT NULL,
    accepted_privacy boolean DEFAULT false NOT NULL,
    accepted_terms boolean DEFAULT false NOT NULL,
    address jsonb,
    artist_name text,
    bio text,
    business_name text,
    business_type text,
    consent_date timestamp(3) without time zone,
    data_sharing boolean DEFAULT false NOT NULL,
    date_of_birth timestamp(3) without time zone,
    is_email_verified boolean DEFAULT false NOT NULL,
    is_phone_verified boolean DEFAULT false NOT NULL,
    marketing_emails boolean DEFAULT false NOT NULL,
    phone_number text,
    social_links jsonb,
    stage_name text,
    status public."UserStatus" DEFAULT 'PENDING'::public."UserStatus" NOT NULL,
    tax_id text,
    tax_number text,
    website text
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    method public."VerificationMethod" NOT NULL,
    code text,
    token text,
    is_verified boolean DEFAULT false NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    verified_at timestamp(3) without time zone,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: verifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.verifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: verifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.verifications_id_seq OWNED BY public.verifications.id;


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: commissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions ALTER COLUMN id SET DEFAULT nextval('public.commissions_id_seq'::regclass);


--
-- Name: currency_exchanges id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currency_exchanges ALTER COLUMN id SET DEFAULT nextval('public.currency_exchanges_id_seq'::regclass);


--
-- Name: device_licenses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_licenses ALTER COLUMN id SET DEFAULT nextval('public.device_licenses_id_seq'::regclass);


--
-- Name: downloads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.downloads ALTER COLUMN id SET DEFAULT nextval('public.downloads_id_seq'::regclass);


--
-- Name: followers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.followers ALTER COLUMN id SET DEFAULT nextval('public.followers_id_seq'::regclass);


--
-- Name: kyc_documents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kyc_documents ALTER COLUMN id SET DEFAULT nextval('public.kyc_documents_id_seq'::regclass);


--
-- Name: libraries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.libraries ALTER COLUMN id SET DEFAULT nextval('public.libraries_id_seq'::regclass);


--
-- Name: library_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.library_items ALTER COLUMN id SET DEFAULT nextval('public.library_items_id_seq'::regclass);


--
-- Name: media id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media ALTER COLUMN id SET DEFAULT nextval('public.media_id_seq'::regclass);


--
-- Name: media_interactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_interactions ALTER COLUMN id SET DEFAULT nextval('public.media_interactions_id_seq'::regclass);


--
-- Name: news id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news ALTER COLUMN id SET DEFAULT nextval('public.news_id_seq'::regclass);


--
-- Name: news_bookmarks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_bookmarks ALTER COLUMN id SET DEFAULT nextval('public.news_bookmarks_id_seq'::regclass);


--
-- Name: news_comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_comments ALTER COLUMN id SET DEFAULT nextval('public.news_comments_id_seq'::regclass);


--
-- Name: news_likes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_likes ALTER COLUMN id SET DEFAULT nextval('public.news_likes_id_seq'::regclass);


--
-- Name: news_reactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_reactions ALTER COLUMN id SET DEFAULT nextval('public.news_reactions_id_seq'::regclass);


--
-- Name: news_reports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_reports ALTER COLUMN id SET DEFAULT nextval('public.news_reports_id_seq'::regclass);


--
-- Name: news_shares id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_shares ALTER COLUMN id SET DEFAULT nextval('public.news_shares_id_seq'::regclass);


--
-- Name: news_views id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_views ALTER COLUMN id SET DEFAULT nextval('public.news_views_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: now_playing id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.now_playing ALTER COLUMN id SET DEFAULT nextval('public.now_playing_id_seq'::regclass);


--
-- Name: payment_accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_accounts ALTER COLUMN id SET DEFAULT nextval('public.payment_accounts_id_seq'::regclass);


--
-- Name: payout_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout_requests ALTER COLUMN id SET DEFAULT nextval('public.payout_requests_id_seq'::regclass);


--
-- Name: payout_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout_transactions ALTER COLUMN id SET DEFAULT nextval('public.payout_transactions_id_seq'::regclass);


--
-- Name: playlist_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlist_entries ALTER COLUMN id SET DEFAULT nextval('public.playlist_entries_id_seq'::regclass);


--
-- Name: playlists id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlists ALTER COLUMN id SET DEFAULT nextval('public.playlists_id_seq'::regclass);


--
-- Name: reseller_links id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_links ALTER COLUMN id SET DEFAULT nextval('public.reseller_links_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: user_devices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_devices ALTER COLUMN id SET DEFAULT nextval('public.user_devices_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: verifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verifications ALTER COLUMN id SET DEFAULT nextval('public.verifications_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
ce8a4f62-63e3-4630-9aae-c771fcc90d88	7c433c5b019261ebf7c2e80f2b644c9c5ac8f81315afe39e156fa641eb794f28	2025-05-24 01:45:41.712055+02	20250523234539_init	\N	\N	2025-05-24 01:45:41.188366+02	1
814dad66-0bd3-40d1-80ef-422d080a1fb8	fddf3789cdc3ee6217ec2f909202da0ecfd354983d5615f513d4ff9176fa48b3	2025-10-05 15:58:58.953876+02	20251005135857_fix_relations	\N	\N	2025-10-05 15:58:57.514558+02	1
3ee51bcb-7a25-4fa1-aefc-b1018d3d87d0	99e970dd57e4c1a7752e12d50c82cb00f7a2f9762d8ecfcb32941ddade47b499	2025-10-05 19:55:50.384827+02	20251005175545_add_extra_data_to_download	\N	\N	2025-10-05 19:55:47.903016+02	1
8b7dd0d7-4381-4879-832d-e56053add68c	b1878db1a7101b6d7c783c62456aa45d253e948e4fe1453e3d90df2efa92c98a	2025-10-10 12:49:25.835709+02	20251010104925_add_kyc_and_verification	\N	\N	2025-10-10 12:49:25.35787+02	1
834ff7ce-9c3e-4e36-a54b-1a15955a26f9	f44ea19cbfb9cfa0269398e4c704de25601510d56a921973a6f97b8e99c95796	2025-10-13 18:07:23.716874+02	20251013160722_news_added	\N	\N	2025-10-13 18:07:22.058822+02	1
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, user_id, action, resource, resource_id, old_values, new_values, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, description, slug) FROM stdin;
6	Pop	Pop Music	pop
9	Hip-Hop	Hip-Hop & Rap	hiphop
4	Fwaya	Fwaya Music	fwaya
1	Zed	Zambian Music	zed
10	Afrobeat	Afrobeat vibes	afrobeat
11	Gospel	Gospel Music	
\.


--
-- Data for Name: commissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.commissions (id, amount, reseller_id, transaction_id, media_id, is_paid, paid_at, created_at, commission_rate, currency, payout_transaction_id, status) FROM stdin;
\.


--
-- Data for Name: currency_exchanges; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.currency_exchanges (id, from_currency, to_currency, rate, is_active, last_updated) FROM stdin;
\.


--
-- Data for Name: device_licenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.device_licenses (id, user_id, device_id, media_id, transaction_id, license_key, restriction_level, expires_at, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: downloads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.downloads (id, media_id, user_id, device_id, downloaded_at, expires_at, access_type, is_drm_protected, license_key, extra_data) FROM stdin;
\.


--
-- Data for Name: followers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.followers (id, follower_id, following_id, created_at) FROM stdin;
1	3	1	2025-08-17 19:51:28.746
2	3	6	2025-08-17 19:52:04.704
\.


--
-- Data for Name: kyc_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.kyc_documents (id, user_id, document_type, document_number, front_image_url, back_image_url, selfie_image_url, status, rejection_reason, reviewed_by, reviewed_at, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: libraries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.libraries (id, user_id, name, description, is_private, created_at, updated_at) FROM stdin;
2	6	Next Library	test	t	2025-08-09 22:34:49.716	2025-08-17 19:58:29.126
3	6	My New Library	test	t	2025-08-17 19:58:13.301	2025-08-17 19:58:29.126
1	1	Hello Library	test	t	2025-08-09 22:33:42.8	2025-08-17 20:00:35.919
\.


--
-- Data for Name: library_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.library_items (id, library_id, media_id, added_at, purchased_at, transaction_id) FROM stdin;
1	1	1	2025-08-09 22:34:15.724	\N	\N
2	2	2	2025-08-09 22:35:11.054	\N	\N
3	3	2	2025-08-17 19:59:11.575	\N	\N
4	2	4	2025-08-17 19:59:27.091	\N	\N
5	2	5	2025-08-17 19:59:40.48	\N	\N
6	1	2	2025-08-17 20:00:10.955	\N	\N
\.


--
-- Data for Name: media; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.media (id, url, art_cover_url, thumbnail_url, format, duration, title, description, genre, tags, type, access_type, price, is_explicit, play_count, download_count, share_count, last_played_at, created_at, updated_at, user_id, cloudinary_public_id, bpm, key, energy, danceability, valence, acousticness, allow_reselling, artist_commission_rate, encryption_key, is_drm_protected, max_devices, platform_commission_rate, reseller_commission_rate) FROM stdin;
2	https://res.cloudinary.com/dayn5vifn/video/upload/v1744675902/w6xdp90biwe6ppa3fz4m.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	210	Ancient Word	test	Gospel	{pop}	AUDIO	PREMIUM	5	t	0	0	0	\N	2025-08-09 22:32:00.232	2025-08-24 15:47:12.021	3	w6xdp90biwe6ppa3fz4m	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
1	https://res.cloudinary.com/dayn5vifn/video/upload/v1744677886/mhtbhebpvuftr7stjl4l.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	340	Draw Me Close	test	beat	{pop}	AUDIO	FREE	0	f	0	0	0	\N	2025-08-09 22:23:33.957	2025-10-16 17:26:07.512	8	mhtbhebpvuftr7stjl4l	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
3	https://res.cloudinary.com/dayn5vifn/video/upload/v1744550558/lmftsyn4iks8bysd9o7p.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	230	Lift Up Your Eyes ft Fwaya	test	Pop	{pop}	AUDIO	FREE	0	f	0	0	0	\N	2025-08-09 23:14:10.853	2025-08-24 19:51:54.954	4	lmftsyn4iks8bysd9o7p	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
7	https://res.cloudinary.com/dayn5vifn/video/upload/v1756050717/KirkF-_Imagi_01_kt41af.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	150	Imagine Me	Latest	Gospel	{gospel}	AUDIO	PREMIUM	10	f	0	0	0	\N	2025-08-24 15:52:34.67	2025-10-16 17:29:41.367	2	KirkF-_Imagi_01_kt41af	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
8	https://res.cloudinary.com/dayn5vifn/video/upload/v1744471001/htezcgfwlrlhzqgf0cjq.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	200	Love You Forever	The Jam	Gospel	{pop}	AUDIO	FREE	0	f	0	0	0	\N	2025-08-24 19:46:09.312	2025-08-24 19:40:53.021	4	htezcgfwlrlhzqgf0cjq	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
12	https://res.cloudinary.com/dayn5vifn/video/upload/v1758132184/20_Don_Williams_-_Love_Me_Over_Again_s1xpcs.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	200	Someone Like You	From Adel	Gospel	{gospel}	AUDIO	FREE	0	f	0	0	0	\N	2025-09-17 18:05:15.615	2025-09-17 17:41:46.045	5	Adele_-_Someone_Like_You_peljvv	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
15	https://res.cloudinary.com/dayn5vifn/video/upload/v1758132152/04_For_A_Moment_mr12pt.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	190	For A Moment	From Brook Hogan	pop	{pop}	AUDIO	FREE	0	f	0	0	0	\N	2025-09-17 18:12:03.431	2025-09-17 18:10:18.602	6	04_For_A_Moment_mr12pt	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
17	https://res.cloudinary.com/dayn5vifn/video/upload/v1758132199/13_Mariah_Carey_-_Bye_Bye_nrhl0p.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	190	Bye Bye	From Carey	\N	{}	AUDIO	FREE	0	f	0	0	0	\N	2025-09-17 18:16:25.351	2025-09-17 18:14:52.912	4	13_Mariah_Carey_-_Bye_Bye_nrhl0p	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
14	https://res.cloudinary.com/dayn5vifn/video/upload/v1758132153/14_Don_Williams_-_I_m_Just_A_Country_Boy_jhu6bx.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	210	I'm Just A Country Boy	From Don Williams	country	{country}	AUDIO	FREE	0	f	0	0	0	\N	2025-09-17 18:10:11.664	2025-09-17 18:20:46.672	7	14_Don_Williams_-_I_m_Just_A_Country_Boy_jhu6bx	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
5	https://res.cloudinary.com/dayn5vifn/video/upload/v1755458015/005_-_Mario_-_How_Do_I_Breathe_jbt2di.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	200	How Do I Breath	test	beat	{pop}	AUDIO	FREE	0	f	0	0	0	\N	2025-08-17 19:24:43.03	2025-10-16 17:26:17.864	6	005_-_Mario_-_How_Do_I_Breathe_jbt2di	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
4	https://res.cloudinary.com/dayn5vifn/video/upload/v1743857702/samples/sea-turtle.mp4	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp4	113	Vibes Video	test	Pop	{pop}	VIDEO	PREMIUM	5	f	0	0	0	\N	2025-08-09 23:17:10.487	2025-10-16 17:31:35.123	3	samples/sea-turtle	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
13	https://res.cloudinary.com/dayn5vifn/video/upload/v1758132142/08_Don_Williams_-_You_re_My_Best_Friend_fxivdm.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	250	You're My Bestfriend	From Don Williams	slow	{slow}	AUDIO	PAY_PER_VIEW	2	f	0	0	0	\N	2025-09-17 18:07:50.959	2025-10-16 17:29:41.367	2	08_Don_Williams_-_You_re_My_Best_Friend_fxivdm	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
16	https://res.cloudinary.com/dayn5vifn/video/upload/v1758132177/04.Ne-Yo-Mad_iM1_-_Copy_gwcqml.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	100	Mad	From Ne-yo	pop	{pop}	AUDIO	PREMIUM	40	f	0	0	0	\N	2025-09-17 18:14:31.754	2025-10-16 17:29:41.367	5	04.Ne-Yo-Mad_iM1_-_Copy_gwcqml	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
18	https://res.cloudinary.com/dayn5vifn/video/upload/v1758132163/19_Don_Williams_-_It_Must_Be_Love_jwjwdb.mp3	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050228/featured_1-01_s0uhju_c_fill_w_100_h_100_wa8qfy.jpg	mp3	160	It's Must Be Love	From Don Williams	country	{country}	AUDIO	PREMIUM	20	f	0	0	0	\N	2025-09-17 18:19:31.372	2025-10-16 17:29:41.367	3	19_Don_Williams_-_It_Must_Be_Love_jwjwdb	\N	\N	\N	\N	\N	\N	t	0.5	\N	f	1	0.3	\N
\.


--
-- Data for Name: media_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.media_categories (media_id, category_id, assigned_at) FROM stdin;
1	1	2025-08-09 22:38:11.715
2	1	2025-08-17 19:40:31.036
5	6	2025-08-17 19:40:55.292
5	10	2025-08-17 19:41:55.275
5	9	2025-08-17 19:42:26.386
1	11	2025-08-17 19:42:52.089
\.


--
-- Data for Name: media_interactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.media_interactions (id, media_id, user_id, liked, saved, played, "position", interacted_at) FROM stdin;
\.


--
-- Data for Name: news; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news (id, title, slug, summary, content, "imageUrl", "authorId", "publishedAt", "updatedAt", "isPublished", tags, metadata) FROM stdin;
1	Fwaya Platform Launch	Na Mumfwa ka	Fwaya Innovations online music streaming platform expected to launch...	Content coming soon as you see it kkkkkkkk	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	1	2025-10-16 16:51:48.597	2025-10-16 16:54:42.742	t	{}	null
2	Fwaya Music	Music by Fwaya	Fwaya..........	Content coming soon as you see it kkkkkkkk	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	1	2025-10-16 17:19:02.531	2025-10-16 17:17:54.416	t	{}	null
6	These are test news items	Wait and see	Fwaya Innovations online music streaming platform expected to launch...	Content coming soon as you see it kkkkkkkk	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	2	2025-10-16 17:22:02.293	2025-10-16 17:20:58.345	t	{}	null
7	Now We are close	Its a good feeling	Fwaya Innovations online music streaming platform expected to launch...	Content coming soon as you see it kkkkkkkk	https://res.cloudinary.com/dayn5vifn/image/upload/v1756050229/featured_1-01_s0uhju_c_fill_w_200_h_200_crqacq.jpg	3	2025-10-16 17:22:59.944	2025-10-16 17:22:06.305	t	{}	null
\.


--
-- Data for Name: news_bookmarks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news_bookmarks (id, "newsId", "userId", "createdAt") FROM stdin;
\.


--
-- Data for Name: news_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news_comments (id, "newsId", "userId", content, "createdAt") FROM stdin;
\.


--
-- Data for Name: news_likes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news_likes (id, "newsId", "userId", "createdAt") FROM stdin;
\.


--
-- Data for Name: news_reactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news_reactions (id, "newsId", "userId", type, "reactedAt") FROM stdin;
\.


--
-- Data for Name: news_reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news_reports (id, "newsId", "userId", reason, details, "reportedAt") FROM stdin;
\.


--
-- Data for Name: news_shares; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news_shares (id, "newsId", "userId", "sharedAt") FROM stdin;
\.


--
-- Data for Name: news_views; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.news_views (id, "newsId", "userId", "viewedAt", "ipAddress") FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, title, message, is_read, type, metadata, created_at) FROM stdin;
1	1	Admin	Welcome!	t	system	null	2025-08-17 19:56:19.644
\.


--
-- Data for Name: now_playing; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.now_playing (id, user_id, media_id, "position", is_playing, device_id, updated_at) FROM stdin;
\.


--
-- Data for Name: payment_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_accounts (id, user_id, provider, account_type, account_number, account_name, country, currency, is_verified, is_default, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payout_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payout_requests (id, user_id, amount, currency, status, payment_account_id, reason, metadata, processed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payout_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payout_transactions (id, payment_account_id, transaction_id, amount, currency, status, reference, provider_reference, fees, metadata, processed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: playlist_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.playlist_entries (id, playlist_id, media_id, "position", added_at, added_by) FROM stdin;
2	2	5	1	2025-08-17 19:46:52.54	\N
1	2	3	2	2025-08-17 19:46:05.234	\N
3	2	4	3	2025-08-17 19:47:13.37	\N
4	2	1	4	2025-08-17 19:47:40.17	\N
5	1	4	1	2025-08-17 19:47:58.242	\N
6	1	1	2	2025-08-17 19:48:17.673	\N
7	1	3	4	2025-08-17 19:48:36.976	\N
\.


--
-- Data for Name: playlists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.playlists (id, name, description, cover_url, is_public, type, rules, created_at, updated_at, user_id) FROM stdin;
1	Fwaya Playlist	Music for the soul	https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/playlist-01_f7f2kh_c_fill_w_400_h_400_hvpxjl.jpg	t	SYSTEM	null	2025-08-09 22:37:24.327	2025-08-24 12:58:22.96	7
2	Yes My Playlist	Neat	https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/playlist-01_f7f2kh_c_fill_w_400_h_400_hvpxjl.jpg	t	SYSTEM	null	2025-08-17 19:45:20.138	2025-10-16 16:43:57.85	7
\.


--
-- Data for Name: reseller_links; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reseller_links (id, code, reseller_id, media_id, click_count, created_at, conversion_count, custom_commission_rate, expires_at, status) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, user_id, token, ip_address, user_agent, expires_at, created_at) FROM stdin;
1	1	muwanatoken	\N	\N	1970-01-01 00:00:00	2025-08-17 20:04:35.07
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_settings (id, key, value, description, updated_at) FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transactions (id, amount, status, user_id, media_id, reference, metadata, created_at, updated_at, currency, exchange_rate, is_reseller_sale, original_amount, original_currency, payment_method, payment_provider, provider_reference, reseller_link_id) FROM stdin;
1	5	PENDING	1	2	TRX-1760034149274-v1kgdewo8	{"deviceInfo": {"os": "Win32", "deviceId": "web-browser", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "web-browser"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}	2025-10-09 18:22:29.276	2025-10-09 18:22:29.276	ZMW	\N	f	\N	\N	CREDIT_CARD	STRIPE	\N	\N
2	5	PENDING	1	2	TRX-1760034181241-8up4hzsjd	{"deviceInfo": {"os": "Win32", "deviceId": "web-browser", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "web-browser"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}	2025-10-09 18:23:01.243	2025-10-09 18:23:01.243	ZMW	\N	f	\N	\N	CREDIT_CARD	STRIPE	\N	\N
3	5	PENDING	1	2	TRX-1760034264227-jmr8yw3e6	{"deviceInfo": {"os": "Win32", "deviceId": "web-browser", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "web-browser"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}	2025-10-09 18:24:24.23	2025-10-09 18:24:24.23	ZMW	\N	f	\N	\N	CREDIT_CARD	STRIPE	\N	\N
4	5	PENDING	1	2	TRX-1760034291326-lsvuxanie	{"deviceInfo": {"os": "Win32", "deviceId": "web-browser", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "web-browser"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}	2025-10-09 18:24:51.328	2025-10-09 18:24:51.328	ZMW	\N	f	\N	\N	CREDIT_CARD	STRIPE	\N	\N
5	5	PENDING	1	2	TRX-1760034455438-pwyi9i0o5	{"deviceInfo": {"os": "Win32", "deviceId": "web-browser", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "web-browser"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}	2025-10-09 18:27:35.44	2025-10-09 18:27:35.44	ZMW	\N	f	\N	\N	CREDIT_CARD	STRIPE	\N	\N
6	5	PENDING	1	2	TRX-1760543150578-e08tbgois	{"deviceInfo": {"os": "Win32", "deviceId": "device-1760036186269-y88auh83y", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "device-1760036186269-y88auh83y"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}	2025-10-15 15:45:50.586	2025-10-15 15:45:50.586	ZMW	\N	f	\N	\N	MOBILE_MONEY	MTN_MONEY	\N	\N
7	5	PENDING	1	2	TRX-1760543243060-cg5yvycen	{"deviceInfo": {"os": "Win32", "deviceId": "device-1760036186269-y88auh83y", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "device-1760036186269-y88auh83y"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}	2025-10-15 15:47:23.062	2025-10-15 15:47:23.062	ZMW	\N	f	\N	\N	MOBILE_MONEY	MTN_MONEY	\N	\N
8	5	PENDING	1	2	TRX-1760544262696-0olkws5g8	{"deviceInfo": {"os": "Win32", "deviceId": "device-1760036186269-y88auh83y", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "device-1760036186269-y88auh83y"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}	2025-10-15 16:04:22.7	2025-10-15 16:04:22.7	ZMW	\N	f	\N	\N	MOBILE_MONEY	MTN_MONEY	\N	\N
9	5	PENDING	1	2	TRX-1760544298409-5ici93jfw	{"deviceInfo": {"os": "Win32", "deviceId": "device-1760036186269-y88auh83y", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "device-1760036186269-y88auh83y"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}	2025-10-15 16:04:58.413	2025-10-15 16:04:58.413	ZMW	\N	f	\N	\N	MOBILE_MONEY	MTN_MONEY	\N	\N
10	5	PENDING	1	2	TRX-1760557332912-sfjzqqg2p	{"deviceInfo": {"os": "Win32", "deviceId": "device-1760036186269-y88auh83y", "deviceName": "Web Browser", "deviceType": "desktop", "fingerprint": "device-1760036186269-y88auh83y"}, "calculatedAmounts": {"artistAmount": 2.5, "platformAmount": 2.5, "resellerAmount": 0}}	2025-10-15 19:42:12.917	2025-10-15 19:42:12.917	ZMW	\N	f	\N	\N	MOBILE_MONEY	MTN_MONEY	\N	\N
\.


--
-- Data for Name: user_devices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_devices (id, user_id, device_id, device_name, last_active_at, device_type, fingerprint, os) FROM stdin;
1	5	1	device-xyz	\N	\N	\N	\N
2	1	2	device-xyz	\N	\N	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, username, password_hash, display_name, avatar_url, is_social_auth, provider, social_id, last_login_at, role, is_premium, premium_until, wallet_balance, total_earnings, created_at, updated_at, commission_rate, country, "defaultCurrency", is_reseller, paid_commission, reseller_code, total_commission, accepted_privacy, accepted_terms, address, artist_name, bio, business_name, business_type, consent_date, data_sharing, date_of_birth, is_email_verified, is_phone_verified, marketing_emails, phone_number, social_links, stage_name, status, tax_id, tax_number, website) FROM stdin;
4	bmkmuwana	FwayaPremium	Bismark@2	FwayaP	https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg	f	\N	\N	\N	ARTIST	t	\N	0	0	2025-08-09 23:06:04.295	2025-10-16 16:34:13.454	0.2	Lusaka, Zambia	ZMW	f	0	\N	0	f	f	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	\N	\N	\N	PENDING	\N	\N	\N
5	bismax100@gmail.com	Bizzo	Kwibisa@2	BizzoPPV	https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg	f	\N	\N	\N	ARTIST	t	\N	0	0	2025-08-09 23:09:47.823	2025-10-16 16:34:13.454	0.2	Lusaka, Zambia	ZMW	f	0	\N	0	f	f	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	\N	\N	\N	PENDING	\N	\N	\N
6	angelkwibisa203@gmail.com	DonChainz	Angel2	DonChainz	https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg	t	\N	\N	\N	ARTIST	f	\N	0	0	2025-08-17 19:33:09.137	2025-10-16 16:34:13.454	0.2	Lusaka, Zambia	ZMW	f	0	\N	0	f	f	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	\N	\N	\N	PENDING	\N	\N	\N
7	angelkwibisa897@gmail.com	Don	AngelKwib11	Don	https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg	f	\N	\N	\N	ARTIST	t	\N	50	0	2025-08-17 19:35:47.546	2025-10-16 16:34:13.454	0.2	Lusaka, Zambia	ZMW	f	0	\N	0	f	f	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	\N	\N	\N	PENDING	\N	\N	\N
8	kwibisa.bymax@gmail.com	Betty	Betty22278D	BettyArt	https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg	t	\N	\N	\N	ARTIST	f	\N	0	0	2025-08-17 19:38:18.71	2025-10-16 16:34:13.454	0.2	Lusaka, Zambia	ZMW	f	0	\N	0	f	f	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	\N	\N	\N	PENDING	\N	\N	\N
1	kwibisa12@gmail.com	BymaxUser	kwibisa2	BymaxUser	https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg	f	\N	\N	\N	USER	f	\N	0	0	2025-06-10 16:54:56.848	2025-10-16 16:36:12.773	0.2	Lusaka, Zambia	ZMW	f	0	\N	0	f	f	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	\N	\N	\N	VERIFIED	\N	\N	\N
3	bymaxzm@gmail.com	BigBizzo	Kwibisa@2	BizzoArtist	https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg	t	\N	\N	\N	ARTIST	f	\N	0	0	2025-08-09 17:38:37.158	2025-10-16 16:36:39.26	0.2	Lusaka, Zambia	ZMW	f	0	\N	0	f	f	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	\N	\N	\N	ACTIVE	\N	\N	\N
2	kwibisa21@gmail.com	Admin	kwibisa2	Bymax	https://res.cloudinary.com/dayn5vifn/image/upload/v1756039821/artist-01_w5f2o5_c_fill_w_300_h_300_tvplqg.jpg	f	\N	\N	\N	ADMIN	f	\N	0	0	2025-06-10 16:56:44.318	2025-10-16 16:34:13.454	0.2	Lusaka, Zambia	ZMW	f	0	\N	0	f	f	\N	\N	\N	\N	\N	\N	f	\N	f	f	f	\N	\N	\N	PENDING	\N	\N	\N
\.


--
-- Data for Name: verifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.verifications (id, user_id, method, code, token, is_verified, expires_at, verified_at, metadata, created_at) FROM stdin;
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 11, true);


--
-- Name: commissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.commissions_id_seq', 1, false);


--
-- Name: currency_exchanges_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.currency_exchanges_id_seq', 1, false);


--
-- Name: device_licenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.device_licenses_id_seq', 1, false);


--
-- Name: downloads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.downloads_id_seq', 1, false);


--
-- Name: followers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.followers_id_seq', 2, true);


--
-- Name: kyc_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.kyc_documents_id_seq', 1, false);


--
-- Name: libraries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.libraries_id_seq', 3, true);


--
-- Name: library_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.library_items_id_seq', 6, true);


--
-- Name: media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.media_id_seq', 18, true);


--
-- Name: media_interactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.media_interactions_id_seq', 1, false);


--
-- Name: news_bookmarks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.news_bookmarks_id_seq', 1, false);


--
-- Name: news_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.news_comments_id_seq', 1, false);


--
-- Name: news_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.news_id_seq', 7, true);


--
-- Name: news_likes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.news_likes_id_seq', 1, false);


--
-- Name: news_reactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.news_reactions_id_seq', 1, false);


--
-- Name: news_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.news_reports_id_seq', 1, false);


--
-- Name: news_shares_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.news_shares_id_seq', 1, false);


--
-- Name: news_views_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.news_views_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, true);


--
-- Name: now_playing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.now_playing_id_seq', 1, false);


--
-- Name: payment_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payment_accounts_id_seq', 1, false);


--
-- Name: payout_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payout_requests_id_seq', 1, false);


--
-- Name: payout_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payout_transactions_id_seq', 1, false);


--
-- Name: playlist_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.playlist_entries_id_seq', 7, true);


--
-- Name: playlists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.playlists_id_seq', 2, true);


--
-- Name: reseller_links_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reseller_links_id_seq', 1, false);


--
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sessions_id_seq', 1, true);


--
-- Name: system_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_settings_id_seq', 1, false);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transactions_id_seq', 10, true);


--
-- Name: user_devices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_devices_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 8, true);


--
-- Name: verifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.verifications_id_seq', 1, false);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: commissions commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commissions
    ADD CONSTRAINT commissions_pkey PRIMARY KEY (id);


--
-- Name: currency_exchanges currency_exchanges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currency_exchanges
    ADD CONSTRAINT currency_exchanges_pkey PRIMARY KEY (id);


--
-- Name: device_licenses device_licenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_licenses
    ADD CONSTRAINT device_licenses_pkey PRIMARY KEY (id);


--
-- Name: downloads downloads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.downloads
    ADD CONSTRAINT downloads_pkey PRIMARY KEY (id);


--
-- Name: followers followers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_pkey PRIMARY KEY (id);


--
-- Name: kyc_documents kyc_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kyc_documents
    ADD CONSTRAINT kyc_documents_pkey PRIMARY KEY (id);


--
-- Name: libraries libraries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.libraries
    ADD CONSTRAINT libraries_pkey PRIMARY KEY (id);


--
-- Name: library_items library_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.library_items
    ADD CONSTRAINT library_items_pkey PRIMARY KEY (id);


--
-- Name: media_categories media_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_categories
    ADD CONSTRAINT media_categories_pkey PRIMARY KEY (media_id, category_id);


--
-- Name: media_interactions media_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_interactions
    ADD CONSTRAINT media_interactions_pkey PRIMARY KEY (id);


--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);


--
-- Name: news_bookmarks news_bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_bookmarks
    ADD CONSTRAINT news_bookmarks_pkey PRIMARY KEY (id);


--
-- Name: news_comments news_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_comments
    ADD CONSTRAINT news_comments_pkey PRIMARY KEY (id);


--
-- Name: news_likes news_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_likes
    ADD CONSTRAINT news_likes_pkey PRIMARY KEY (id);


--
-- Name: news news_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_pkey PRIMARY KEY (id);


--
-- Name: news_reactions news_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_reactions
    ADD CONSTRAINT news_reactions_pkey PRIMARY KEY (id);


--
-- Name: news_reports news_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_reports
    ADD CONSTRAINT news_reports_pkey PRIMARY KEY (id);


--
-- Name: news_shares news_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_shares
    ADD CONSTRAINT news_shares_pkey PRIMARY KEY (id);


--
-- Name: news_views news_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.news_views
    ADD CONSTRAINT news_views_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: now_playing now_playing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.now_playing
    ADD CONSTRAINT now_playing_pkey PRIMARY KEY (id);


--
-- Name: payment_accounts payment_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_accounts
    ADD CONSTRAINT payment_accounts_pkey PRIMARY KEY (id);


--
-- Name: payout_requests payout_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout_requests
    ADD CONSTRAINT payout_requests_pkey PRIMARY KEY (id);


--
-- Name: payout_transactions payout_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payout_transactions
    ADD CONSTRAINT payout_transactions_pkey PRIMARY KEY (id);


--
-- Name: playlist_entries playlist_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlist_entries
    ADD CONSTRAINT playlist_entries_pkey PRIMARY KEY (id);


--
-- Name: playlists playlists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlists
    ADD CONSTRAINT playlists_pkey PRIMARY KEY (id);


--
-- Name: reseller_links reseller_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_links
    ADD CONSTRAINT reseller_links_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: user_devices user_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verifications verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verifications
    ADD CONSTRAINT verifications_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_resource_resource_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_resource_resource_id_idx ON public.audit_logs USING btree (resource, resource_id);


--
-- Name: audit_logs_user_id_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_user_id_action_idx ON public.audit_logs USING btree (user_id, action);


--
-- Name: categories_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);


--
-- Name: categories_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX categories_slug_key ON public.categories USING btree (slug);


--
-- Name: commissions_reseller_id_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX commissions_reseller_id_status_idx ON public.commissions USING btree (reseller_id, status);


--
-- Name: commissions_transaction_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX commissions_transaction_id_idx ON public.commissions USING btree (transaction_id);


--
-- Name: currency_exchanges_from_currency_to_currency_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX currency_exchanges_from_currency_to_currency_key ON public.currency_exchanges USING btree (from_currency, to_currency);


--
-- Name: device_licenses_license_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX device_licenses_license_key_idx ON public.device_licenses USING btree (license_key);


--
-- Name: device_licenses_license_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX device_licenses_license_key_key ON public.device_licenses USING btree (license_key);


--
-- Name: device_licenses_user_id_device_id_media_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX device_licenses_user_id_device_id_media_id_key ON public.device_licenses USING btree (user_id, device_id, media_id);


--
-- Name: downloads_license_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX downloads_license_key_key ON public.downloads USING btree (license_key);


--
-- Name: followers_follower_id_following_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX followers_follower_id_following_id_key ON public.followers USING btree (follower_id, following_id);


--
-- Name: kyc_documents_document_type_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX kyc_documents_document_type_status_idx ON public.kyc_documents USING btree (document_type, status);


--
-- Name: kyc_documents_user_id_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX kyc_documents_user_id_status_idx ON public.kyc_documents USING btree (user_id, status);


--
-- Name: library_items_library_id_media_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX library_items_library_id_media_id_key ON public.library_items USING btree (library_id, media_id);


--
-- Name: media_access_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_access_type_idx ON public.media USING btree (access_type);


--
-- Name: media_allow_reselling_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_allow_reselling_idx ON public.media USING btree (allow_reselling);


--
-- Name: media_interactions_media_id_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX media_interactions_media_id_user_id_key ON public.media_interactions USING btree (media_id, user_id);


--
-- Name: media_url_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX media_url_key ON public.media USING btree (url);


--
-- Name: media_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_user_id_idx ON public.media USING btree (user_id);


--
-- Name: news_bookmarks_newsId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "news_bookmarks_newsId_userId_key" ON public.news_bookmarks USING btree ("newsId", "userId");


--
-- Name: news_likes_newsId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "news_likes_newsId_userId_key" ON public.news_likes USING btree ("newsId", "userId");


--
-- Name: news_reactions_newsId_userId_type_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "news_reactions_newsId_userId_type_key" ON public.news_reactions USING btree ("newsId", "userId", type);


--
-- Name: news_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX news_slug_key ON public.news USING btree (slug);


--
-- Name: now_playing_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX now_playing_user_id_key ON public.now_playing USING btree (user_id);


--
-- Name: payment_accounts_user_id_is_default_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payment_accounts_user_id_is_default_idx ON public.payment_accounts USING btree (user_id, is_default);


--
-- Name: payment_accounts_user_id_provider_account_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX payment_accounts_user_id_provider_account_number_key ON public.payment_accounts USING btree (user_id, provider, account_number);


--
-- Name: payout_requests_user_id_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payout_requests_user_id_status_idx ON public.payout_requests USING btree (user_id, status);


--
-- Name: payout_transactions_payment_account_id_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payout_transactions_payment_account_id_status_idx ON public.payout_transactions USING btree (payment_account_id, status);


--
-- Name: payout_transactions_reference_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX payout_transactions_reference_key ON public.payout_transactions USING btree (reference);


--
-- Name: reseller_links_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX reseller_links_code_idx ON public.reseller_links USING btree (code);


--
-- Name: reseller_links_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX reseller_links_code_key ON public.reseller_links USING btree (code);


--
-- Name: reseller_links_reseller_id_media_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX reseller_links_reseller_id_media_id_key ON public.reseller_links USING btree (reseller_id, media_id);


--
-- Name: sessions_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX sessions_token_key ON public.sessions USING btree (token);


--
-- Name: system_settings_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX system_settings_key_key ON public.system_settings USING btree (key);


--
-- Name: transactions_payment_provider_provider_reference_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_payment_provider_provider_reference_idx ON public.transactions USING btree (payment_provider, provider_reference);


--
-- Name: transactions_reference_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX transactions_reference_key ON public.transactions USING btree (reference);


--
-- Name: transactions_reseller_link_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_reseller_link_id_idx ON public.transactions USING btree (reseller_link_id);


--
-- Name: transactions_user_id_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX transactions_user_id_status_idx ON public.transactions USING btree (user_id, status);


--
-- Name: user_devices_fingerprint_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_devices_fingerprint_key ON public.user_devices USING btree (fingerprint);


--
-- Name: user_devices_user_id_device_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_devices_user_id_device_id_key ON public.user_devices USING btree (user_id, device_id);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_is_reseller_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_is_reseller_idx ON public.users USING btree (is_reseller);


--
-- Name: users_reseller_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_reseller_code_idx ON public.users USING btree (reseller_code);


--
-- Name: users_reseller_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_reseller_code_key ON public.users USING btree (reseller_code);


--
-- Name: users_username_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_username_idx ON public.users USING btree (username);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: verifications_token_expires_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX verifications_token_expires_at_idx ON public.verifications USING btree (token, expires_at);


--
-- Name: verifications_user_id_method_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX verifications_user_id_method_key ON public.verifications USING btree (user_id, method);


--
-- PostgreSQL database dump complete
--

