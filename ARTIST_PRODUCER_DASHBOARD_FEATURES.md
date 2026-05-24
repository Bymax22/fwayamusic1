# Artist & Producer Dashboard - Pre-Migration Feature Documentation

## Overview
This document outlines all the new features, database models, and services that have been added to support comprehensive Artist and Producer dashboards before the Prisma migration.

---

## Database Schema Updates

### New Enums Added

#### 1. `ContentStatus`
```
DRAFT, SUBMITTED, APPROVED, PUBLISHED, REJECTED, ARCHIVED, DELETED
```
Tracks the publication status of content (tracks, albums).

#### 2. `DeletionReason`
```
USER_REQUEST, DUPLICATE, COPYRIGHT_VIOLATION, POLICY_VIOLATION, ACCOUNT_DELETION, ADMIN_REMOVAL, OTHER
```
Reasons for content deletion with audit trail.

#### 3. `CollaborationType`
```
PRODUCER, FEATURE_ARTIST, SONGWRITER, ENGINEER, MIXER, MASTERING, BAND_MEMBER
```
Different types of collaborations for tracking producer roles.

### New Models Added

#### 1. **Album**
Manages albums and EPs with full control over metadata and tracking.

**Key Fields:**
- `title`, `description`, `genre`, `tags`
- `releaseDate`, `recordLabel`, `copyrightYear`
- `contentStatus` - Draft/Submitted/Approved/Published/Archived/Deleted
- `coverImageUrl`, `cloudinaryId` - For album artwork
- `totalTracks`, `totalDuration` - Auto-tracked stats
- `deletedAt`, `deletionReason` - Soft delete tracking

**Capabilities:**
- Create and manage albums
- Publish albums
- Submit for review
- Archive albums
- Soft delete albums
- Update album covers
- Get album statistics

#### 2. **TrackAnalytics**
Comprehensive daily analytics tracking for each track.

**Key Fields:**
- `date` - Daily aggregation
- `playsCount`, `downloadsCount`, `sharesCount`, `likesCount`
- `topCountries`, `topRegions` - Geographic breakdown
- `deviceTypes`, `platforms` - Device analytics
- `averagePlayDuration`, `completionRate` - Engagement metrics
- `totalRevenue` - Revenue tracking

**Capabilities:**
- Daily analytics recording
- Track performance over time
- Geographic insights
- Device/platform breakdown
- Revenue tracking
- Top performing tracks

#### 3. **ContentModeration**
Moderation queue for tracking content review status.

**Key Fields:**
- `status` - Draft/Submitted/Approved/Published/Rejected/Archived/Deleted
- `reviewedBy`, `reviewedAt` - Moderator tracking
- `reason`, `comments` - Feedback for rejection
- Flags: `hasCopyright`, `isExplicit`, `isDuplicate`, `isOffensive`
- `customFlags` - Extensible for future flag types

**Capabilities:**
- Content submission workflow
- Moderation queue management
- Review feedback
- Audit trail

#### 4. **ProducerCollaboration**
Manages artist-producer relationships and revenue sharing.

**Key Fields:**
- `collaborationType` - Producer/Feature Artist/Songwriter/Engineer/Mixer/Mastering
- `role`, `description` - Collaboration details
- `percentage`, `flatFee` - Revenue sharing
- `isPaid`, `paidAt` - Payment tracking
- `status` - Pending/Approved/Rejected/Completed
- `requestedAt`, `respondedAt` - Timeline tracking

**Capabilities:**
- Request collaborations
- Approve/reject requests
- Track revenue sharing
- Payment management
- Collaboration history

#### 5. **AccountDeletion**
Manages user account deletion requests with data retention.

**Key Fields:**
- `requestedAt`, `scheduledFor` - 30-day grace period
- `status` - Pending/Scheduled/In-Progress/Completed/Cancelled
- `reason`, `details` - Deletion metadata
- `retainData` - Data export option
- `dataExportUrl` - Export location
- `cancelledAt`, `cancellationReason` - Cancellation tracking

**Capabilities:**
- Request account deletion
- 30-day grace period
- Cancel deletion before execution
- Export user data
- Anonymization on deletion
- Audit trail

---

## Enhanced User Model

### New Fields
- `deletionRequestedAt` - When deletion was requested
- `deletionReason` - Reason for deletion request
- `deletionDetails` - Additional deletion metadata
- Status updated to include: `DELETED_PENDING`, `DELETED_COMPLETED`

