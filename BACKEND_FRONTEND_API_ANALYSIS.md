# Fwaya Music Project - Backend/Frontend API Analysis Report

**Generated:** May 12, 2026  
**Project:** Fwaya Music Platform  
**Scope:** Like/Follow/Comment endpoints analysis

---

## Executive Summary

The Fwaya Music platform has **partial implementation** of social interaction features:
- ✅ **Likes**: Database model exists, backend endpoint partially implemented
- ✅ **Follows**: Database model exists, basic backend endpoint available
- ❌ **Comments**: Database models exist for news comments only, NO media comments endpoint
- ⚠️ **Mismatches**: Multiple frontend calls expect endpoints that don't exist

---

## 1. BACKEND ENDPOINT ANALYSIS

### 1.1 Media Likes Endpoints

**✅ Backend Implementation Status: PARTIAL**

```
Endpoint:  POST /v1/media/:mediaId/interact/like
Location:  apps/backend/src/media-interaction/media-interaction.controller.ts
Route:     @Post('like')
Guard:     FirebaseAuthGuard (authenticated users only)

Parameters:
  - mediaId: number (path param)
  - userId: number (from @CurrentUser() decorator)

Response: MediaInteraction object with { liked: true }
```

**Service Logic:**
```typescript
// apps/backend/src/media-interaction/media-interaction.service.ts
async likeMedia(mediaId: number, userId: number) {
  return this.prisma.mediaInteraction.upsert({
    where: { mediaId_userId: { mediaId, userId } },
    update: { liked: true },
    create: { mediaId, userId, liked: true },
  });
}
```

**Issues:**
- ❌ No DELETE/UNLIKE endpoint - frontend needs to unlike but backend doesn't support it
- ❌ No GET endpoint to check if user liked a track
- ❌ No GET endpoint to get likes count for a track

---

### 1.2 Media Heart/Save Endpoints

**✅ Backend Implementation Status: PARTIAL**

```
Endpoint:  POST /v1/media/:mediaId/interact/heart
Location:  apps/backend/src/media-interaction/media-interaction.controller.ts
Route:     @Post('heart')

Service:
async heartMedia(mediaId: number, userId: number) {
  return this.prisma.mediaInteraction.upsert({
    where: { mediaId_userId: { mediaId, userId } },
    update: { saved: true },
    create: { mediaId, userId, saved: true },
  });
}
```

**Purpose:** Save/bookmark track (stored in `saved` field)

**Issues:**
- ❌ No DELETE/UNSAVE endpoint
- ❌ No GET endpoint to check saved status

---

### 1.3 Play Count Tracking Endpoint

**✅ Backend Implementation Status: PARTIAL**

```
Endpoint:  POST /v1/media/:mediaId/interact/play
Location:  apps/backend/src/media-interaction/media-interaction.controller.ts
Route:     @Post('play')

Service:
async playMedia(mediaId: number, userId: number) {
  await this.prisma.media.update({
    where: { id: mediaId },
    data: { playCount: { increment: 1 } },
  });
  return this.prisma.mediaInteraction.upsert({
    where: { mediaId_userId: { mediaId, userId } },
    update: { played: true },
    create: { mediaId, userId, played: true },
  });
}
```

---

### 1.4 Follow User Endpoints

**⚠️ Backend Implementation Status: INCOMPLETE**

```
Endpoint:  POST /v1/follow
Location:  apps/backend/src/follower/follower.controller.ts
Route:     @Post()
Guard:     NONE - NOT PROTECTED! ⚠️

Parameters:
  - followerId: number (from body)
  - followingId: number (from body)

Service:
async followUser(followerId: number, followingId: number) {
  return this.prisma.follower.create({
    data: { followerId, followingId },
  });
}
```

**Issues:**
- ❌ **NO AUTHENTICATION GUARD** - Security vulnerability!
- ❌ No DELETE/UNFOLLOW endpoint
- ❌ No GET endpoint to check if user is following
- ❌ No GET endpoint to fetch followers list
- ❌ No GET endpoint to fetch following list
- ❌ No endpoint to get followers count
- ⚠️ Endpoint doesn't use @CurrentUser() decorator - frontend must send followerId manually

