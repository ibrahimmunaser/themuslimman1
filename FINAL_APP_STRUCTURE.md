# TheMuslimMan Seerah Platform - Final App Structure

**Product Focus:** Simple student-first flow for individual learners purchasing and completing the Seerah course.

---

## PUBLIC PAGES

### 1. `/` (Homepage)
**Purpose:** Landing page with Part 1 free preview

**Contents:**
- Course promise and value proposition
- Pricing CTA
- Login/Signup buttons
- Part 1 preview lesson section (full access, no signup required)

---

### 2. `/pricing`
**Purpose:** Pricing plans comparison

**Plans:**
- **Essentials** ($49) - 75 parts, video + audio + briefing + quiz
- **Complete** ($79) - All 100 parts, full mastery system

---

### 3. `/help`
**Purpose:** Support information and help center

---

## AUTH PAGES

### 1. `/login`
**Purpose:** Sign in page

**Redirect Logic After Login:**
- ✅ User has access → `/learn`
- ❌ User has no purchase → `/pricing`

---

### 2. `/signup`
**Purpose:** Create account page

**Redirect Logic After Signup:**
- If email verification enabled → send verification email
- Redirect based on payment/access status:
  - Has purchase → `/learn`
  - No purchase → `/pricing`

---

### 3. `/forgot-password`
**Purpose:** Password reset request

---

### 4. `/reset-password`
**Purpose:** New password page

---

### 5. `/verify-email`
**Purpose:** Email confirmation page

---

### 6. `/signout`
**Purpose:** Sign out action
- Clear session
- Redirect to `/login`

---

## PAYMENT PAGES

### 1. `/signup-checkout`
**Purpose:** Combined signup and payment flow for new users
- Create account + purchase in one flow
- Query params: `?plan=essentials` or `?plan=complete`

---

### 2. `/checkout`
**Purpose:** Payment page for existing logged-in users
- For users who want to purchase after creating account

---

### 3. `/payment/success`
**Purpose:** Payment confirmation page
- Provision access to purchased plan
- Redirect to `/learn`

---

### 4. `/upgrade`
**Purpose:** Essentials to Complete upgrade page
- Pay difference only ($30)
- Essentials users only

---

## STUDENT PAGES

### 1. `/learn` (Main Student Dashboard)
**Purpose:** Primary hub after login

**Contents:**
- Welcome message with user's name
- Current plan badge (Essentials or Complete)
- "Continue learning" button (shows current lesson)
- Current lesson progress bar
- All chapters grouped by era
- Part cards with lock/unlock status
- Upgrade banner (Essentials users only)

---

### 2. `/learn/part-1` through `/learn/part-100` (Individual Lessons)
**Purpose:** Lesson content pages

**Tab Structure:**

#### **Watch Tab** (Primary)
- Main video player
- **"Listen on the Go"** audio player (under/near video)
  - Collapsible: "Prefer audio only? Listen on the Go"
  - Copy: "Same lesson, lighter and easier to review when you do not want to watch the screen."
  - MP3 audio from Cloudflare R2
  - Controls: Play/pause, progress bar, current time/duration, back 15s, forward 15s, playback speed

#### **Slides Tab**
- Presented slides
- Detailed slides
- Facts slides

#### **Infographic Tab**
- Infographic 1
- Infographic 2
- Infographic 3

#### **Read Tab**
- Briefing
- Study Guide
- Statement of Facts
- Report / Deep Dive

#### **Mindmap Tab**
- Visual mind map

#### **Flashcards Tab**
- Easy deck
- Medium deck
- Hard deck

#### **Quiz Tab**
- Self-test quiz

---

### 3. `/my-courses`
**Purpose:** Show purchased courses

**Logic:**
- If user owns Complete Seerah → show course
- If user owns Essentials → show course
- If user owns no course → redirect to `/pricing`

---

### 4. `/student/resources`
**Purpose:** Resources library
- All resources the user has access to based on their plan

---

### 5. `/student/progress`
**Purpose:** Progress tracking page
- Completion statistics
- Learning history
- Streak tracking

---

### 6. `/student/settings`
**Purpose:** Account settings
- Profile management
- Password change
- Email preferences
- Account preferences

---

### 7. `/student/certificate`
**Purpose:** Completion certificate
- Show certificate when course is completed

---

## ACCESS RULES

### Free User (No Purchase)
**Can Access:**
- Public pages (`/`, `/pricing`, `/help`)
- Part 1 free preview only (full access to all Part 1 tabs)

**Cannot Access:**
- Part 2-100
- Dashboard without purchase

**UX for Locked Content:**
- Show upgrade CTA
- Redirect to `/pricing` if trying to access `/learn`

---

### Essentials User ($49 Plan)
**Can Access:**
- 75 parts (those marked as `includedInEssentials: true`)
- **Watch** (Video)
- **Listen on the Go** (Audio)
- **Briefing** (in Read tab)

**Cannot Access:**
- Quiz ❌
- Flashcards ❌
- Mindmaps ❌
- Infographics ❌
- Full Slides ❌
- Study Guides ❌
- Reports ❌
- Statement of Facts ❌

**UX for Locked Tabs:**
- Tabs remain visible but disabled
- Show lock icon 🔒
- Show upgrade CTA when clicked
- Message: "Unlock this with Complete Seerah. Upgrade now for just $30 more."

**Progress/Completion Rules:**
- Essentials completion does NOT require quizzes
- Progress is based on: Video watched + Briefing read
- Quiz is locked and not required for progress

---

