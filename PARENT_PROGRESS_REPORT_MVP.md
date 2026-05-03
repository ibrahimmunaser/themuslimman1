# Parent Progress Report MVP

## Overview
A lightweight parent progress report feature that allows parents to receive automated email updates about their child's Seerah learning progress.

## Features Implemented

### 1. Signup Flow Enhancement
**File**: `app/(auth)/signup/page.tsx`

Added "Who is this course for?" section with three options:
- **Myself**: Standard individual learning
- **My child**: Parent enrolling a child
- **My family**: For multiple family members

When "My child" or "My family" is selected, additional fields appear:
- Student name (required)
- Parent/Guardian email (optional)
- Weekly progress reports checkbox (optional)

### 2. Database Schema Updates
**File**: `prisma/schema.prisma`

Added four new fields to the `User` model:
```prisma
courseFor         String   @default("myself") // "myself" | "my_child" | "my_family"
studentName       String?  // Child's name if course is for a child
parentEmail       String?  // Parent/Guardian email for progress reports
sendWeeklyReports Boolean  @default(false) // Toggle for weekly progress emails
```

### 3. Settings Page - Parent Reports Section
**File**: `app/student/settings/page.tsx`

Displays parent report configuration (read-only):
- Student name
- Parent/Guardian email
- Report frequency (Weekly)
- Status indicator (ON/OFF)
- Note: Updates require contacting support

Only shown if `courseFor` is "my_child" or "my_family"

### 4. Progress Page - Send Report Button
**Files**: 
- `components/course/send-progress-report-button.tsx` (new)
- `components/course/course-progress-content.tsx` (updated)
- `app/learn/page.tsx` (updated)

Added "Send Progress Report" button that:
- Only shows if parent email is configured
- Sends report immediately via API
- Shows success/error feedback
- Includes Mail icon and loading state

### 5. Email Template
**File**: `lib/emails/parent-progress-report.tsx` (new)

Beautiful, parent-friendly HTML email with:

#### For Essentials Users:
- Lessons watched
- Briefings read
- Study time
- Current lesson
- Suggested next lesson
- Progress bar and percentage
- Encouraging message

#### For Complete Users (adds):
- Quiz scores and attempts
- Flashcards reviewed
- Weak areas based on missed quiz questions
- Strong areas
- Recommended review lessons
- Certificate progress

### 6. Send Progress Report API
**File**: `app/api/student/send-progress-report/route.ts` (new)

POST endpoint that:
1. Verifies user has parent email configured
2. Fetches user's progress data from database
3. Calculates all stats (lessons, briefings, quizzes, etc.)
4. Generates personalized email using template
5. Sends via Resend API
6. Returns success/error response

## Access Logic

### Basic Reports (Essentials & Complete)
- Lessons watched
- Briefings read
- Study time
- Current lesson
- Progress percentage

### Detailed Academic Reports (Complete Only)
- Quiz scores and attempts
- Flashcards reviewed
- Weak/strong areas
- Recommended review lessons
- Certificate progress

### For Essentials Users
Reports do NOT mention:
- Quizzes (locked for Essentials)
- Flashcards (Complete-only)
- Advanced mastery tools

## Email Subject Format
`{studentName}'s Weekly Seerah Progress Report`

Example: "Ahmed's Weekly Seerah Progress Report"

## Key Design Decisions

1. **Parent email is optional** - Adult learners can use the course without entering parent info
2. **Settings are read-only** - Simplifies MVP; updates require support contact
3. **Manual send button** - Allows parents to test reports on-demand
4. **Plan-aware content** - Email automatically shows appropriate stats based on user's plan
5. **Lightweight MVP** - No parent portal, classroom features, or teacher accounts yet

## Future Enhancements (Not in MVP)

- [ ] Automated weekly report scheduling
- [ ] Editable parent settings in Settings page
- [ ] Parent portal for viewing progress online
- [ ] Classroom/organization features
- [ ] Teacher accounts
- [ ] Multiple children per parent account
- [ ] Customizable report frequency
- [ ] Report history/archive

## Files Changed

### New Files
1. `components/course/send-progress-report-button.tsx` - Button component for sending reports
2. `lib/emails/parent-progress-report.tsx` - HTML email template
3. `app/api/student/send-progress-report/route.ts` - API endpoint for sending reports

### Modified Files
1. `prisma/schema.prisma` - Added parent report fields to User model
2. `app/(auth)/signup/page.tsx` - Added "Who is this course for?" section
3. `app/api/auth/signup-student/route.ts` - Store parent report settings
4. `app/student/settings/page.tsx` - Added Parent Reports section
5. `components/course/course-progress-content.tsx` - Added send report button
6. `app/learn/page.tsx` - Pass parent data to progress content

## Testing the Feature

### 1. Test Signup Flow
1. Go to `/signup`
2. Select "My child" or "My family"
3. Fill in student name and parent email
4. Check "Send weekly progress reports"
5. Complete signup

### 2. Test Settings Display
1. Log in as a user with parent email configured
2. Go to Settings page
3. Verify "Parent Progress Reports" section shows
4. Confirm student name, parent email, and status display correctly

### 3. Test Send Report
1. Go to Progress tab in course dashboard
2. Click "Send Progress Report" button
3. Check parent email inbox for progress report
4. Verify email contains appropriate stats based on plan (Essentials vs Complete)

### 4. Test Email Content
- Essentials: Should show lessons, briefings, study time (no quizzes)
- Complete: Should show all stats including quizzes, flashcards, etc.

## Notes

- Feature fully respects plan-based access control
- Parent email collection happens during signup
- Reports can be sent manually on-demand
- Settings display is informational only (no editing yet)
- Email uses professional, parent-friendly language
- Progress calculations are approximate for MVP (can be refined later)

## Deployment

✅ Committed to `main` branch (commits `e254984` and `23d2a46`)
✅ Pushed to GitHub
✅ Vercel deployment triggered automatically
