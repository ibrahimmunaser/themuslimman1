# The Muslim Man — Store Release Checklist

App: **The Muslim Man — Seerah Course**  
Package: `com.themuslimman.seerah`  
Bundle ID (iOS): `com.themuslimman.seerah`  
Version: `1.0.0+1`

---

## Part 1 — Android Keystore Setup

> Do this **once**. The resulting `.jks` file is your permanent signing identity.
> Losing it means you can never update the app on the Play Store.

### 1.1 Generate the keystore

```bash
keytool -genkey -v \
  -keystore ~/keys/themuslimman.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias themuslimman \
  -dname "CN=The Muslim Man, OU=Mobile, O=The Muslim Man LLC, L=Unknown, ST=Unknown, C=US"
```

You will be prompted for a **keystore password** and a **key password**.
Store both in a password manager immediately.

### 1.2 Create `android/key.properties`

Copy the example template and fill in your values:

```bash
cp android/key.properties.example android/key.properties
```

Edit `android/key.properties`:

```
storeFile=/Users/YOUR_NAME/keys/themuslimman.jks
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=themuslimman
keyPassword=YOUR_KEY_PASSWORD
```

> `key.properties` is already in `.gitignore`. Never commit it.

### 1.3 Build the release AAB

```bash
flutter build appbundle --release
```

Output: `build/app/outputs/bundle/release/app-release.aab`

### 1.4 Verify the AAB is signed

```bash
jarsigner -verify -verbose -certs \
  build/app/outputs/bundle/release/app-release.aab
```

Expected: `jar verified`

---

## Part 2 — iOS Signing Setup

### 2.1 Prerequisites

- Active **Apple Developer Program** membership ($99/year)
- Xcode installed on macOS

### 2.2 Set the Bundle Identifier in Xcode

1. Open `ios/Runner.xcworkspace` in Xcode.
2. Select the **Runner** target → **Signing & Capabilities**.
3. Set **Bundle Identifier** to `com.themuslimman.seerah`.
4. Select your **Team** from the dropdown.
5. Check **Automatically manage signing** (recommended for first build).

### 2.3 Create App ID in Apple Developer Portal (if not auto-created)