---

### 1.5 Comment Endpoints

**❌ Backend Implementation Status: MISSING FOR MEDIA**

**News Comments: ✅ IMPLEMENTED**
```
Database Model: NewsComment
  - id: Int
  - newsId: Int
  - userId: Int
  - content: String
  - createdAt: DateTime

Service: news.service.ts includes comments in news.findMany() results
Endpoint: Included in GET /v1/news/:id (read-only, no POST endpoint)
```

**Media Comments: ❌ NOT IMPLEMENTED**
```
❌ NO database model for media comments
❌ NO MediaComment entity in Prisma schema
❌ NO controller endpoints for media comments
❌ NO service methods for media comments
```

**Frontend Expectations:**
- Track page calls: `GET /api/v1/media/{id}/comments`
- Artists page: Does NOT call comment endpoint
- Browse page: Does NOT call comment endpoint

---

### 1.6 User Liked Media Endpoint

**✅ Backend Implementation Status: WORKING**

```
Endpoint:  GET /v1/user/me/liked
Location:  apps/backend/src/user/user.controller.ts
Route:     @Get('me/liked')
Guard:     FirebaseAuthGuard (authenticated)

Service:
async getLikedMediaByEmail(email: string) {
  const user = await this.prisma.user.findUnique({
    where: { email },
    include: { interactions: true }
  });
  return this.prisma.mediaInteraction.findMany({
    where: { userId: user.id, liked: true },
    include: { media: true }
  });
}
```

---

## 2. FRONTEND API CALLS ANALYSIS

### 2.1 Track Page (`/app/track/[id]/page.tsx`)

**API Calls Made:**

| Call | Endpoint | Method | Status |
|------|----------|--------|--------|
| Get track details | `GET /api/v1/media/{id}` | ✅ | Working |
| Get comments | `GET /api/v1/media/{id}/comments` | ❌ | **Endpoint Missing** |
| Get related tracks | `GET /api/v1/media?genre={genre}&limit=5` | ✅ | Working |
| Like/Unlike track | `POST /api/v1/media/{id}/like` | ❌ | **No URL match** |
| Post comment | `POST /api/v1/media/{id}/comments` | ❌ | **Endpoint Missing** |
| Post reply | `POST /api/v1/media/{id}/comments/{cId}/reply` | ❌ | **Endpoint Missing** |

**Frontend Code:**
```typescript
// Fetch comments (Line 101)
const commentsRes = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/media/${params.id}/comments`
);

// Like handler (Line 120) - TODO only
const handleLike = async () => {
  setIsLiked(!isLiked);
  // TODO: API call to like/unlike track
};

// Post comment (Line 158) - TODO only
// TODO: API call to post comment
```

**Issues:**
- ⚠️ Comments endpoint doesn't exist in backend
- ⚠️ Like endpoint exists but path mismatch: `POST /v1/media/:mediaId/interact/like` not `/v1/media/{id}/like`

---

### 2.2 Artist Page (`/app/artists/[id]/page.tsx`)

**API Calls Made:**

| Call | Endpoint | Method | Status |
|------|----------|--------|--------|
| Get artist | `GET /api/v1/artists/{id}` | ✅ | Working |
| Follow artist | (None - TODO) | ❌ | **Placeholder, not implemented** |
| Like song | (None - TODO) | ❌ | **Placeholder, not implemented** |
| Share song | (Web Share API or clipboard) | ✅ | Client-side |

**Frontend Code:**
```typescript
// Line 114-116: Follow handler
const handleFollow = () => {
  // TODO: Implement follow functionality
  setArtist(prev => prev ? { ...prev, isFollowing: !prev.isFollowing } : null);
};

