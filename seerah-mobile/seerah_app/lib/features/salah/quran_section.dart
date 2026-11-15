import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart' as host_theme;
import 'navigation.dart';
import 'screens/quran_hub_screen.dart';

/// Quran reader as its own shell tab. Nested [Navigator] keeps surah/juz
/// pushes inside this tab so the shared Home/Seerah/Quran/Salah bar stays put.
///
/// The phone's back button is wired to [quranNavigatorKey] one level
/// higher, in app_router.dart (`_ShellBackHandler`) — see the comment
/// there for why that has to sit outside go_router's own ShellRoute
/// Navigator rather than here.
class QuranSection extends StatelessWidget {
  const QuranSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: host_theme.AppTheme.dark,
      child: Navigator(
        key: quranNavigatorKey,
        onGenerateRoute: (settings) => MaterialPageRoute(
          builder: (_) => const QuranHubScreen(),
        ),
      ),
    );
  }
}
