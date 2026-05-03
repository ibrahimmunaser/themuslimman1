# Implementation Checklist - Final App Structure

## Changes Needed to Match Final Specification

---

## 🔴 CRITICAL CHANGES (Required for Launch)

### 1. Login Redirect Logic
**Current:** Always redirects to `/learn` after login
**Required:** Check if user has purchase
- ✅ Has purchase → `/learn`
- ❌ No purchase → `/pricing`

**Files to modify:**
- `app/(auth)/login/page.tsx` - Add purchase check before redirect
- `lib/auth.ts` - Add function to check user purchases

---

### 2. Essentials Access Rules - MAJOR CHANGE
**Current:** Essentials users can access quizzes
**Required:** Essentials users CANNOT access quizzes

**Essentials users can ONLY access:**
- ✅ Watch tab (Video)
- ✅ Listen on the Go (Audio player)
- ✅ Briefing (in Read tab)

**Essentials users CANNOT access:**
- ❌ Quiz
- ❌ Flashcards
- ❌ Mindmaps
- ❌ Infographics
- ❌ Full Slides
- ❌ Study Guides
- ❌ Reports
- ❌ Statement of Facts

**Files to modify:**
- `lib/content.ts` - Update access control logic
- `components/part/part-tabs.tsx` - Update tab locking logic
- `app/learn/part-[partId]/page.tsx` - Update available tabs based on plan

---

### 3. Locked Tabs UX
**Current:** Locked tabs are hidden or show error
**Required:** Locked tabs remain visible but disabled
- Show lock icon 🔒
- On click → Show upgrade CTA
- Message: "Unlock this with Complete Seerah. Upgrade now for just $30 more."

**Files to modify:**
- `components/part/part-tabs.tsx` - Keep tabs visible, add lock icon
- Create: `components/student/upgrade-modal.tsx` - Upgrade CTA modal

---

### 4. Essentials Progress/Completion Rules
**Current:** May require quiz completion
**Required:** Essentials completion does NOT require quizzes
- Progress is based on: Video watched + Briefing read
- Quiz is locked and not required

**Files to modify:**
- `lib/progress.ts` (or similar) - Update completion logic
- `app/learn/page.tsx` - Update progress calculation
- Database queries for `PartProgress` table

---

### 5. Sidebar "Billing / Upgrade" Link - Dynamic Destination
**Current:** Always goes to `/pricing`
**Required:** Dynamic based on user plan
- **Essentials users** → `/upgrade`
- **Free users** → `/pricing`
- **Complete users** → `/student/settings` (billing section)

**Files to modify:**
- `components/student/student-sidebar.tsx` - Add conditional logic for "Billing / Upgrade" href

---

### 6. My Courses Page - Redirect if No Purchase
**Current:** Shows page even if no purchases
**Required:** Redirect to `/pricing` if user owns no course

**Files to modify:**
- `app/my-courses/page.tsx` - Add purchase check and redirect

---

### 7. Signup Redirect Logic
**Current:** Redirects to `/learn` after signup
**Required:** Redirect based on payment/access status
- Has purchase → `/learn`
- No purchase → `/pricing` or stay on page (if verification needed)

**Files to modify:**
- `app/(auth)/signup/page.tsx` - Update redirect logic
- `app/api/auth/signup-student/route.ts` - Check purchase status before redirect

---

## 🟡 MEDIUM PRIORITY CHANGES (Improve UX)

### 8. Remove/Hide Class/Teacher Pages
**Current:** These pages exist and are accessible
**Required:** Hide or remove these pages
- `/student/classes`
- `/student/classes/[classId]`
- `/student/classes/[classId]/lesson/[partNumber]`
- `/student/classes/[classId]/quiz/[quizId]`
- `/student/join`

**Action:**
- Option A: Delete these pages
- Option B: Add redirect to `/learn` with 404
- Update sidebar to remove "Classes" link if it exists

---

### 9. Free User Access Control
**Current:** May allow access beyond Part 1
**Required:** Free users can ONLY access Part 1 preview
- All other parts redirect to `/pricing`
- Show "Unlock the full course" message

**Files to modify:**
- Middleware or route handlers for `/learn/part-X` pages
- Add free user check before rendering content

---

