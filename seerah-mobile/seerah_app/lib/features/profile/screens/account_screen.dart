import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/ui_kit.dart';
import '../../../l10n/app_strings.dart';
import 'profile_screen.dart';

/// Account tab. Signed-in users (guest or real) see all settings; a visitor
/// with no session at all gets a simple sign in / language screen instead.
class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    if (auth.isLoggedIn) {
      return const ProfileScreen(titleKey: 'account');
    }
    final lang = ref.watch(courseLangProvider);
    return Scaffold(
      appBar: AppBar(title: Text(t(lang, 'account'))),
      body: AppGradientBackground(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
          children: [
            const ClipRRect(
              borderRadius: BorderRadius.all(Radius.circular(14)),
              child: AppLangSwitcherRow(),
            ),
            const SizedBox(height: 10),
            const ClipRRect(
              borderRadius: BorderRadius.all(Radius.circular(14)),
              child: AppThemeSwitcherRow(),
            ),
            const SizedBox(height: 24),
            SizedBox(
              height: 52,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  foregroundColor: Colors.black,
                ),
                onPressed: () => context.push('/login'),
                child: Text(t(lang, 'signIn')),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