### New Relations
- `albums` - Albums created by user
- `producedMedia` - Tracks produced by user
- `collaborations` - Artist collaborations
- `collaborationRequests` - Producer requests received
- `contentModerations` - Moderation reviewed by user
- `userContentModerations` - Content moderation for user's work
- `accountDeletion` - Account deletion request
- `trackAnalytics` - Analytics data created by user

---

## Enhanced Media Model

### New Fields

**Content Management:**
- `producerId` - Links to producer/engineer
- `albumId` - Links to parent album
- `contentStatus` - Publication workflow status
- `version` - Track version number
- `originalMediaId` - For tracking replacements/versions
- `deletedAt`, `deletionReason`, `deletionDetails` - Soft delete

**Metadata:**
- `releaseDate` - Release date
- `mood` - Emotional tone
- `lyricist` - Lyricist name
- `composer` - Composer name
- `copyrightYear`, `copyrightOwner` - Copyright info
- `isrc` - International Standard Recording Code
- `rights` - JSON rights information

### New Relations
- `album` - Parent album
- `producer` - Producer/engineer
- `analytics` - Daily analytics
- `collaborations` - Producer collaborations
- `contentModerations` - Moderation records
- `versionedMedia` - Version history

---

## New Services

### 1. **AlbumsService**
```
Endpoints:
- POST /api/v1/albums - Create album
- GET /api/v1/albums/my-albums - Get user's albums
- GET /api/v1/albums/artist/:artistId - Get artist's albums
- GET /api/v1/albums/:id - Get album details
- PATCH /api/v1/albums/:id - Update album
- POST /api/v1/albums/:id/publish - Publish album
- POST /api/v1/albums/:id/submit-review - Submit for review
- POST /api/v1/albums/:id/archive - Archive album
- DELETE /api/v1/albums/:id - Delete album (soft delete)
- PATCH /api/v1/albums/:id/cover - Update cover image
- GET /api/v1/albums/:id/stats - Get album statistics
- POST /api/v1/albums/:id/tracks/:mediaId - Add track to album
- DELETE /api/v1/albums/:id/tracks/:mediaId - Remove track from album
```

### 2. **TracksService**
```
Endpoints:
- GET /api/v1/tracks/my-tracks - Get user's tracks
- GET /api/v1/tracks/:id - Get track details
- GET /api/v1/tracks/:id/stats - Get track statistics
- PATCH /api/v1/tracks/:id - Update track
- POST /api/v1/tracks/:id/rename - Rename track
- PATCH /api/v1/tracks/:id/cover - Update track cover
- POST /api/v1/tracks/:id/make-free - Make track free
- POST /api/v1/tracks/:id/make-premium - Make track premium
- POST /api/v1/tracks/:id/make-pay-per-view - Make track pay-per-view
- POST /api/v1/tracks/:id/publish - Publish track
- POST /api/v1/tracks/:id/archive - Archive track
- POST /api/v1/tracks/:id/submit-review - Submit for review
- DELETE /api/v1/tracks/:id - Delete track
- POST /api/v1/tracks/bulk-update - Bulk update tracks
- POST /api/v1/tracks/:id/reselling - Enable/disable reselling
```

### 3. **AnalyticsService**
```
Endpoints:
- GET /api/v1/artist/dashboard/analytics - Dashboard analytics
- GET /api/v1/artist/dashboard/revenue - Revenue analytics
- GET /api/v1/artist/dashboard/analytics/geographic - Geographic data
- GET /api/v1/artist/dashboard/analytics/devices - Device analytics
```

### 4. **AccountDeletionService**
```
Endpoints:
- POST /api/v1/account/request-deletion - Request deletion
- POST /api/v1/account/cancel-deletion - Cancel deletion
- GET /api/v1/account/deletion-status - Get deletion status
- GET /api/v1/account/data-export - Export user data
```

### 5. **Artist Dashboard Controller**
```
Endpoints:
- GET /api/v1/artist/dashboard/overview - Dashboard overview
- GET /api/v1/artist/dashboard/content - All content (tracks + albums)
- GET /api/v1/artist/dashboard/analytics - Analytics dashboard
- GET /api/v1/artist/dashboard/revenue - Revenue dashboard
- GET /api/v1/artist/dashboard/analytics/geographic - Geographic analytics
- GET /api/v1/artist/dashboard/analytics/devices - Device analytics
- GET /api/v1/artist/dashboard/stats - Quick stats
- GET /api/v1/artist/dashboard/moderation - Pending moderation
- GET /api/v1/artist/dashboard/collaborations - Get collaborations
- POST /api/v1/artist/dashboard/collaborations/:id/approve
- POST /api/v1/artist/dashboard/collaborations/:id/reject
```

