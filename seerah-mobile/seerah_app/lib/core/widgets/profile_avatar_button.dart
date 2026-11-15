import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../providers/part_provider.dart';
import '../providers/profiles_provider.dart';
import '../theme/app_colors.dart';
import '../../l10n/app_strings.dart';

/// Gold-ringed profile control used on Home and Seerah AppBars.
class ProfileAvatarButton extends ConsumerWidget {
  const ProfileAvatarButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(courseLangProvider);
    final profilesState = ref.watch(profilesProvider).valueOrNull;
    final activeProfile = profilesState?.activeProfile;
    return Padding(
      padding: const EdgeInsets.only(right: 10),
      child: Semantics(
        button: true,
        label: t(lang, 'profile'),
        child: InkResponse(
          onTap: () {
            // Guests / signed-out visitors go to sign in (sign up is linked
            // from there); real accounts open the Account tab.
            final auth = ref.read(authProvider);
            if (auth.isLoggedIn && !auth.isAnonymous) {
              context.go('/account');
            } else {
              context.push('/login');
            }
          },
          radius: 24,
          child: Padding(
            padding: const EdgeInsets.all(6),
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.card,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.gold, width: 1),
              ),
              child: activeProfile?.avatar != null &&
                      activeProfile!.avatar!.isNotEmpty
                  ? Text(
                      activeProfile.avatar!,
                      style: const TextStyle(fontSize: 16),
                      textAlign: TextAlign.center,
                    )
                  : Icon(
                      Icons.person_outline_rounded,
                      size: 20,
                      color: AppColors.textPrimary,
                    ),
            ),
          ),
        ),
      ),
    );
  }
}
