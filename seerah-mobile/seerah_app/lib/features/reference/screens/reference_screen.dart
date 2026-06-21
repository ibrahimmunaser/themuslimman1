import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../data/reference_data.dart';

class ReferenceScreen extends StatelessWidget {
  const ReferenceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reference Library')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            margin: const EdgeInsets.only(bottom: 20),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('REFERENCE LIBRARY',
                  style: TextStyle(color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.2)),
                SizedBox(height: 6),
                Text('Seerah Reference Guides',
                  style: TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.w700)),
                SizedBox(height: 4),
                Text('Timelines, people, places, battles, terms, and more — to deepen your understanding of the Seerah.',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4)),
              ],
            ),
          ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.05, end: 0),

          // Section cards
          ...kReferenceSections.asMap().entries.map((entry) {
            final i = entry.key;
            final section = entry.value;
            return GestureDetector(
              onTap: () => context.push('/reference/${section.id}'),
              child: Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44, height: 44,
                      decoration: BoxDecoration(
                        color: AppColors.goldFaded,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.gold.withOpacity(0.3)),
                      ),
                      child: const Icon(Icons.menu_book, color: AppColors.gold, size: 20),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(section.title,
                            style: const TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w700)),
                          const SizedBox(height: 2),
                          Text(section.description,
                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.3)),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right, color: AppColors.textMuted, size: 20),
                  ],
                ),
              ).animate(delay: (i * 50).ms).fadeIn(duration: 400.ms).slideX(begin: 0.03, end: 0),
            );
          }),

          const SizedBox(height: 8),
          Center(
            child: Text('More sections coming soon',
              style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
