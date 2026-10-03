# Fwaya Music mobile app

This Expo app provides a native listener experience for browsing the public Fwaya
audio catalog, searching tracks, saving tracks on the device, and streaming free
tracks with background playback.

## Run locally

Build and install an EAS development client first; Expo Go does not include the
native RevenueCat purchase module.

From the repository root:

```sh
npm run start --workspace=fwaya-mobile
```

The app uses `https://fwayamusic1-backend.vercel.app` by default. To point it at
another backend, set `EXPO_PUBLIC_API_URL` before starting Expo.

## Listener accounts

Sign-in uses the same Firebase project as the website. Configure these Expo
public environment variables for local runs and EAS builds:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

Email/password sign-in must be enabled in Firebase Authentication. The app
loads the signed-in account and requests playback URLs from the authenticated
backend. The backend verifies active Premium membership or a completed
track-specific purchase before issuing a Cloudinary authenticated-delivery URL.
Pay-per-view purchase flows in the mobile app are not yet implemented.

## Store purchases

Mobile Premium purchases use RevenueCat and must be tested in an iOS/Android
development or store build; RevenueCat's native SDK is not available in Expo Go.
Configure these public platform keys in the EAS environment used for each build:

- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`

In the RevenueCat dashboard, connect the App Store and Google Play apps, attach
the monthly/yearly subscription products to an entitlement named
`fwaya_premium`, and publish a current offering. The app displays the offering's
localized packages and supports purchases, restore, and store subscription
management. Sign-in is required so the store customer is linked to a Fwaya
account.

Set `REVENUECAT_SECRET_API_KEY` on the backend and, if the entitlement uses a
different identifier, set `REVENUECAT_PREMIUM_ENTITLEMENT`. The authenticated
mobile sync endpoint looks up the signed-in customer's subscription directly
with RevenueCat before updating Premium access; the RevenueCat secret must never
be included in an app build. The backend records RevenueCat-managed subscription
rows with `metadata.source = "revenuecat"` and a zero placeholder price because
the subscriber API does not provide transaction pricing; exclude those rows
from revenue reporting.

For prompt cancellation and refund updates, configure the RevenueCat webhook at
`/api/v1/subscriptions/revenuecat/webhook` and set the webhook Authorization
header to the exact value in backend `REVENUECAT_WEBHOOK_AUTHORIZATION`. The
webhook causes the backend to re-fetch entitlement state from RevenueCat rather
than trusting entitlement claims in the event body.

Individual pay-per-view purchases are not yet offered in the mobile app.

## Catalog availability

Installed builds fetch the live audio catalog from the production backend by
default. `EXPO_PUBLIC_API_URL` can override that URL for a separately configured
environment. The app caches catalog metadata on the device so previously seen
tracks remain listed offline; streaming still requires an internet connection.
Saved tracks are bookmarks, not offline audio downloads.

Protected assets require Cloudinary authenticated delivery. Deploy the
backend/frontend playback changes before applying the migration so authorized
playback is available as soon as the old public CDN URLs are invalidated. From
the repository root, run:

```sh
npm run media:secure-protected --workspace=backend
```

The first command is a dry run. Review its list and ensure Cloudinary CDN
invalidation is enabled for the account before running the apply command. In
PowerShell, apply the reviewed migration with:

```powershell
$env:CONFIRM_PROTECTED_MEDIA_MIGRATION = "yes"
npm run media:secure-protected --workspace=backend -- --apply
```

Cloudinary authenticated URLs prevent unauthenticated access to the asset, but
the generated delivery signature is not time-limited. Treat issued playback
URLs as shareable bearer links; strict link-expiry or per-request revocation
requires a separate expiring-token or streaming-proxy design.

## Build

Internal preview builds use the `preview` EAS profile. Store builds use the
`production` profile:

```sh
eas build --profile development --platform android
eas build --profile preview --platform android
eas build --profile production --platform all
```

The app uses `fwaya.app` as its iOS bundle identifier and Android application
ID. Configure the matching Apple and Google developer accounts in EAS before
building for the stores.

App-side gates are for user experience only. Premium access is checked by the
backend; secure delivery and purchase validation must remain server-side.
