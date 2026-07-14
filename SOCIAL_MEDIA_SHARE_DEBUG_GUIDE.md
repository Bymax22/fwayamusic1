# Social Media Share Preview Debug Guide

## Summary of Fixes Applied

### 1. **Track Layout** (`apps/frontend/app/track/[id]/layout.tsx`)
✅ Fixed:
- Added proper `extractMediaIdFromSlug` import to convert "song-title-123" → 123
- Ensured numeric ID (`mediaId`) is extracted from slug before API calls
- Set `description` to actual track description (was empty string '')
- Added fallback description: `Listen to {title} by {artist} on Fwaya`
- Made `fallbackImage` URL absolutization more robust
- Added secondary `ogImage` pointing to `/api/og/track/{mediaId}` dynamic route
- Both OpenGraph and Twitter cards now have proper descriptions
- Added console logging: `[track-layout] Metadata: {...}`

### 2. **Video Layout** (`apps/frontend/app/videos/[id]/layout.tsx`)
✅ Fixed:
- Added `extractMediaIdFromSlug` import
- Ensured `videoId` is extracted from slug
- Set `description` to actual video description with fallback
- Improved image URL handling with absolute URL conversion
- Fallback to `/api/og/video/{videoId}` if no image available
- Added console logging: `[video-layout] Metadata: {...}`

### 3. **OG Image Routes** (Track & Video)
✅ Enhanced:
- Added console logging: `[og-track]` and `[og-video]` for debugging
- Ensures ID extraction before backend API calls
- Robust fallback to DEFAULT_IMAGE from Cloudinary
- Proper absolute URL conversion for all image sources

---

## What Should Happen Now

When you share a track/video on WhatsApp/Facebook/etc., the social platform crawler should receive:
- **Title**: "Song Title • Artist Name"
- **Description**: Actual track/video description (not empty)
- **Image**: Cover art with play button overlay (1200x630px)
- **Card Type**: "summary_large_image" for Twitter, "music.song" for OpenGraph

---

## Diagnostic Steps

### Step 1: Check Server-Side Metadata Generation

#### A. Check Console Logs
After deploying, share a track/video and check:
- **Frontend build logs**: Look for `[track-layout]` and `[video-layout]` messages
- **Runtime logs**: Check Vercel deployment logs for `[track-layout]` messages

Expected output:
```
[track-layout] Metadata: { 
  mediaId: 123, 
  title: "Song Title • Artist Name",
  description: "Listen to Song Title by Artist Name on Fwaya",
  fallbackImage: "https://res.cloudinary.com/.../cover.jpg",
  ogImage: "https://fwaya.net/api/og/track/123"
}
```

#### B. Test Metadata Endpoint Directly
Open your browser and visit:
```
https://fwaya.net/track/song-title-123
```

Open DevTools (F12) → Inspector → \<head\> and verify:
- `<meta property="og:title" ...>` contains track title
- `<meta property="og:description" ...>` contains description (NOT empty)
- `<meta property="og:image" ...>` contains image URL
- `<meta name="twitter:card" content="summary_large_image">`

### Step 2: Verify OG Image Generation

#### A. Test OG Image Route Directly
Visit these URLs directly in browser (should show an image):
```
https://fwaya.net/api/og/track/1
https://fwaya.net/api/og/video/1
```

Expected: See a 1200x630px image with:
- Cover art as background
- "Fwaya" label in purple
- Track title in large white text
- Artist name
- Play button overlay

If you see an error or blank page:
- Check Vercel logs for fetch errors
- Verify backend `/api/v1/media/1` endpoint is returning data with `coverArt` or `artCoverUrl` field

#### B. Check Image URLs in Backend Response
Test the backend API directly:
```
curl "https://your-backend.com/api/v1/media/1"
```

Verify the response includes ONE of:
- `coverArt`: "https://..." (absolute URL)
- `artCoverUrl`: "https://..."
- `coverUrl`: "https://..."
- `thumbnailUrl`: "https://..."

If these fields are missing/empty, that's the root cause.

### Step 3: Use Facebook Sharing Debugger

1. Go to: https://developers.facebook.com/tools/debug/sharing/
2. Enter your track/video URL: `https://fwaya.net/track/song-title-123`
3. Click "Debug"

Expected results:
- **Title**: Shows track title ✓
- **Description**: Shows description (not empty) ✓
- **Image**: Shows cover art thumbnail ✓
- **Errors**: None (or only non-critical warnings)

Common issues:
- "Image not accessible from Facebook servers" → Image URL has CORS issues
- "No Open Graph tags found" → Metadata not being injected into HTML
- "Image dimensions below 200x200" → Image URL pointing to wrong file

### Step 4: Use Twitter Card Validator

1. Go to: https://cards-dev.twitter.com/validator
2. Enter your track/video URL
3. Check preview

Expected:
- Card type: "Summary Card with Large Image"
- Image: Shows cover art
- Title: Shows track title
- Description: Shows full description

### Step 5: Test WhatsApp Share

1. Copy a track/video URL
2. Open WhatsApp Web or mobile
3. Paste URL in a chat

Expected:
- Card appears (not naked link)
- Shows cover art thumbnail
- Shows track title
- Shows description