### 6. **Producer Dashboard Controller**
```
Endpoints:
- GET /api/v1/producer/dashboard/overview - Dashboard overview
- GET /api/v1/producer/dashboard/collaborations - Get collaborations
- GET /api/v1/producer/dashboard/tracks - Get produced tracks
- GET /api/v1/producer/dashboard/earnings - Get earnings
- POST /api/v1/producer/dashboard/collaborations/:id/approve
- POST /api/v1/producer/dashboard/collaborations/:id/reject
- GET /api/v1/producer/dashboard/portfolio - Get portfolio
- GET /api/v1/producer/dashboard/stats - Get stats
- GET /api/v1/producer/dashboard/verification - Get verification status
```

---

## Key Features Implemented

### ✅ **Track Management**
- Rename tracks
- Change pricing (Free → Premium → Pay-Per-View)
- Update track artwork
- Publish/Archive/Delete tracks
- Submit for review
- Bulk operations

### ✅ **Album Management**
- Create/Edit/Delete albums
- Add/Remove tracks from albums
- Publish albums
- Submit for review
- Archive albums
- Track album statistics

### ✅ **Analytics & Reporting**
- Daily track performance metrics
- Geographic insights (top countries/regions)
- Device/platform breakdown
- Revenue tracking and reporting
- Top performing tracks
- Engagement metrics (plays, downloads, shares, likes)

### ✅ **Content Moderation**
- Content submission workflow
- Review queue management
- Copyright/Policy violation flagging
- Reviewer feedback
- Audit trail

### ✅ **Producer Collaborations**
- Request collaborations
- Approve/Reject requests
- Revenue sharing (percentage or flat fee)
- Payment tracking
- Different collaboration types
- Portfolio management

### ✅ **Account Deletion**
- Request deletion with 30-day grace period
- Cancel deletion before execution
- Data export with retention options
- Automatic anonymization on deletion
- Complete audit trail

### ✅ **Dashboard Features**
- **Artist Dashboard:**
  - Overview with key stats
  - Content management (tracks + albums)
  - Comprehensive analytics
  - Revenue insights
  - Collaboration management
  - Moderation status
  
- **Producer Dashboard:**
  - Production overview
  - Collaboration requests
  - Portfolio management
  - Earnings tracking
  - Verification status

---

## Pre-Migration Checklist

Before running the Prisma migration, ensure:

### Database Considerations
- [ ] Backup existing database
- [ ] Review migration script
- [ ] Test migration in staging environment
- [ ] Verify foreign key constraints
- [ ] Check unique constraints (e.g., mediaId_date in TrackAnalytics)

### Code Updates Needed
- [ ] Import new services into app.module.ts
- [ ] Update user module to include new routes
- [ ] Add new decorators/guards as needed
- [ ] Update DTOs for new fields
- [ ] Configure analytics cronjob (if needed)

### Testing Required
- [ ] Album CRUD operations
- [ ] Track pricing changes
- [ ] Analytics recording and retrieval
- [ ] Account deletion flow
- [ ] Collaboration workflow
- [ ] Content moderation
- [ ] Bulk operations
- [ ] Authorization checks

### Infrastructure
- [ ] Cloudinary integration for image uploads
- [ ] Scheduled task for account deletion (30-day execution)
- [ ] Analytics aggregation cronjob (daily)

---

## Migration Steps

1. **Update Modules:**
   ```bash
   # Add to app.module.ts
   - AlbumsModule
   - AnalyticsModule
   - ArtistDashboardModule
   - ProducerDashboardModule
   ```

2. **Run Prisma Migration:**
   ```bash
   npx prisma migrate dev --name add_dashboards
   ```

3. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

4. **Test Endpoints:**
   - Use Postman/Insomnia to test all endpoints
   - Verify authorization on protected routes
   - Test error handling

5. **Deploy:**
   - Deploy to staging first
   - Run full test suite
   - Monitor for errors
   - Deploy to production

---

## Future Enhancements

- [ ] Batch analytics processing for performance
- [ ] ML-based recommendations for trending content
- [ ] Advanced filtering and searching
- [ ] A/B testing tools for releases
- [ ] Advanced reporting/export formats
- [ ] Marketing tools and promotional features
- [ ] Content calendars and planning
- [ ] Social media integration
- [ ] Streaming platform integration (Spotify, Apple Music, etc.)
- [ ] ISRC registration and management

---

## Notes

- All deletions are soft deletes for audit purposes
- The 30-day grace period for account deletion provides a cancellation window
- Analytics are recorded daily and can be aggregated for longer periods
- Content moderation supports extensible flag system
- All timestamps are preserved for audit trails
- Revenue sharing supports both percentage and flat fee models
