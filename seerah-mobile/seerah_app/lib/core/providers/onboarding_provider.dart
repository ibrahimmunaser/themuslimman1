import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../constants/app_constants.dart';

/// Whether the forced intro/"what's new" + theme-picker funnel still needs
/// to be shown on this device. Loaded from SharedPreferences and injected
/// via `overrideWith` in main() BEFORE runApp() — same pattern as
/// [welcomeSeenProvider] in welcome_provider.dart, for the same reason:
/// app_router's redirect needs to read it synchronously on the very first
/// frame, with no extra "loading" state to coordinate.
///
/// Defaults to false so a context missing the main() override (e.g. a
/// widget test harness) never gets unexpectedly routed into onboarding — in
/// real app runs this default is always replaced before first use.
final onboardingPendingProvider = StateProvider<bool>((ref) => false);

/// Whether this run's funnel should use "Welcome" framing (genuinely fresh
/// install) or "What's new" framing (existing device updating into this
/// build). Decided once at startup alongside [onboardingPendingProvider] —
/// see [loadOnboardingStartupInfo].
final onboardingIsNewInstallProvider = StateProvider<bool>((ref) => true);

/// Reads (and, for the fresh-install check, immediately writes) the two
/// flags the forced funnel needs, before runApp() — called once in main().
Future<({bool needsOnboarding, bool isNewInstall})>
loadOnboardingStartupInfo() async {
  final prefs = await SharedPreferences.getInstance();
  final isNewInstall = !prefs.containsKey(AppConstants.keyAppEverLaunched);
  if (isNewInstall) {
    await prefs.setBool(AppConstants.keyAppEverLaunched, true);
  }
  final needsOnboarding =
      !(prefs.getBool(AppConstants.keyMajorUpdateIntroSeen) ?? false);
  return (needsOnboarding: needsOnboarding, isNewInstall: isNewInstall);
}

/// Marks the forced funnel as completed so it never reappears on this
/// device again. Flips the provider immediately (so app_router's redirect
/// stops sending the user back to /intro on the very next navigation) and
/// persists it.
Future<void> markOnboardingIntroSeen(WidgetRef ref) async {
  if (!ref.read(onboardingPendingProvider)) return;
  ref.read(onboardingPendingProvider.notifier).state = false;
  final prefs = await SharedPreferences.getInstance();
  await prefs.setBool(AppConstants.keyMajorUpdateIntroSeen, true);
}