### Complete User ($79 Plan)
**Can Access:**
- ✅ All 100 parts
- ✅ All tabs and content types
- ✅ Everything unlocked

**Progress/Completion Rules:**
- Can complete quizzes for mastery
- Progress can include quiz scores and flashcard reviews

---

## STUDENT SIDEBAR NAVIGATION

### Main Menu Section
- 📊 **Dashboard** → `/learn`
- 📚 **My Courses** → `/my-courses`
- 🎓 **Lessons** → `/learn`
- 📁 **Resources** → `/student/resources`
- 📈 **Progress** → `/student/progress`
- ❓ **Help** → `/help`

### Account Section
- ⚙️ **Settings** → `/student/settings`
- 💳 **Billing / Upgrade** → (dynamic destination)
  - **Essentials users** → `/upgrade`
  - **Free users** → `/pricing`
  - **Complete users** → `/student/settings` (billing section)
- 🚪 **Sign Out** → Clear session → `/login`

---

## ADMIN PAGES

**Note:** Admin pages exist but are NOT prioritized over student experience.

### Admin Routes (Deprioritized)
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/courses` - Course management
- `/admin/lessons` - Lesson content management
- `/admin/payments` - Payment and order management
- `/admin/analytics` - Usage analytics
- `/admin/support` - Support ticket management

**Access:** Platform admin role only

---

## WHAT WE ARE NOT BUILDING (Important Product Decision)

❌ **No class/teacher/organization pages** unless specifically requested later.

This means:
- No `/student/classes`
- No teacher dashboard
- No organization admin
- No classroom features
- No group enrollment

**Focus:** Individual students buying and learning the Seerah course.

---

## SIGN IN / SIGN OUT FLOW

### Sign In Flow
1. User visits `/login`
2. Enters email + password
3. Server validates credentials
4. If valid:
   - Create session
   - Set session cookie
   - **Check access:**
     - Has purchase → redirect to `/learn`
     - No purchase → redirect to `/pricing`
5. If invalid:
   - Show error message
   - Stay on `/login`

### Sign Out Flow
1. User clicks "Sign Out" (sidebar or header)
2. Action: `POST /api/auth/signout`
3. Server:
   - Delete session from database
   - Clear session cookie
4. Redirect to `/login`

---

## EXAMPLE USER JOURNEY

### New User Journey (Complete Plan)
1. Visit `/` (homepage)
2. See Part 1 free preview (can interact with all tabs)
3. Click "Unlock Complete Seerah" → `/signup-checkout?plan=complete`
4. Fill signup form + payment details
5. Payment success → account created + purchase recorded
6. Redirect to `/learn` (dashboard)
7. See all 100 parts unlocked
8. Click "Part 1" → `/learn/part-1`
9. Watch video, read briefing, take quiz
10. Progress tracked automatically
11. Continue through parts sequentially

### Existing Essentials User (Wants to Upgrade)
1. Login → redirected to `/learn`
2. See "Upgrade to Complete" banner in dashboard
3. Click "Upgrade Now" in sidebar → `/upgrade`
4. Pay $30 difference
5. Payment success → access upgraded to Complete
6. Return to `/learn` with all parts unlocked
7. All previously locked tabs now accessible

### Free User (No Purchase)
1. Visit `/` (homepage)
2. Try Part 1 free preview (full access)
3. Click on Part 2 → Blocked
4. Redirect to `/pricing` with message: "Unlock the full course"
5. Choose plan and purchase
6. After payment → redirect to `/learn` with access

---

## KEY TECHNICAL NOTES

### Access Control Implementation
- Check user's plan in database (`Purchase` table)
- For each part, check `includedInEssentials` flag
- For each tab/content type, check user's plan tier
- Lock content client-side AND server-side (API routes)

### Audio Player (Listen on the Go)
- Located in Watch tab, under video player
- Source: Cloudflare R2 bucket (`audio/Part X.mp3` or `audio/Part X (1).mp3`)
- Component: `<ListenOnTheGo>`
- Collapsible UI, mobile-friendly
- No separate "Audio" tab - it's part of "Watch"

### Progress Tracking
- Essentials: Video watched + Briefing read = completion
- Complete: Video + Briefing + Quiz (optional: flashcards, other tabs)
- Stored in `PartProgress` table
- Real-time updates

### Part Locking Logic
- If user has no purchase → All parts locked except Part 1
- If user has Essentials → Parts 1-75 unlocked (where `includedInEssentials: true`)
- If user has Complete → All 100 parts unlocked
- Locked parts show lock icon in dashboard list

### Tab Locking Logic (Essentials Users)
- Watch tab → ✅ Unlocked
- Listen on the Go → ✅ Unlocked (inside Watch tab)
- Briefing (in Read tab) → ✅ Unlocked
- All other tabs → 🔒 Locked but visible
  - Show lock icon
  - On click → Show upgrade modal/banner
  - Message: "Upgrade to Complete for $30 to unlock [tab name]"

---

## SUMMARY

**This is the final app structure.** All future development should follow this specification.

**Core Principles:**
1. Student-first experience
2. Simple, linear learning path
3. Clear upgrade path (Free → Essentials → Complete)
4. No classroom/organization complexity
5. Focus on individual learners mastering the Seerah

**Primary Flow:**
`/` → `/signup-checkout` → `/learn` → `/learn/part-X` → Progress → Completion → `/student/certificate`

**Purchase Flow:**
Free → See Part 1 → Buy → Access unlocked → Learn

**Upgrade Flow:**
Essentials → Use product → See locked content → Upgrade → Complete access
