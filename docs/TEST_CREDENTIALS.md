# Test Credentials - Seerah LMS

## Overview

This document contains test account credentials for development and testing purposes.

## Setup

To set up test data (creates purchases for all test accounts):

```bash
npx tsx scripts/setup-test-data.ts
```

## Test Accounts

### Account 1: Complete Plan
- **Username:** `imunaser`
- **Password:** `test123`
- **Plan:** Complete Seerah Academy ($97)
- **Access:** All 100 parts of the Seerah

### Account 2: Essentials Plan
- **Username:** `imunaser1`
- **Password:** `test123`
- **Plan:** Seerah Essentials ($47)
- **Access:** Selected essential parts only

### Account 3: Complete Plan
- **Username:** `imunaser2`
- **Password:** `test123`
- **Plan:** Complete Seerah Academy ($97)
- **Access:** All 100 parts of the Seerah

## Login Flow

1. Navigate to: `http://localhost:3000/login`
2. Enter username and password
3. Click "Sign In"
4. User is redirected to `/learn` (student dashboard)
5. Dashboard displays all purchased content organized by era

## Verified Functionality

✅ User authentication (username/password login)
✅ Automatic redirect to dashboard after successful login
✅ Dashboard displays purchased content based on plan
✅ Content organized by historical eras (Pre-Islamic Arabia, Birth & Early Life, etc.)
✅ **All 100 parts accessible for Complete plan users ($97)**
✅ **Only 56 essential parts for Essentials plan users ($47)**
✅ Correct dashboard title per plan ("Complete Seerah Academy" vs "Seerah Starter")
✅ "Upgrade Now" banner shown to Essentials users

## Content Filtering Verification

Run this script to verify content access by plan:
```bash
npx tsx scripts/verify-content-access.ts
```

**Expected Results:**
- Complete Plan ($97) → 100 parts shown
- Essentials Plan ($47) → 56 parts shown (only parts marked with `includedInEssentials: true`)
- No purchase → Redirected to `/pricing`

## Notes

- All test accounts have the same password: `test123`
- Purchases are marked as "succeeded" in the database
- Student profiles are automatically created on user creation
- The `/student/dashboard` route redirects to `/learn`
