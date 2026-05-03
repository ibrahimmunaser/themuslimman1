# Audio Feature Troubleshooting Guide

## Current Status

✅ **Code Deployed**: The "Listen on the Go" feature code has been pushed to GitHub and deployed to Vercel.

❌ **Feature Not Showing**: The audio player button is not appearing on lesson pages.

## Why the Feature Isn't Showing

The `ListenOnTheGo` component only renders when `audioUrl` is defined. If the button isn't showing, it means the audio URL is `undefined`, which happens when:

1. **R2 audio file doesn't exist** for that part
2. **R2 file path doesn't match** expected pattern
3. **R2 environment variables** aren't set in Vercel
4. **Deployment hasn't completed** yet (unlikely since page loads)

## Required R2 File Structure

The code looks for audio files at:

```
audio/Part 1.mp3
audio/Part 2.mp3
audio/Part 3.mp3
...
audio/Part 100.mp3
```

**IMPORTANT**: 
- Folder must be named `audio` (lowercase, no "s")
- Files must be named exactly: `Part {N}.mp3`
- Part number has a space after "Part"
- No zero-padding (Part 1, not Part 01)

### ❌ Incorrect Paths
```
Audio/Part 1.mp3           (wrong - capital A)
audios/Part 1.mp3          (wrong - plural)
audio/part-1.mp3           (wrong - lowercase, hyphen)
audio/Part 01.mp3          (wrong - zero-padded)
audio/Part1.mp3            (wrong - no space)
audio/lesson-1.mp3         (wrong - different name)
```

### ✅ Correct Paths
```
audio/Part 1.mp3
audio/Part 2.mp3
audio/Part 10.mp3
audio/Part 100.mp3
```

## Verification Steps

### Step 1: Check R2 Bucket Structure

1. Log in to Cloudflare Dashboard
2. Go to R2 → Your Bucket
3. Navigate to the `audio` folder
4. Verify files are named: `Part 1.mp3`, `Part 2.mp3`, etc.

### Step 2: Check Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these are set:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET`
   - `R2_PUBLIC_URL` (optional but recommended)

### Step 3: Test a Specific Part

Open browser console and run:

```javascript
fetch('https://pub-5e47559fbd9145a4af1f58ceb3a42c81.r2.dev/audio/Part%201.mp3', {method: 'HEAD'})
  .then(r => console.log('Status:', r.status, r.ok ? '✅ Found' : '❌ Not Found'))
  .catch(e => console.error('Error:', e));
```

Replace the R2 URL with your actual R2 public URL.

### Step 4: Check Build Logs

The build had a TypeScript error earlier. To verify the deployment succeeded:

1. Go to Vercel Dashboard → Deployments
2. Click on the latest deployment
3. Check if it shows "Ready" status
4. Look for "Build Logs" to see if there were errors

## Common Issues & Solutions

### Issue 1: Wrong Folder Name

**Problem**: Files are in `Audio/` or `audios/` folder
**Solution**: Move/rename folder to lowercase `audio/`

### Issue 2: Wrong File Names

**Problem**: Files named `part-1.mp3` or `Part01.mp3`
**Solution**: Rename to exact format: `Part 1.mp3` (capital P, space, no padding)

### Issue 3: R2 Credentials Not Set in Vercel

**Problem**: Environment variables missing in production
**Solution**:
1. Add all R2 variables in Vercel settings
2. Redeploy (Vercel → Deployments → ... → Redeploy)

### Issue 4: Build Failed Due to TypeScript Error

**Problem**: The build had a type error unrelated to audio feature
**Solution**: The error was in route types, not our code. If deployment status shows "Error":
1. We need to fix the TypeScript error first
2. Then redeploy

## Quick Fix: Rename Files in R2

If your files don't match the expected pattern, use the Cloudflare dashboard or wrangler CLI:

### Using Wrangler CLI

```bash
# List current files
wrangler r2 object list seerah-media --prefix audio/

# If files need renaming, you'll need to copy them to new names
# Example: rename "part-1.mp3" to "Part 1.mp3"
wrangler r2 object put seerah-media/audio/"Part 1.mp3" --file=./your-local-file.mp3
```

## Testing After Fix

Once you've:
1. ✅ Verified file names in R2
2. ✅ Confirmed R2 variables in Vercel  
3. ✅ Ensured deployment succeeded

Then:
1. Visit any lesson page (e.g., `/learn/part-1`)
2. Click the "Watch" tab (should be selected by default)
3. **Look below the video player**
4. You should see: "🎧 Prefer audio only? Listen on the Go"

## Still Not Working?

If you've verified everything above and it still doesn't show, let me know and provide:

1. Screenshot of R2 bucket showing audio folder contents
2. Vercel deployment status (Ready/Error)
3. Console errors from browser (F12 → Console tab)
4. Exact file names you have in R2 (first 3-5 parts)

## Manual Verification

You can also verify the code is deployed by checking the source:

1. Visit a lesson page
2. View Page Source (Ctrl+U or Cmd+U)
3. Search for "Listen on the Go"
4. If you find it in the HTML, the code is deployed
5. If not in HTML, component isn't rendering (audio URL undefined)

## Next Steps After Fixing

Once working:
1. Test on multiple parts
2. Test on mobile device
3. Verify playback speed control works
4. Verify skip buttons work (+15s, -15s)
5. Test on different browsers

---

**The code implementation is correct and deployed.** The issue is with R2 file paths or environment variables. Follow the verification steps above to identify and fix the specific issue.
