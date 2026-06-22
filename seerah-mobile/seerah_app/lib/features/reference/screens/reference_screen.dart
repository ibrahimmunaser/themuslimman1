import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/ui_kit.dart';
import '../data/reference_data.dart';

class ReferenceScreen extends StatelessWidget {
  const ReferenceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Reference'),
      ),
      body: AppGradientBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            children: [
              // Compact header
              const Padding(
                padding: EdgeInsets.only(bottom: 14),
                child: Text(
                  'Deepen your understanding of the Seerah',
                  style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                ),
              ),

              // Grouped list
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Column(
                  children: kReferenceSections.asMap().entries.map((entry) {
                    final i = entry.key;
                    final section = entry.value;
                    final isLast = i == kReferenceSections.length - 1;
                    final accent = referenceSectionColor(section.id);
                    final icon = referenceSectionIcon(section.id);
                    return Column(
                      children: [
                        Material(
                          color: AppColors.card,
                          child: InkWell(
                            onTap: () => context.push('/reference/${section.id}'),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 13),
                              child: Row(
                                children: [
                                  Container(
                                    width: 38, height: 38,
                                    decoration: BoxDecoration(
                                      color: accent.withValues(alpha: 0.18),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Icon(icon, color: accent, size: 20),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(section.title,
                                          style: const TextStyle(
                                            color: AppColors.textPrimary,
                                            fontSize: 15,
                                            fontWeight: FontWeight.w600,
                                          )),
                                        Text(section.description,
                                          style: const TextStyle(
                                            color: AppColors.textMuted,
                                            fontSize: 12,
                                            height: 1.3,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  const Icon(Icons.chevron_right_rounded,
                                    color: AppColors.textMuted, size: 18),
                                ],
                              ),
                            ),
                          ),
                        ),
                        if (!isLast)
                          const Divider(height: 1, thickness: 1,
                            color: AppColors.border, indent: 68, endIndent: 0),
                      ],
                    );
                  }).toList(),
                ),
              ).animate().fadeIn(duration: 350.ms),
            ],
          ),
        ),
      ),
    );
  }
}
