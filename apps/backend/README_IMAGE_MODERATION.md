Cloudinary Image Moderation & Transform Flow

Overview

This document explains the implemented Cloudinary-backed image moderation and transform pipeline used for cover images. It describes required environment variables, endpoints, and recommended operating steps.

What we implemented

- Server endpoint `POST /v1/media/upload-cover` (authenticated) to upload cover images.
  - Accepts an image file via multipart/form-data.
  - Validates mime-type and file-size (max 5MB).
  - Uploads to Cloudinary with eager transforms: 1200x630 JPG and 400x400 WEBP.
  - Creates a `Cover` DB record and returns available derivatives.
  - The system auto-publishes the cover (sets `moderationStatus = APPROVED`) unless Cloudinary explicitly returns a `rejected` status. This ensures an OG-ready derivative is available immediately for `og:image` use. If Cloudinary rejects the image later via webhook, the record will be marked `REJECTED`.

- Webhook endpoint `POST /v1/media/cloudinary-webhook` to receive moderation/async notifications from Cloudinary.
  - The webhook handler updates the `covers` DB record's `moderationStatus` and `moderationResponse` when Cloudinary posts back moderation results.

Required environment variables

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

DB changes

- A new `Cover` model was added to `prisma/schema.prisma`. Run Prisma migration and `prisma generate` before using these features.

Prisma migration steps

From `apps/backend`:

```bash
npm run prisma:migrate -- --name add_covers_table
npm run prisma:generate
```

Notes on Cloudinary configuration

- In Cloudinary dashboard, enable the moderation provider (e.g., AWS Rekognition, Google Vision) if desired.
- Configure the webhook URL in Cloudinary to point to `/v1/media/cloudinary-webhook` on your backend and ensure the URL is publicly reachable.
- For production, verify webhook signatures using the Cloudinary `api_secret`.

Next steps / Recommendations

 - Admin review is optional: covers are auto-published unless explicitly rejected. An admin UI can still be added for manual overrides/audit if desired.
- Ensure the frontend uses the approved cover derivative URL for `og:image` and other social metadata.
- Optionally, use Cloudinary's `eager_async` processing and listen to notification events for better scaling.

If you want, I can:
- Add a small admin reviewer endpoint and UI to approve/reject covers.
- Add signature verification on the webhook handler.
- Replace alert-based frontend snapshot viewer with a modal.
