# Complete Application Structure

## PUBLIC PAGES (No Authentication Required)

### Homepage & Marketing
1. **`/` (Homepage/Landing Page)**
   - Hero section
   - Part 1 free preview
   - Pricing cards
   - FAQ
   - CTA sections

2. **`/pricing` (Pricing Page)**
   - Essentials plan ($49)
   - Complete plan ($79)
   - Plan comparison

3. **`/help` (Help Center)**
   - Support resources

## AUTHENTICATION PAGES

### Sign In Flow
4. **`/login` (Sign In Page)**
   - Email input
   - Password input
   - "Forgot password?" link
   - → Redirects to `/learn` (Student Dashboard) on success

5. **`/signup` (Sign Up Page)**
   - Full name input
   - Email input
   - Password input
   - Confirm password input
   - → Redirects to `/learn` (Student Dashboard) on success

6. **`/forgot-password` (Password Reset Request)**
   - Email input
   - Sends reset email

7. **`/reset-password` (Password Reset Confirmation)**
   - New password input
   - Confirm password input

8. **`/verify-email` (Email Verification)**
   - Token verification from email link

### Sign Out Flow
9. **Sign Out Action**
   - API: `POST /api/auth/signout`
   - → Redirects to `/login`

## CHECKOUT & PAYMENT PAGES

10. **`/signup-checkout` (Combined Signup + Checkout)**
    - New user registration with payment
    - Query param: `?plan=essentials` or `?plan=complete`

11. **`/checkout` (Checkout for Existing Users)**
    - Purchase flow for logged-in users

12. **`/payment/success` (Payment Success Page)**
    - Confirmation after successful purchase

13. **`/upgrade` (Upgrade Page)**
    - Essentials → Complete upgrade flow

## STUDENT DASHBOARD & LEARNING PAGES

### Main Dashboard
14. **`/learn` (Student Dashboard)**
    - Welcome message
    - Current lesson progress card
    - Continue learning CTA
    - Course progress bar
    - All chapters (grouped by era)
    - All parts organized by era
    - Upgrade banner (Essentials users only)

15. **`/my-courses` (My Courses Page)**
    - List of purchased courses
    - Access to course content

### Individual Lesson Pages
16. **`/learn/part-1` through `/learn/part-100` (Individual Part Pages)**
    - Lesson content with tabs:
      - **Watch Tab** (Video + "Listen on the Go" audio player)
      - **Slides Tab** (Presented, Basic, Speaker Notes)
      - **Infographic Tab** (Illustrated, Graphic, Timeline)
      - **Read Tab** (Briefing, Study Guide, Facts, Deep Dive)
      - **Mindmap Tab** (Visual map)
      - **Flashcards Tab** (Easy, Medium, Hard decks)
      - **Quiz Tab** (Self-test)
    - Part navigation (Previous/Next)
    - Progress tracking

### Student Pages
17. **`/student/dashboard` (Legacy - Redirects to `/learn`)**

18. **`/student/resources` (Resources Library)**
    - Course materials
    - Downloads

19. **`/student/progress` (Progress Tracking)**
    - Completion statistics
    - Learning history

20. **`/student/settings` (Account Settings)**
    - Profile management
    - Password change
    - Preferences

21. **`/student/certificate` (Certificate Page)**
    - Completion certificate (if applicable)

22. **`/student/classes` (Classes Overview)**
    - Class enrollment (if using class system)

23. **`/student/classes/[classId]` (Individual Class Page)**

24. **`/student/classes/[classId]/lesson/[partNumber]` (Class Lesson)**

25. **`/student/classes/[classId]/quiz/[quizId]` (Class Quiz)**

26. **`/student/quizzes` (All Quizzes)**
    - Quiz history and results

27. **`/student/join` (Join a Class)**
    - Class enrollment form

## ADMIN PAGES (Platform Admin Only)

28. **`/admin/dashboard` (Admin Dashboard)**
29. **`/admin/users` (User Management)**
30. **`/admin/students` (Student Management)**
31. **`/admin/courses` (Course Management)**
32. **`/admin/programs` (Program Management)**
33. **`/admin/classes` (Class Management)**
34. **`/admin/content` (Content Management)**
35. **`/admin/course-templates` (Course Templates)**
36. **`/admin/orders` (Order Management)**
37. **`/admin/analytics` (Analytics Dashboard)**
38. **`/admin/support` (Support Tickets)**
39. **`/admin/settings` (Platform Settings)**
40. **`/admin/r2` (R2 Storage Management)**

## LEGACY/MEMBER PAGES (Backwards Compatibility)

41. **`/(member)/dashboard` (Legacy Dashboard)**
42. **`/(member)/parts` (Legacy Parts List)**
43. **`/(member)/parts/[partId]` (Legacy Part Page)**
44. **`/(member)/conclusion` (Course Conclusion)**

## UTILITY/SYSTEM PAGES

45. **`/post-login` (Redirect Handler)**
    - Checks user role
    - Redirects to appropriate dashboard:
      - Students → `/learn`
      - Platform Admin → `/admin/dashboard`

46. **`/change-password` (Change Password Page)**
    - Current password input
    - New password input

47. **`/get-started` (Getting Started Guide)**
    - Onboarding instructions

48. **`/courses` (Course Catalog)**
    - Browse available courses

---

## NAVIGATION: STUDENT SIDEBAR (Desktop & Mobile)

### Main Menu Section
- **Dashboard** → `/learn` (with LayoutDashboard icon)
- **My Courses** → `/my-courses` (with BookOpen icon)
- **Lessons** → `/learn` (with GraduationCap icon)
- **Resources** → `/student/resources` (with FolderOpen icon)
- **Progress** → `/student/progress` (with TrendingUp icon)
- **Help** → `/help` (with HelpCircle icon)