// Line 119-129: Like handler
const handleLikeSong = (songId: number) => {
  setLikedSongs(prev => { ... });
  // TODO: API call to like/unlike song
};
```

**Issues:**
- ⚠️ NO API calls implemented for follow/unfollow
- ⚠️ NO API calls implemented for like/unlike songs
- ⚠️ Frontend tracks local state but doesn't persist to backend
- ⚠️ Follow endpoint `/v1/follow` exists but is unguarded (security risk)

---

### 2.3 Browse Page (`/app/browse/page.tsx`)

**API Calls Made:**

| Call | Endpoint | Method | Status |
|------|----------|--------|--------|
| Get all media | `GET /api/v1/media` | ✅ | Working |
| Get playlists | `GET /api/v1/playlist?type=USER` | ✅ | Working |
| Like track | (Click handler exists) | ❌ | **Not implemented** |
| Download track | (Click handler exists) | ❌ | **Not implemented** |

**Frontend Code:**
```typescript
// Media with interactions (already mapped):
likes: Array.isArray(item.interactions)
  ? item.interactions.filter((i) => i.liked).length
  : 0,

// However: Like/Unlike handlers not connected to API
```

**Issues:**
- ⚠️ Browse page displays likes but no actual like/unlike functionality
- ⚠️ Like endpoints are TODO

---

## 3. DATABASE SUPPORT ANALYSIS

### 3.1 MediaInteraction Model

**✅ WORKING - Supports Likes, Saves, Play Tracking**

```prisma
model MediaInteraction {
  id           Int       @id @default(autoincrement())
  mediaId      Int       @map("media_id")
  userId       Int       @map("user_id")
  liked        Boolean?  @default(false)
  saved        Boolean?  @default(false)
  played       Boolean?  @default(false)
  position     Int?
  interactedAt DateTime? @default(now())

  media Media @relation(fields: [mediaId], references: [id])
  user  User  @relation(fields: [userId], references: [id])

  @@unique([mediaId, userId])
  @@map("media_interactions")
}
```

**Capabilities:**
- ✅ Track likes per user per media
- ✅ Track saved/bookmarked items
- ✅ Track play history
- ✅ Unique constraint prevents duplicates
- ✅ Composite key ensures one interaction record per user/media pair

---

### 3.2 Follower Model

**✅ WORKING - Supports Following/Followers**

```prisma
model Follower {
  id          Int      @id @default(autoincrement())
  followerId  Int      @map("follower_id")
  followingId Int      @map("following_id")
  createdAt   DateTime @default(now())

  follower  User @relation("followers", fields: [followerId], references: [id])
  following User @relation("following", fields: [followingId], references: [id])

  @@unique([followerId, followingId])
  @@map("followers")
}
```

**User Relations:**
```prisma
model User {
  followers      Follower[]  @relation("following")
  following      Follower[]  @relation("followers")
}
```

**Capabilities:**
- ✅ Track who follows whom
- ✅ Prevent duplicate follows
- ✅ Query followers and following lists
- ✅ Calculate follower count

---

### 3.3 NewsComment Model

**✅ EXISTS - For News Only**

```prisma
model NewsComment {
  id        Int      @id @default(autoincrement())
  newsId    Int
  userId    Int
  content   String
  createdAt DateTime @default(now())

  news News @relation(fields: [newsId], references: [id])
  user User @relation(fields: [userId], references: [id])

  @@map("news_comments")
}
```

**Media Comments: ❌ NOT MODELED**
- No MediaComment entity in Prisma schema
- Track page expects comments but database has no model

---

### 3.4 News Interactions

**✅ NEWS HAS FULL INTERACTION SUPPORT**

```prisma
model NewsLike       // Like a news article
model NewsShare      // Share a news article
model NewsComment    // Comment on a news article
model NewsBookmark   // Bookmark a news article
model NewsView       // Track views (anonymous or logged-in)
model NewsReport     // Report inappropriate news
model NewsReaction   // Emoji reactions (like, love, angry, sad, wow)
```

**Media Interactions: PARTIAL**
- ✅ Likes/Saves/Plays (MediaInteraction)
- ❌ No dedicated Comments model
- ❌ No Shares model
- ❌ No Views tracking for media

---

## 4. MISMATCH SUMMARY

### Critical Mismatches

| Feature | Frontend Expects | Backend Provides | Status |
|---------|------------------|------------------|--------|
| **Like Track** | `POST /api/v1/media/{id}/like` | `POST /v1/media/:mediaId/interact/like` | ❌ Path Mismatch |
| **Unlike Track** | `DELETE /api/v1/media/{id}/like` | ❌ NOT PROVIDED | ❌ Missing |
| **Get Comments** | `GET /api/v1/media/{id}/comments` | ❌ NOT PROVIDED | ❌ Missing |
| **Post Comment** | `POST /api/v1/media/{id}/comments` | ❌ NOT PROVIDED | ❌ Missing |
| **Reply to Comment** | `POST /api/v1/media/{id}/comments/{cId}/reply` | ❌ NOT PROVIDED | ❌ Missing |
| **Follow Artist** | `POST /api/v1/artists/{id}/follow` or similar | `POST /v1/follow` (unguarded) | ⚠️ Path Mismatch + Security Issue |
| **Unfollow Artist** | `DELETE /api/v1/artists/{id}/follow` | ❌ NOT PROVIDED | ❌ Missing |
| **Check If Liked** | Implicit in UI state | ❌ NOT PROVIDED | ❌ Missing |
| **Check If Following** | Implicit in UI state | ❌ NOT PROVIDED | ❌ Missing |
| **Get Followers Count** | Displayed on artist page | Mocked with random number | ⚠️ Not Real |

---

## 5. WORKING vs NOT WORKING

### ✅ FULLY WORKING

1. **Browse Page - Media Display**
   - `GET /api/v1/media` returns all tracks
   - Displays likes, plays, artist info
   - Responsive UI with filters

2. **Track Page - Track Display**
   - `GET /api/v1/media/{id}` returns track details
   - Displays all metadata (duration, genre, access type, DRM)
   - Displays user info and verification badges

3. **Artist Page - Artist Display**
   - `GET /api/v1/artists/{id}` returns artist info
   - Shows tracks, bio, website, social links
   - Displays follower count (though mocked)

4. **Related Tracks**
   - `GET /api/v1/media?genre={genre}&limit=5` returns related tracks
   - Filters by genre correctly

5. **User Liked Media**
   - `GET /v1/user/me/liked` returns all liked tracks for authenticated user
   - Includes media details

6. **News Section**
   - Full news read/comment system for news articles
   - Comments display with user info
   - Reactions system

---

### ❌ NOT WORKING / INCOMPLETE

1. **Media Comments System**
   - Frontend calls `GET /api/v1/media/{id}/comments` → **404**
   - No database model for MediaComment
   - No POST endpoint to create comments
   - No DELETE endpoint to remove comments
   - No PUT endpoint to edit comments

2. **Media Like/Unlike**
   - Frontend expects: `POST /api/v1/media/{id}/like`
   - Backend provides: `POST /v1/media/:mediaId/interact/like`
   - No DELETE/unlike endpoint
   - No GET to check if already liked

3. **Follow/Unfollow**
   - Endpoint exists but **NOT PROTECTED** (no auth guard)
   - No unfollow endpoint
   - Must send followerId in body (not from current user)
   - No getter endpoints for followers/following

4. **Save/Bookmark**
   - Heart/save endpoint exists: `POST /v1/media/:mediaId/interact/heart`
   - No unsave endpoint
   - No GET to check saved status

---

## 6. RECOMMENDATIONS & FIXES NEEDED

### Priority 1: Critical (Blocking Features)

1. **Create Media Comments Endpoint**
   ```
   DATABASE:
   - Create MediaComment Prisma model
   
   BACKEND:
   - POST /v1/media/:mediaId/comments (create)
   - GET /v1/media/:mediaId/comments (list)
   - DELETE /v1/media/:mediaId/comments/:commentId (delete)
   - PUT /v1/media/:mediaId/comments/:commentId (edit)
   - POST /v1/media/:mediaId/comments/:commentId/reply (nested replies)
   
   FRONTEND:
   - Connect comment form to POST endpoint
   - Connect reply form to nested reply endpoint
   ```

2. **Fix Like/Unlike Endpoint Path**
   ```
   Current: POST /v1/media/:mediaId/interact/like
   
   Option A: Update frontend to use correct path
   Option B: Create alias endpoint at /v1/media/:mediaId/like
   
   ADD: DELETE /v1/media/:mediaId/like (or POST with toggle)
   ```

3. **Add Unfollow Endpoint**
   ```
   BACKEND:
   - DELETE /v1/follow/:followingId (delete follow relationship)
   - Add FirebaseAuthGuard to follow endpoints
   - Modify follow endpoint to use @CurrentUser() for followerId
   ```

### Priority 2: High (Important Features)

4. **Add Query Endpoints for Checking State**
   ```
   BACKEND:
   - GET /v1/media/:mediaId/liked (check if current user liked)
   - GET /v1/users/:userId/followers (list followers)
   - GET /v1/users/:userId/following (list following)
   - GET /v1/users/:userId/followers/count
   - GET /v1/users/:userId/following/count
   ```

5. **Fix Artist Page Followers Display**
   ```
   BACKEND (artists.service.ts):
   - Replace mock data:
     followers: Math.floor(Math.random() * 10000) + 1000
   - With real query:
     followers: await this.prisma.follower.count({
       where: { followingId: artistId }
     })
   ```

6. **Secure Follow Endpoints**
   ```
   - Add @UseGuards(FirebaseAuthGuard) to follower.controller.ts
   - Use @CurrentUser() decorator for followerId
   - Remove requirement to send followerId in body
   ```

### Priority 3: Medium (Quality of Life)

7. **Add Media Views Tracking**
   ```
   DATABASE:
   - Create MediaView model (optional, for analytics)
   
   BACKEND:
   - POST /v1/media/:mediaId/view (increment play count)
   ```

8. **Add Media Share Tracking**
   ```
   DATABASE:
   - Track shares in MediaInteraction or dedicated model
   
   BACKEND:
   - POST /v1/media/:mediaId/share
   ```

---

## 7. API ENDPOINT AUDIT TABLE

### Backend Endpoints Available

```
╔═══════════════════════════════════════════════════════════════════════╗
║ ENDPOINT                                   STATUS  GUARD   IMPLEMENT  ║
╠═══════════════════════════════════════════════════════════════════════╣
║ Like/Interaction Endpoints                                             ║
├─ POST   /v1/media/:mediaId/interact/like  ✅      ✅      COMPLETE   ║
├─ POST   /v1/media/:mediaId/interact/heart ✅      ✅      COMPLETE   ║
├─ POST   /v1/media/:mediaId/interact/play  ✅      ✅      COMPLETE   ║
├─ DELETE /v1/media/:mediaId/interact/like  ❌      -       MISSING    ║
├─ GET    /v1/media/:mediaId/liked          ❌      -       MISSING    ║
║                                                                         ║
║ Follow Endpoints                                                        ║
├─ POST   /v1/follow                        ✅      ❌      UNSAFE!    ║
├─ DELETE /v1/follow/:id                    ❌      -       MISSING    ║
├─ GET    /v1/follow/followers              ❌      -       MISSING    ║
├─ GET    /v1/follow/following              ❌      -       MISSING    ║
║                                                                         ║
║ Comment Endpoints (Media)                                               ║
├─ POST   /v1/media/:mediaId/comments       ❌      -       MISSING    ║
├─ GET    /v1/media/:mediaId/comments       ❌      -       MISSING    ║
├─ DELETE /v1/media/:mediaId/comments/:id   ❌      -       MISSING    ║
├─ PUT    /v1/media/:mediaId/comments/:id   ❌      -       MISSING    ║
║                                                                         ║
║ Comment Endpoints (News)                                                ║
├─ GET    /v1/news/:newsId                  ✅      -       COMPLETE   ║
│  (includes comments)                                                     ║
├─ POST   /v1/news/:newsId/comments         ❌      -       MISSING    ║
║                                                                         ║
║ Media Endpoints                                                         ║
├─ GET    /v1/media                         ✅      -       COMPLETE   ║
├─ GET    /v1/media/:id                     ✅      -       COMPLETE   ║
├─ GET    /v1/media/user/me                 ✅      ✅      COMPLETE   ║
├─ POST   /v1/media/upload                  ✅      ✅      COMPLETE   ║
├─ POST   /v1/media/save-metadata           ✅      ✅      COMPLETE   ║
║                                                                         ║
║ User Endpoints                                                          ║
├─ GET    /v1/user/me/liked                 ✅      ✅      COMPLETE   ║
║                                                                         ║
║ Artist Endpoints                                                        ║
├─ GET    /v1/artists/:id                   ✅      -       COMPLETE   ║
║ (but followers count is mocked)                                        ║
║                                                                         ║
║ News Endpoints                                                          ║
├─ GET    /v1/news                          ✅      -       COMPLETE   ║
├─ GET    /v1/news/:id                      ✅      -       COMPLETE   ║
║                                                                         ║
║ Playlist Endpoints                                                      ║
├─ GET    /v1/playlist?type=USER            ✅      -       COMPLETE   ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## 8. IMPLEMENTATION CHECKLIST

