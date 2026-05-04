# Route Restructure: /learn → /seerah

## Overview
Changed from generic `/learn` route to course-specific `/seerah` route. This prepares the platform for multiple courses in the future.

## Route Changes

### Before → After

| Old Route | New Route | Purpose |
|-----------|-----------|---------|
| `/learn` | `/seerah` | Seerah course dashboard |
| `/learn/[partId]` | `/seerah/[partId]` | Individual Seerah lesson |
| `/learn` | redirects to `/my-courses` | Backward compatibility |
| `/learn/[partId]` | redirects to `/seerah/[partId]` | Backward compatibility |

## Why This Change?

### Problem
- `/learn` was too generic
- Doesn't scale for multiple courses
- All courses would share same route

### Solution
- Course-specific routes: `/seerah`, `/hadith`, `/fiqh`, etc.
- Each course gets its own namespace
- Clearer URL structure

## Files Changed

### New Route Files
1. **`app/seerah/page.tsx`** - Seerah course dashboard (moved from `app/learn/page.tsx`)
2. **`app/seerah/[partId]/page.tsx`** - Individual Seerah lessons (moved from `app/learn/[partId]/page.tsx`)

### Redirect Files
1. **`app/learn/page.tsx`** - Redirects to `/my-courses`
2. **`app/learn/[partId]/page.tsx`** - Redirects to `/seerah/[partId]`

### Updated Navigation Links
1. **`app/my-courses/page.tsx`** - Course link: `/learn` → `/seerah`
2. **`app/help/page.tsx`** - Dashboard link: `/learn` → `/seerah`
3. **`app/verify-email/page.tsx`** - Redirect: `/learn` → `/my-courses`
4. **`app/(auth)/signup/page.tsx`** - Post-signup: `/learn` → `/my-courses`
5. **`app/student/certificate/page.tsx`** - Continue learning: `/learn` → `/seerah`
6. **`app/not-found.tsx`** - Dashboard link: `/learn` → `/my-courses`
7. **`app/payment/success/page.tsx`** - Start learning: `/learn` → `/my-courses`
8. **`lib/roles.ts`** - Student home: `/learn` → `/my-courses`

### Component Updates
- **`app/seerah/[partId]/page.tsx`** - Back links and navigation now use `/seerah`

## User Flow Impact

### Student Login
**Before:** Login → `/learn` (Seerah dashboard)  
**After:** Login → `/my-courses` → Click course → `/seerah` (Seerah dashboard)

This is better because:
- Students see all their courses first
- Can choose which course to access
- Prepares for multiple course offerings

### Email Verification
**Before:** Verify → `/learn`  
**After:** Verify → `/my-courses`

### Payment Success
**Before:** Payment → `/learn`  
**After:** Payment → `/my-courses`

### Direct Access
**Before:** Visit `/learn` → Seerah dashboard  
**After:** Visit `/learn` → Redirects to `/my-courses`

## Backward Compatibility

Old URLs automatically redirect:
- `themuslimman.com/learn` → `themuslimman.com/my-courses`
- `themuslimman.com/learn/part-1` → `themuslimman.com/seerah/part-1`

No broken links! ✅

## Future Course Structure

Now we can easily add more courses:

```
/seerah         - Seerah course dashboard
/seerah/part-1  - Seerah lesson 1

/hadith         - Hadith course dashboard (future)
/hadith/lesson-1 - Hadith lesson 1 (future)

/fiqh           - Fiqh course dashboard (future)
/fiqh/topic-1   - Fiqh topic 1 (future)

/arabic         - Arabic course dashboard (future)
/arabic/level-1 - Arabic level 1 (future)
```

Each course gets its own namespace and dashboard.

## Database Impact

**No database changes required.** This is purely a routing/URL restructure.

## Testing Checklist

- [x] Login redirects to `/my-courses`
- [x] Course card links to `/seerah`
- [x] Lesson pages use `/seerah/[partId]`
- [x] Back button from lesson goes to `/seerah`
- [x] Next/Previous navigation uses `/seerah/[partId]`
- [x] Old `/learn` redirects to `/my-courses`
- [x] Old `/learn/[partId]` redirects to `/seerah/[partId]`
- [x] Payment success goes to `/my-courses`
- [x] Email verification goes to `/my-courses`
- [x] Help page links work
- [x] Certificate page links work
- [x] 404 page links work

## Benefits

1. **Scalability** - Easy to add new courses
2. **Clarity** - URL tells you which course you're in
3. **Organization** - Each course has its own namespace
4. **SEO** - Course-specific URLs are better for search
5. **Flexibility** - Different courses can have different structures

## Migration Notes

**For Developers:**
- Always use `/seerah` for Seerah course links
- Never use `/learn` in new code
- Future courses should follow: `/[course-name]`

**For Users:**
- Completely transparent
- Old bookmarks still work (redirect)
- No action required

---

**Deployment:**
✅ Committed: `27edaec`
✅ Pushed: GitHub main branch
✅ Vercel: Automatic deployment
✅ Backward compatible: Old URLs redirect