### 10. Dashboard Upgrade Banner (Essentials Only)
**Current:** May show for all users or not at all
**Required:** Show upgrade banner ONLY for Essentials users
- Not shown for Free users (they can't access dashboard)
- Not shown for Complete users (they have everything)

**Files to modify:**
- `app/learn/page.tsx` - Conditional upgrade banner rendering

---

## 🟢 LOW PRIORITY / POLISH

### 11. Part 1 Free Preview (Homepage)
**Current:** Exists
**Required:** Ensure it's fully accessible without signup
- All tabs should work for Part 1 on homepage
- No login required

**Files to check:**
- `app/page.tsx` - Verify Part 1 preview component
- `components/landing/part1-full-preview.tsx`

---

### 12. Locked Content Upgrade CTAs
**Current:** Generic or missing
**Required:** Clear, compelling upgrade CTAs
- "Upgrade to Complete for $30 to unlock [feature]"
- "Essentials plan does not include [feature]. Upgrade now."

**Files to create/modify:**
- `components/student/upgrade-cta-banner.tsx`
- `components/student/locked-tab-message.tsx`

---

### 13. Student Certificate Page
**Current:** May not be implemented
**Required:** Show certificate when course completed

**Files to check:**
- `app/student/certificate/page.tsx`

---

### 14. Help Page Content
**Current:** May be placeholder
**Required:** Basic help content and support information

**Files to check:**
- `app/help/page.tsx`

---

## 📋 VERIFICATION CHECKLIST

After implementing changes, verify:

### User Flows
- [ ] Free user can view Part 1 on homepage (no signup)
- [ ] Free user redirects to /pricing when trying to access /learn
- [ ] New user signup → redirects based on purchase status
- [ ] Login with no purchase → redirects to /pricing
- [ ] Login with purchase → redirects to /learn
- [ ] Essentials user sees locked tabs with upgrade CTA
- [ ] Essentials user CANNOT access quiz
- [ ] Essentials progress does NOT require quiz
- [ ] Complete user sees all tabs unlocked
- [ ] Upgrade from Essentials → Complete works ($30)
- [ ] "Billing / Upgrade" sidebar link destination is correct per plan
- [ ] Sign out → clears session → redirects to /login
- [ ] /my-courses redirects to /pricing if no purchase

### Content Access
- [ ] Part 1 free preview: all tabs accessible
- [ ] Essentials: Watch, Audio, Briefing only
- [ ] Complete: All tabs accessible
- [ ] Locked tabs show lock icon and upgrade CTA

### Navigation
- [ ] Sidebar links work correctly
- [ ] Header navigation works
- [ ] Mobile navigation works
- [ ] Breadcrumbs/back buttons work

### Progress Tracking
- [ ] Essentials completion: Video + Briefing
- [ ] Complete completion: Video + Briefing + Quiz (optional)
- [ ] Progress bar updates correctly
- [ ] "Continue learning" button shows correct lesson

---

## IMPLEMENTATION ORDER

**Phase 1: Critical Access Control**
1. Fix Essentials quiz access (remove quiz from Essentials)
2. Update login redirect logic (check purchase)
3. Update locked tabs UX (show but disabled)
4. Fix Essentials progress rules (no quiz required)

**Phase 2: Navigation & Redirects**
5. Fix "Billing / Upgrade" sidebar link (dynamic)
6. Fix /my-courses redirect (no purchase → /pricing)
7. Fix signup redirect logic (based on access)
8. Hide/remove class pages

**Phase 3: Polish & UX**
9. Upgrade CTAs and messaging
10. Dashboard upgrade banner (Essentials only)
11. Free user access control
12. Help page content

---

## CURRENT STATUS

**What's Already Working:**
✅ Audio player ("Listen on the Go") in Watch tab
✅ Basic tab structure for lessons
✅ Student dashboard (`/learn`)
✅ Pricing page
✅ Login/Signup flows (but redirects need fixing)
✅ Part 1 free preview on homepage
✅ Sidebar navigation structure

**What Needs Fixing:**
❌ Essentials quiz access (MAJOR - they shouldn't have it)
❌ Login redirect (doesn't check purchase)
❌ Locked tabs UX (should be visible but disabled)
❌ Progress rules (Essentials shouldn't require quiz)
❌ Billing/Upgrade link (not dynamic)
❌ Class pages (should be hidden)

---

## NOTES

- All changes should prioritize the student experience
- Test thoroughly with different user types (Free, Essentials, Complete)
- Ensure mobile responsiveness for all changes
- Keep admin pages but don't prioritize their functionality
- Focus on the linear learning path: signup → purchase → learn → complete
