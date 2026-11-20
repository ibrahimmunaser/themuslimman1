# iOS App Guard (Screen Time) setup

App Guard exists in this codebase for iOS (`IosAppGuardService`, `AppGuardManager.swift`,
`GuardShared.swift`, and the three extension targets under `ios/DeviceActivityMonitorExtension/`,
`ios/ShieldConfigurationExtension/`, `ios/ShieldActionExtension/`) but is **off by default**:
`ScreenTimeGuardEnabled` in `ios/Runner/Info.plist` is `false`, and the extension targets are not
part of `Runner.xcodeproj` unless explicitly added. This doc is the one-time manual setup needed
to turn it on. None of it is automatable from CI — it requires an Apple Developer account holder
and, for the final steps, a Mac with Xcode.

## Why this exists at all

Android App Guard uses a foreground service (`android.permission.FOREGROUND_SERVICE_SPECIAL_USE`),
which any developer can declare — Google only asks for a one-time video + description in Play
Console (see the "Foreground service permissions" declaration under App content → Policy and
programs). iOS has no equivalent self-serve permission: the same feature needs Apple's
**Family Controls** framework (`FamilyControls`, `DeviceActivity`, `ManagedSettings`,
`ManagedSettingsUI`), which Apple gates behind a manually-reviewed entitlement request **per
bundle ID**, separate for development and distribution.

## Step 1 — Request the Family Controls entitlement (account holder, do this first)

Request form: **https://developer.apple.com/contact/request/family-controls-distribution**
(while signed in as the Account Holder — requests are tied to the team, not an individual
developer). You need **4 separate requests**, one per bundle ID, because Apple requires the
entitlement on every target that links the Family Controls frameworks:

| Bundle ID | Role |
|---|---|
| `com.themuslimman.seerah` | Main app (`Runner`) |
| `com.themuslimman.seerah.DeviceActivityMonitorExtension` | Starts/stops the shield at each prayer's 15-minute window |
| `com.themuslimman.seerah.ShieldConfigurationExtension` | Builds the "Allah is calling" shield UI |
| `com.themuslimman.seerah.ShieldActionExtension` | Handles the shield's two buttons |

For each, explain the use case plainly — self-control / digital-wellbeing, not parental
monitoring of someone else's device: *"Lets a user optionally select distracting apps to be
covered with a reminder screen for 15 minutes after each of the 5 daily prayer times. Entirely
opt-in and self-applied; the app never learns which real apps the user selected (Apple's opaque
`ApplicationToken`/`ActivityCategoryToken`s are used throughout)."*

**Timeline**: real-world reports range from ~4 business days to several weeks. There's no ticket
tracker or confirmation email — check status instead at **Certificates, Identifiers & Profiles →
Identifiers → (select the App ID) → Capability Requests tab → Status** next to Family Controls.
"Submitted" = pending, "Assigned" = approved.

You can request all 4 in parallel with step 2 — no need to wait.

## Step 2 — Register the App Group

Separate from the entitlement, and doesn't need Apple approval:

1. developer.apple.com → Certificates, Identifiers & Profiles → **Identifiers** → App Groups tab
   → register `group.com.themuslimman.seerah` (if not already registered for another app).
2. On each of the 4 bundle IDs above (Identifiers → App IDs), enable the **App Groups**
   capability and associate it with `group.com.themuslimman.seerah`.

This is how the main app and the 3 extensions share the user's app/category selection and the
current prayer name across process boundaries (`GuardShared.swift`).

## Step 3 — Add the Xcode extension targets

Once Family Controls shows **Assigned** for at least the main app (you don't have to wait for all
4 — the extensions can be added to the project immediately, they just won't code-sign until their
own entitlement is Assigned too):

```bash
cd seerah-mobile/seerah_app
gem install xcodeproj   # if not already available (CocoaPods usually brings it in)
ruby ios/scripts/setup_screen_time_targets.rb
```

This adds `DeviceActivityMonitorExtension`, `ShieldConfigurationExtension`, and
`ShieldActionExtension` as real `app_extension` targets to `Runner.xcodeproj`, wires their
`Info.plist`/entitlements/frameworks, adds the shared `GuardShared.swift` to each, and embeds all
3 into `Runner.app`. It's idempotent — safe to re-run.

It also sets the `SCREEN_TIME_GUARD_ENABLED` Swift compilation condition on `Runner` and every
extension target — `AppGuardManager.swift`/`GuardShared.swift` gate their
`FamilyControls`/`DeviceActivity`/`ManagedSettings` imports behind that flag (in addition to
`canImport`), so an ordinary build that never runs this script compiles in none of those APIs at
all. This matters for App Review: Apple rejected 1.0.92 under Guideline 2.5.1 ("includes ScreenTime
APIs, but it does not include any features that require it") because the frameworks were being
linked unconditionally while the feature itself stayed hidden behind the entitlement check — see
git history around that rejection for the fix.

Open the project in Xcode afterward and sanity-check: each extension target's
**Signing & Capabilities** tab should show Family Controls + App Groups once its entitlement is
enabled on the App ID (Capability Requests → Family Controls → "Assigned" makes an
**Additional Capabilities** tab appear on that bundle ID in the Developer Portal — turn it on
there, which is separate from enabling it in Xcode).

## Step 4 — Regenerate the provisioning profile

The `themuslimman_appstore` profile Codemagic uses needs to be regenerated to include Family
Controls + App Groups for the main app, and **new profiles created for each of the 3 extensions**
(an app extension needs its own provisioning profile, it can't reuse the host app's). In Codemagic:
**Code signing → iOS provisioning profiles → Fetch profiles**, selecting all 4 bundle IDs, after
regenerating them on the Developer Portal.

## Step 5 — Flip the build on

1. In `codemagic.yaml`, set `ENABLE_SCREEN_TIME_EXTENSIONS: "1"` under the `ios-release`
   workflow's `vars` (this is what makes step 3's script run automatically during CI builds).
2. In `ios/Runner/Runner.entitlements`, uncomment the Family Controls + App Groups keys
   (currently left out on purpose — see the comments in that file).
3. In `ios/Runner/Info.plist`, flip `ScreenTimeGuardEnabled` to `true`.
4. Add the 3 new extension provisioning profiles to the `ios_signing.provisioning_profiles` list
   in `codemagic.yaml` alongside `themuslimman_appstore`.
5. Push to `main` and watch the iOS Release build — if any bundle ID's entitlement/profile
   doesn't line up, `xcode-project use-profiles` or `Build IPA` will fail with the same kind of
   "doesn't include the ... entitlement" error seen previously for Time Sensitive Notifications.

## Local testing before any of this (no Apple approval needed)

`com.apple.developer.family-controls.development` (note: a genuinely different entitlement key
from the distribution one above) lets you build and test on your own device immediately via
Xcode's Signing & Capabilities tab, with no Apple review. Use this to verify the picker, shield,
and button behavior work before requesting distribution approval.

Since `SCREEN_TIME_GUARD_ENABLED` (see Step 3 above) also has to be set for any of this to
compile, local-only testing still needs `ruby ios/scripts/setup_screen_time_targets.rb` run once
(it only touches build settings/targets, not entitlements — Family Controls + App Groups still
need to be added manually via Xcode's Signing & Capabilities tab for local dev, per the dev
entitlement above).