### Account Section
- **Settings** → `/student/settings` (with User icon)
- **Billing / Upgrade** → `/pricing` (with CreditCard icon)
- **Sign Out** → Signs out (with LogOut icon)

### Upgrade CTA (Essentials Users Only)
- Floating upgrade card in sidebar
- **Upgrade Now** button → `/pricing`

---

## NAVIGATION: STUDENT HEADER (Top Nav)

### Desktop Header Links
- **Home** → `/`
- **My Courses** → `/my-courses`
- **Pricing** → `/pricing`
- **Help** → `/help`
- **Upgrade** button → `/upgrade` (Essentials users only)

### Profile Dropdown Menu
- **My Account** → `/student/profile`
- **My Courses** → `/my-courses`
- **Billing / Upgrade** → `/pricing`
- **Settings** → `/student/settings`
- **Sign out** → Signs out and redirects to `/login`

### Mobile Header
- Hamburger menu with same links as desktop
- Collapsible navigation

---

## LESSON CONTENT TABS (Inside `/learn/part-X` pages)

### Main Modes
1. **Watch** (Primary - Video + Audio player)
2. **Slides** (Presented, Basic, Speaker Notes)
3. **Infographic** (Illustrated, Graphic, Timeline)
4. **Read** (Briefing, Study Guide, Facts, Deep Dive)
5. **Mindmap** (Visual map)
6. **Flashcards** (Easy, Medium, Hard)
7. **Quiz** (Self-test)

### "Listen on the Go" Audio Player
- Located under the video player in the "Watch" tab
- Collapsible audio player
- Play/pause, progress bar, skip -15s/+15s, playback speed controls

---

## ACCESS CONTROL

### Essentials Plan Access
- 75 parts (Parts included in `.includedInEssentials`)
- Watch (Video + Audio)
- Briefing
- Quiz

### Complete Plan Access
- All 100 parts
- Everything in Essentials PLUS:
- Slides (3 formats)
- Infographics (3 formats)
- Full Read section (Briefing, Study Guide, Facts, Deep Dive)
- Mindmaps
- Flashcards (3 difficulty levels)

### Quiz Lock Rules
- Essentials users: Quiz locked until video watched
- Complete users: Quiz locked until video watched
- Essentials completion: Video + Quiz only (other tabs optional)

---

## SIGN IN → SIGN OUT FLOW

### Sign In Process
1. User visits `/login`
2. Enters email + password
3. On success:
   - Session created in database
   - Session cookie set (`seerah_session`)
   - Redirected to role-specific home:
     - **Student** → `/learn` (Student Dashboard)
     - **Platform Admin** → `/admin/dashboard`

### Sign Out Process
1. User clicks "Sign Out" in:
   - Sidebar (main navigation)
   - Header dropdown
   - Mobile menu
2. Action: `POST /api/auth/signout`
3. Session deleted from database
4. Session cookie cleared
5. User redirected to `/login`

### Middleware Behavior
- Protected routes require session cookie
- If no session cookie:
  - User redirected to `/login?redirect=/original-path`
- If session cookie exists and user visits `/login`, `/signup`:
  - User redirected to `/post-login`
  - Which then redirects to their dashboard

---

## EXAMPLE: PART 1 FULL JOURNEY

### Signed Out User
1. Visit `/` (homepage)
2. See Part 1 free preview
3. Can interact with all Part 1 tabs without signing in
4. Click "Start Free Preview" → Scrolls to Part 1 preview section
5. Click "View Pricing" → Scrolls to pricing section
6. Click "Unlock Complete Seerah" → `/signup-checkout?plan=complete`

### New User Signup
1. Visit `/signup` or `/signup-checkout?plan=complete`
2. Fill form: Full Name, Email, Password, Confirm Password
3. On success:
   - Account created
   - Auto-logged in (session created)
   - Redirected to `/learn` (Student Dashboard)
4. See welcome message, progress card, and all chapters

### Returning User Login
1. Visit `/login`
2. Enter email + password
3. On success:
   - Session created
   - Redirected to `/learn`
4. See "Continue where you left off" card with current part
5. Click "Continue Lesson" → `/learn/part-X` (where X = current part)

### Learning a Lesson
1. On `/learn/part-1`:
   - Default tab: **Watch** (video player + "Listen on the Go" audio)
   - Click through tabs: Slides, Infographic, Read, Mindmap, Flashcards, Quiz
   - Progress auto-tracked
2. Complete quiz
3. Unlock next part
4. Return to `/learn` to see updated progress

### Sign Out
1. Click "Sign Out" in sidebar or header
2. Redirected to `/login`
3. Session cleared

---

## SUMMARY OF KEY PAGES (Sequential Order)

1. `/` - Homepage
2. `/login` - Sign in
3. `/signup` - Create account
4. `/post-login` - Redirect handler
5. `/learn` - Student dashboard (main hub after login)
6. `/learn/part-1` - Lesson 1
7. `/learn/part-2` - Lesson 2
... (continues for all 100 parts)
8. `/my-courses` - My purchased courses
9. `/student/resources` - Resources library
10. `/student/progress` - Progress tracking
11. `/student/settings` - Account settings
12. `/pricing` - Pricing & upgrade
13. `/help` - Help center
14. Sign Out → back to `/login`

---

## NOTES
- All part pages (`/learn/part-1` through `/learn/part-100`) share the same structure
- "Listen on the Go" audio player appears in the "Watch" tab, below the video
- Sidebar persists across all student pages
- Header persists across all pages
- Quiz completion unlocks next part (for parts included in user's plan)
