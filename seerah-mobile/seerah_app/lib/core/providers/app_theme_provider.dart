import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../theme/app_colors.dart';
import '../theme/theme_options.dart';

const _appThemeKey = 'seerah_app_theme';

/// Applies the persisted theme (if any) to [AppColors] synchronously before
/// `runApp`, so the very first frame already shows the user's chosen
/// theme instead of flashing Black & Gold first. Mirrors
/// `loadSalahLangFromPrefs` in part_provider.dart — same rationale, same
/// "load straight into the global/static before anything reads it" shape.
Future<void> loadAppThemeFromPrefs() async {
  final prefs = await SharedPreferences.getInstance();
  final saved = prefs.getString(_appThemeKey);
  if (saved != null) {
    AppColors.applyTheme(themeById(saved));
  }
}

/// Holds the current theme's id. Changing it repaints [AppColors] and
/// persists the choice; the app-wide remount that actually makes every
/// screen pick up the new colors is wired in main.dart (a KeyedSubtree
/// keyed on this provider's value, wrapping MaterialApp.router's content).
class AppThemeNotifier extends StateNotifier<String> {
  AppThemeNotifier() : super(kAppThemeOptions.first.id) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_appThemeKey);
    if (saved != null && saved != state) {
      AppColors.applyTheme(themeById(saved));
      state = saved;
    }
  }

  Future<void> setTheme(String id) async {
    if (id == state) return;
    AppColors.applyTheme(themeById(id));
    state = id;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_appThemeKey, id);
  }
}

final appThemeProvider = StateNotifierProvider<AppThemeNotifier, String>(
  (ref) => AppThemeNotifier(),
);
