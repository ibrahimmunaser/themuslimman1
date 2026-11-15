import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/providers/part_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/adaptive_icons.dart';
import '../../../core/widgets/profile_avatar_button.dart';
import '../../../core/widgets/ui_kit.dart';
import '../../../l10n/app_strings.dart';
import '../data/reference_data.dart';

class ReferenceScreen extends ConsumerWidget {
  const ReferenceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(courseLangProvider);
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        leading: context.canPop()
            ? IconButton(
                icon: const BackIcon(),
                tooltip: t(lang, 'back'),
                onPressed: () => context.pop(),
              )
            : null,
        title: Text(t(lang, 'references')),
        actions: const [ProfileAvatarButton()],
      ),
      body: AppGradientBackground(
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  t(lang, 'deepenUnderstanding'),
                  style: TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 14),
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: Column(
                      children: [
                        for (var i = 0; i < kReferenceSections.length; i++) ...[
                          Expanded(
                            child: _ReferenceRow(
                              section: kReferenceSections[i],
                              lang: lang,
                            ),
                          ),
                          if (i < kReferenceSections.length - 1)
                            Divider(
                              height: 1,
                              thickness: 1,
                              color: AppColors.border,
                              indent: 68,
                              endIndent: 0,
                            ),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ReferenceRow extends StatelessWidget {
  const _ReferenceRow({required this.section, required this.lang});

  final ReferenceSection section;
  final String lang;

  @override
  Widget build(BuildContext context) {
    final accent = referenceSectionColor(section.id);
    final icon = referenceSectionIcon(section.id);
    return Material(
      color: AppColors.card,
      child: InkWell(
        onTap: () => context.push('/reference/${section.id}'),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: accent, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      section.localizedTitle(lang),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      section.localizedDescription(lang),
                      style: TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 12,
                        height: 1.3,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              ForwardChevronIcon(
                color: AppColors.textMuted,
                size: 18,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