### Must Implement (Blocking)
- [ ] Create MediaComment Prisma model
- [ ] Implement GET /v1/media/:mediaId/comments
- [ ] Implement POST /v1/media/:mediaId/comments
- [ ] Implement DELETE /v1/media/:mediaId/comments/:id
- [ ] Fix frontend like endpoint path to match backend
- [ ] Implement DELETE /v1/media/:mediaId/interact/like (or toggle)

### Should Implement (Important)
- [ ] Secure /v1/follow endpoint with FirebaseAuthGuard
- [ ] Add @CurrentUser() to follow endpoint
- [ ] Implement DELETE /v1/follow/:followingId
- [ ] Fix artist followers to use real database count
- [ ] Add GET /v1/media/:mediaId/liked endpoint
- [ ] Add nested reply support for media comments
- [ ] Add reply support for comments

### Nice to Have (Enhancement)
- [ ] Create MediaShare model for share tracking
- [ ] Create MediaView model for view analytics
- [ ] Add comment pagination
- [ ] Add comment sorting/filtering
- [ ] Add comment moderation endpoints
- [ ] Add @mention support in comments
- [ ] Add comment threading UI

---

## 9. FILE LOCATIONS REFERENCE

### Backend Files to Modify

```
/apps/backend/src/
├─ media-interaction/
│  ├─ media-interaction.controller.ts    [Add DELETE endpoints]
│  ├─ media-interaction.service.ts       [Add toggle/delete logic]
│  └─ media-interaction.module.ts
├─ follower/
│  ├─ follower.controller.ts             [Add guard, DELETE, GET]
│  ├─ follower.service.ts                [Add new methods]
│  └─ follower.module.ts
├─ media/
│  ├─ media.controller.ts                [Add comment endpoints]
│  ├─ media.service.ts                   [Add comment methods]
│  └─ media.module.ts
├─ artists/
│  ├─ artists.service.ts                 [Fix followers count]
│  └─ artists.controller.ts
└─ prisma/
   └─ schema.prisma                      [Add MediaComment model]
```

### Frontend Files to Update

```
/apps/frontend/app/
├─ track/[id]/page.tsx                   [Fix API paths]
├─ artists/[id]/page.tsx                 [Add API calls]
├─ browse/page.tsx                       [Add like/unlike calls]
└─ components/
   └─ (comment components if exist)      [Add endpoints]
```

---

## Conclusion

The Fwaya Music platform has a **strong foundation** with working database models and basic endpoints, but the **comment system for media is completely missing**, and several **API path mismatches** exist between frontend and backend.

**Current Status: 40% Complete**
- ✅ Database models ready
- ✅ Basic like/follow backend
- ✅ User authentication working
- ❌ Comments not implemented for media
- ❌ Most social features are TODO placeholders

**Estimated effort to complete:**
- Comments system: 2-3 days
- Follow/Unfollow fixes: 1 day
- Like/Unlike path fixes: 1 day
- Testing & integration: 2 days
- **Total: ~1-1.5 weeks for full implementation**

