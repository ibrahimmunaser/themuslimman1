import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';

/// Whether this device has already seen the first-launch WelcomeScreen.
///
/// Loaded from SharedPreferences and injected via `overrideWith` in main()
/// BEFORE runApp() — see main.dart. This means app_router's redirect can
/// read it synchronously on the very first frame with no extra "loading"
/// state to coordinate (unlike AuthNotifier's async `_restore()`, which the
/// router already waits on via `authState.isLoading`).
///
/// Defaults to true so that any context missing the main() override (e.g. a
/// widget test harness) never accidentally shows onboarding unexpectedly —
/// in real app runs this default is always replaced before first use.
final welcomeSeenProvider = StateProvider<bool>((ref) => true);

/// Loads the persisted flag — called once in main() before runApp().
Future<bool> loadHasSeenWelcome() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getBool(AppConstants.keyHasSeenWelcome) ?? false;
}

/// Marks the WelcomeScreen as seen so it never reappears automatically on
/// this device again (it stays manually reachable afterward via Profile →
/// "Welcome Tour"). Safe to call every time WelcomeScreen builds — no-ops
/// once already true.
Future<void> markWelcomeSeen(WidgetRef ref) async {
  if (ref.read(welcomeSeenProvider)) return;
  ref.read(welcomeSeenProvider.notifier).state = true;
  final prefs = await SharedPreferences.getInstance();
  await prefs.setBool(AppConstants.keyHasSeenWelcome, true);
}