1. Go to [developer.apple.com/account](https://developer.apple.com/account) → **Identifiers**.
2. Register a new App ID: `com.themuslimman.seerah`.
3. Enable capabilities: **Associated Domains** (if needed), **Push Notifications** (optional).

### 2.4 Build the IPA

```bash
flutter build ipa --release
```

Output: `build/ios/archive/Runner.xcarchive`

Then in Xcode → **Product → Archive → Distribute App → App Store Connect**.

### 2.5 Alternative: Build via Xcode directly

```bash
open ios/Runner.xcworkspace
# In Xcode: Product → Archive
```

---

## Part 3 — Play Store Submission Checklist

### Account setup
- [ ] Google Play Console account created and verified
- [ ] App created in Play Console with package `com.themuslimman.seerah`
- [ ] App name: **The Muslim Man: Seerah Course**

### Store listing content
- [ ] Short description (≤80 chars): *"Learn the complete Seerah of the Prophet ﷺ in 100 structured parts."*
- [ ] Full description (≤4000 chars): See marketing copy
- [ ] App icon uploaded (512×512 PNG) — use `assets/images/app_icon.png`
- [ ] Feature graphic (1024×500 PNG)
- [ ] At least 2 phone screenshots (1080×1920 or similar)
- [ ] Content rating questionnaire completed
- [ ] Category: **Education**
- [ ] Email: your support/contact email

### Data Safety (Play Store)
Fill out the **Data Safety** section in Play Console:

| Question | Answer |
|----------|--------|
| Does the app collect or share user data? | Yes |
| Data types collected | Email address, Name, Purchase history |
| Is data encrypted in transit? | Yes (HTTPS only) |
| Can users request data deletion? | Yes — immediate, in-app, self-service (Profile → Delete Account), no support ticket needed |
| Data shared with third parties? | Yes — purchase tokens shared with Google Play Billing for verification (via our backend) |
| Is data collected required? | Yes (email for login; purchase history for access control) |
| Purpose of collection | App functionality (authentication + subscription access) |

### Release
- [ ] Upload signed AAB (`app-release.aab`)
- [ ] Set release track: **Internal testing** first → **Production**
- [ ] Version code: `1` (matches `flutter.versionCode`)
- [ ] Version name: `1.0.0`
- [ ] Release notes (What's new): "Initial release — all 100 Seerah parts, video, flashcards, and quizzes."

---

## Part 4 — App Store Submission Checklist

### App Store Connect setup
- [ ] App record created at [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
- [ ] Bundle ID: `com.themuslimman.seerah`
- [ ] App name: **The Muslim Man: Seerah Course**
- [ ] SKU: `SEERAH_APP_V1`
- [ ] Primary language: English (US)

### Store listing content
- [ ] App icon (1024×1024 PNG, no transparency, no rounded corners) — use `assets/images/app_icon.png`
- [ ] Screenshots:
  - iPhone 6.9" (required): 1320×2868 or 1290×2796
  - iPhone 6.5" (recommended): 1242×2688
  - At least 3 screenshots per device
- [ ] Description (≤4000 chars)
- [ ] Keywords (≤100 chars total): *seerah,islam,prophet,quran,hadith,muslim,education*
- [ ] Support URL: `https://themuslimman.com/support`
- [ ] Marketing URL: `https://themuslimman.com`
- [ ] Category: **Education**
- [ ] Age rating: **4+** (no objectionable content)
- [ ] Copyright: **© 2026 The Muslim Man LLC**

### Privacy
- [ ] Privacy Policy URL: `https://themuslimman.com/privacy`
- [ ] App Privacy labels filled in (matches `PrivacyInfo.xcprivacy`):
  - **Email Address** — Collected, linked to identity, app functionality only
  - **Name** — Collected, linked to identity, app functionality only
  - **Purchase History** — Collected, linked to identity, app functionality only (IAP receipt verified server-side)
  - Data not used for tracking

### App Review notes (REQUIRED — paste into App Review Information → Notes)
> *"This is an Islamic educational course app covering the biography of the Prophet Muhammad ﷺ in 100 structured parts. Part 1 is freely accessible with no account. Full access to Parts 2–100 requires a purchase through in-app purchase (Apple StoreKit) — four plans are available: Individual Monthly, Family Monthly, Individual Lifetime, and Family Lifetime, each showing its title, length, and price directly in the purchase screen next to links to our Privacy Policy and Terms of Use (EULA). Purchasing does NOT require creating an account or providing any personal information — tapping a plan silently starts checkout on a device-linked session with zero data collected, and the native StoreKit sheet appears immediately. After purchase, the app verifies the receipt with our backend (themuslimman.com/api/mobile-purchases/verify) and unlocks the content on that device right away. Creating a real account (Profile → 'Create an account') is entirely optional and only available AFTER a purchase has been completed — it exists solely to access the same purchase from a different device. Account creation is never required before, during, or after checkout, and there is no account creation option on the Sign In screen. A Restore Purchases button is present on the paywall and pricing screens and works without an account. Account deletion is available in-app at Profile → Delete Account (immediate, no email/support ticket required). No sign-in with Apple is used. Test account credentials: [provide a test account with full access — email + password, or note that Restore Purchases can be used with a Sandbox tester]."*

> ⚠️ **CONFIRMED 2026-07-19 (ASC check):**
> Product IDs in App Store Connect match the app code exactly:
> - `seerah_monthly_individual`, `seerah_monthly_family` (subscriptions, Waiting for Review)
> - `seerah_lifetime_individual`, `seerah_lifetime_family` (non-consumables, Waiting for Review)
> Paid Apps Agreement is **Active**. Bank + W-9 tax forms are Active.
> Legacy reverse-DNS IDs in verify route are unused fallback only — ASC does not use them.
>
> Remaining for 2.1(b): retest sandbox purchase after rebuilding with the 5.1.1 signup gate fix.
> Remaining for 2.3.10: upload the cleaned iOS screenshots from
> `app-store-assets/ios-iphone-screenshot-1.jpg` (and -2, -3) — Android status-bar
> screenshots were deleted from the version page; new ones still need uploading.
>
> **Guideline 3.1.1 fix (1.0.26):** Profile → Billing no longer opens
> `themuslimman.com/billing` (Stripe) inside an iOS WebView. Unpaid users go to
> the native IAP pricing screen; paid users see Apple ID subscription management
> instructions. All in-app WebViews block navigation to `/pricing`, `/checkout`,
> `/billing`, and Stripe hosts on iOS. Purchases are StoreKit only.

### In-App Purchase promotional image (Guideline 2.3.2)
> A new promotional image (unique graphic, not a screenshot, large legible
> text) is at `app-store-assets/iap-promotional-image-1024x1024.png`. Upload
> it in App Store Connect → In-App Purchases → [item] → Promotional Image,
> or delete the old flagged image if you don't want to promote it.

### Terms of Use (EULA) — App Store metadata (Guideline 3.1.2(c))
> The app now links "Terms of Use (EULA)" (→ `/terms`) and "Privacy Policy"
> (→ `/privacy`) directly in the purchase flow (paywall + pricing screen +
> signup screen). App Store Connect metadata still needs, separately:
> - **Privacy Policy URL** field: `https://themuslimman.com/privacy` (already listed above)
> - **Either**: check "uses Apple's standard EULA" and add a link to
>   `https://www.apple.com/legal/internet-services/itunes/dev/stdeula/` in the
>   App Description, **or** if a custom EULA is written, paste it into the
>   **License Agreement (EULA)** field in App Store Connect → App Information.
> Confirm which one applies before resubmitting — this fix assumed the
> standard Apple EULA since no custom EULA text exists in this repo.

### Release
- [ ] Upload IPA via Xcode or `xcrun altool`
- [ ] Set version to `1.0.0`, build `1`
- [ ] Select Manual Release or Automatic Release after approval
- [ ] Submit for review

---

## Part 5 — Privacy / Data Safety Answers (both stores)

| Item | Detail |
|------|--------|
| Data collected | Email address (required for login), Name (optional, display only), Purchase history (IAP receipt verified server-side) |
| Where stored | Server-side (Prisma/PostgreSQL on themuslimman.com) |
| Stored on device | Email + Name in SharedPreferences (plaintext, not shared); session cookies in iOS Keychain / Android Keystore (encrypted); viewed parts + quiz scores in SharedPreferences (local only, no PII) |
| Third parties | Apple StoreKit (iOS IAP — receipt sent to our backend for verification); Google Play Billing (Android IAP — purchase token sent to our backend); Stripe (web-side only — no Stripe SDK in app) |
| Analytics | None |
| Advertising | None |
| Tracking | None |
| Data deletion | In-app, self-service, immediate: Profile → Delete Account (POST /api/account/delete) — cancels any active subscription and hard-deletes the account. No account? Same option is available for guest/anonymous accounts too. |
| Encryption in transit | Yes — HTTPS/TLS for all API calls |
| Encryption at rest | Session tokens: iOS Keychain / Android Keystore. User prefs: unencrypted SharedPreferences (no sensitive values stored there) |

---

## Part 6 — Required Screenshots

Capture these screens before submission. Use a real device or simulator.

| Screen | Notes |
|--------|-------|
| Landing / Welcome screen | Logged-out state |
| Login screen | With email/password fields visible |
| Course list (Part 1 unlocked, Parts 2+ locked) | Free user view |
| Part 1 — Watch tab | Video player visible |
| Part 1 — Read tab | Text content visible |
| Part 1 — Flashcards tab | Card flip UI |
| Part 1 — Quiz tab | Question UI |
| Pricing / Plans screen | Monthly/Lifetime toggle |
| Paywall screen | When free user taps Part 2 |
| Profile screen | User info + logout |

For each device size required by the store, capture these 10 screens.

---

## Part 7 — Final QA Smoke Test Before Submission

Run this on a **physical device** (not simulator) in **release mode**:

```bash
# Android
flutter run --release

# iOS (requires device connected + signing configured)
flutter run --release -d <device-id>
```

### Authentication flows
- [ ] **Cold start (logged out)**: App shows landing screen, not course
- [ ] **Sign up (post-purchase only)**: After completing a guest IAP purchase, Profile → "Create an account" → account created and redirected to dashboard with existing access intact
- [ ] **Login (free user)**: Sees Pricing screen; Parts 2-100 show paywall
- [ ] **Login (paid user)**: Directly to Course screen; all parts accessible
- [ ] **Splash screen**: Appears with gold crescent logo on dark background, dismisses cleanly
- [ ] **Session restore**: Kill app, reopen — paid user goes straight to Course without re-login
- [ ] **Logout**: Tapping logout → confirm dialog → lands on Landing screen; reopen shows Landing (not Course)

### Access control
- [ ] **Free user + Part 1**: All 4 tabs load normally (Watch, Read, Cards, Quiz)
- [ ] **Free user + Part 2**: Paywall screen appears; "View Plans" button goes to Pricing
- [ ] **Free user + Part 50**: Paywall screen appears; zero API calls to video/content endpoints
- [ ] **Paid user + Part 2**: All 4 tabs load normally
- [ ] **Paid user + Part 100**: All 4 tabs load normally

### Network resilience
- [ ] **Airplane mode on app start**: Session preserved; no unexpected logout
- [ ] **Airplane mode during session verify**: Cached auth state shown; no logout
- [ ] **401 from server**: User is logged out and sent to landing screen

### Checkout flow (In-App Purchase)
- [ ] **Pricing screen**: Correct prices loaded from the App Store / Google Play (not fallback hardcoded prices)
- [ ] **Tap a plan**: Native payment sheet appears (Apple Sheet on iOS, Google Play sheet on Android)
- [ ] **Complete purchase (sandbox account)**: Success sheet appears — "JazakAllahu Khayran!" — then dashboard shows Full Access badge
- [ ] **Restore Purchases button**: Visible on pricing and landing screens; tapping it restores a prior sandbox purchase — works even fully logged out (no account needed)
- [ ] **Guest purchase flow** (Guideline 5.1.1(v) fix): Tap a plan while logged out → NO login/signup screen appears → native StoreKit sheet appears immediately → after purchase, full access unlocked on this device with zero personal info collected
- [ ] **Optional upgrade**: After a guest purchase, Profile shows "Create an account (optional)" → completing it keeps the same purchase/access, now reachable by signing in on another device
- [ ] **Cross-device restore**: On a second device, sign into the upgraded account, tap Restore Purchases → purchase re-links and access unlocks
- [ ] **Delete account**: Profile → Delete Account → confirm → session ends, subscription (if any) is cancelled, re-opening the app shows the logged-out landing screen
- [ ] **Failed purchase / cancel**: Error snackbar shown, no broken state, can retry immediately
- [ ] **No IAP on simulator**: Store unavailable banner shown gracefully (not a crash)

### Icons and branding
- [ ] App icon visible on home screen (gold crescent on dark background)
- [ ] App name reads "The Muslim Man" on home screen (not "Seerah App")
- [ ] Splash screen shows logo correctly on both light and dark system themes
- [ ] Status bar is light-on-dark (white icons on dark background)

### Crash check
- [ ] Navigate to `/part/1` through `/part/5` — no crashes
- [ ] Open each tab (Watch, Read, Cards, Quiz) on Part 1 — no crashes
- [ ] Rotate device (portrait lock should prevent landscape)
- [ ] Background → foreground several times — no memory crashes

---

## Build Commands Reference

```bash
# Regenerate icons (after changing icon images)
dart run flutter_launcher_icons

# Regenerate splash screens (after changing splash images or colors)
dart run flutter_native_splash:create

# Android release bundle (requires android/key.properties)
flutter build appbundle --release

# Android release APK (for direct device install/testing)
flutter build apk --release --split-per-abi

# iOS archive (requires Xcode signing)
flutter build ipa --release

# Clean build
flutter clean && flutter pub get
```

---

*Last updated: June 2026*