If only link appears without preview:
- Check if the image URL is accessible globally (not localhost/internal IP)
- Verify absolute URL is being used in metadata
- Wait 5-10 minutes (social platforms cache for long periods)

---

## Troubleshooting

### Issue: "Only naked links showing"

**Check in this order:**

1. **Image URL is not absolute**
   ```typescript
   // ❌ Wrong
   image: "/uploads/cover.jpg"
   
   // ✅ Correct
   image: "https://fwaya.net/uploads/cover.jpg"
   ```

2. **Backend not returning cover art fields**
   ```typescript
   // Check if your backend response has these:
   {
     id: 123,
     title: "Song",
     coverArt: null,  // ❌ Missing
     artCoverUrl: null,  // ❌ Missing
     thumbnailUrl: null  // ❌ Missing
   }
   ```
   
   **Fix**: Update backend to include one of these fields

3. **Metadata not in HTML head**
   - Visit page in browser
   - Right-click → View Page Source
   - Search for `<meta property="og:title"`
   - If not found, metadata generation failed

4. **Social platform cached old metadata**
   - Clear cache using Facebook Sharing Debugger
   - Use Twitter Card Validator to force refresh
   - Wait 24-48 hours for full cache clear

### Issue: "Metadata is empty or default"

```typescript
// Check these console logs:
[track-layout] Metadata: { 
  mediaId: undefined,  // ❌ ID not extracted from slug
  description: "",  // ❌ Description is empty
  fallbackImage: "..." // Check if this is the default image
}
```

**Fixes:**
- Verify `extractMediaIdFromSlug()` working: slug "song-123" should → 123
- Check backend returns non-empty `description` field
- Verify track/video exists in database

### Issue: "OG image route returns 404 or error"

```
Error: Failed to fetch track metadata: 404
```

**Debug:**
1. Check backend URL is correct in `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-domain.com
   ```

2. Test backend endpoint directly:
   ```
   curl "https://your-backend-domain.com/api/v1/media/1"
   ```

3. Verify numeric ID extraction:
   ```typescript
   const id = extractMediaIdFromSlug("song-title-123");
   console.log(id); // Should be: 123 (not "song-title-123")
   ```

---

## Verification Checklist

Before declaring this fixed, verify:

- [ ] Track layout generates metadata with proper description
- [ ] Video layout generates metadata with proper description
- [ ] OG image routes (`/api/og/track/1`, `/api/og/video/1`) return valid images
- [ ] Facebook Sharing Debugger shows preview with image
- [ ] Twitter Card Validator shows preview with image
- [ ] WhatsApp web shows preview card (not naked link)
- [ ] Actual WhatsApp mobile shows preview card
- [ ] Backend returns cover art fields (`coverArt`, `artCoverUrl`, etc.)
- [ ] All image URLs are absolute (start with https://)
- [ ] Console shows `[track-layout]` and `[video-layout]` logs with actual data

---

## Deployment Notes

After fixing issues:

1. **Commit changes**
   ```bash
   git add apps/frontend/app/track/*/layout.tsx
   git add apps/frontend/app/videos/*/layout.tsx
   git add apps/frontend/app/api/og/*/route.tsx
   git commit -m "Fix social media share previews: extract numeric IDs, populate descriptions, absolutize URLs"
   ```

2. **Push to Vercel** (auto-deploys)
   ```bash
   git push origin main
   ```

3. **Clear social platform cache**
   - Facebook: https://developers.facebook.com/tools/debug/sharing/
   - Twitter: https://cards-dev.twitter.com/validator
   - WhatsApp: No API, but usually clears within 24-48 hours

4. **Test again** after deployment completes (wait 2-3 minutes)

---

## Key Files Modified

- [apps/frontend/app/track/[id]/layout.tsx](apps/frontend/app/track/[id]/layout.tsx) - Track metadata generation
- [apps/frontend/app/videos/[id]/layout.tsx](apps/frontend/app/videos/[id]/layout.tsx) - Video metadata generation
- [apps/frontend/app/api/og/track/[id]/route.tsx](apps/frontend/app/api/og/track/[id]/route.tsx) - Track OG image generation
- [apps/frontend/app/api/og/video/[id]/route.tsx](apps/frontend/app/api/og/video/[id]/route.tsx) - Video OG image generation

---

## If Issue Persists

After following this guide, if shares still show as naked links:

1. **Check backend data**: Verify `/api/v1/media/{id}` returns cover art URLs
2. **Check image accessibility**: Ensure cover art URLs are publicly accessible (test in incognito/private browser)
3. **Check Vercel caching**: Run full rebuild on Vercel (don't use git push)
4. **Check environment variables**: Ensure `NEXT_PUBLIC_BASE_URL` and `NEXT_PUBLIC_API_URL` are set correctly in production
5. **Check CORS headers**: Ensure backend is not blocking image requests from social platforms

---

## Summary

Your social media share previews should now work because:
1. ✅ Metadata is properly generated with descriptions (not empty)
2. ✅ IDs are correctly extracted from slugs (123 not "song-123")
3. ✅ Image URLs are absolute and accessible
4. ✅ Both OpenGraph and Twitter Card metadata are set
5. ✅ OG image routes generate valid images with cover art and play button

Follow the diagnostic steps above to verify everything is working correctly!
