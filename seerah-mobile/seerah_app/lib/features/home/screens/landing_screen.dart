import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background gradient
          Container(
            decoration: const BoxDecoration(
              gradient: RadialGradient(
                center: Alignment(0, -0.3),
                radius: 1.2,
                colors: [Color(0xFF1A1000), AppColors.background],
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                // Top bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('The Muslim Man',
                        style: TextStyle(
                          color: AppColors.gold,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                      TextButton(
                        onPressed: () => context.go('/login'),
                        child: const Text('Sign In'),
                      ),
                    ],
                  ),
                ),

                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      children: [
                        const SizedBox(height: 40),

                        // Hero section
                        Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                              decoration: BoxDecoration(
                                color: AppColors.goldFaded,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: AppColors.gold.withOpacity(0.4)),
                              ),
                              child: const Text('100 Parts • Complete Seerah',
                                style: TextStyle(color: AppColors.gold, fontSize: 12, fontWeight: FontWeight.w500),
                              ),
                            ),
                            const SizedBox(height: 28),
                            Text(
                              'The Life of\nthe Prophet ﷺ',
                              style: TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 40,
                                fontWeight: FontWeight.w800,
                                height: 1.15,
                                letterSpacing: -0.5,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 20),
                            Text(
                              'A comprehensive 100-part course on the Seerah — covering every era of the Prophet\'s life with depth, context, and clarity.',
                              style: TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 16,
                                height: 1.6,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ).animate().fadeIn(delay: 100.ms, duration: 600.ms).slideY(begin: 0.15, end: 0),

                        const SizedBox(height: 48),

                        // Stats row
                        Row(
                          children: [
                            _StatCard(value: '100', label: 'Parts'),
                            const SizedBox(width: 12),
                            _StatCard(value: '8', label: 'Eras'),
                            const SizedBox(width: 12),
                            _StatCard(value: '∞', label: 'Access'),
                          ],
                        ).animate().fadeIn(delay: 250.ms, duration: 500.ms),

                        const SizedBox(height: 48),

                        // Features
                        Column(
                          children: [
                            _FeatureRow(icon: Icons.play_circle_outline, title: 'Watch', desc: 'Video lessons for every part'),
                            _FeatureRow(icon: Icons.menu_book_outlined, title: 'Read', desc: 'Briefings, study guides & facts'),
                            _FeatureRow(icon: Icons.style_outlined, title: 'Flashcards', desc: 'Memory review across 3 difficulty levels'),
                            _FeatureRow(icon: Icons.quiz_outlined, title: 'Quiz', desc: 'Test your knowledge after each part'),
                          ],
                        ).animate().fadeIn(delay: 350.ms, duration: 500.ms),

                        const SizedBox(height: 48),

                        // CTA buttons
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            ElevatedButton(
                              onPressed: () => context.go('/signup'),
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                              ),
                              child: const Text('Get Started', style: TextStyle(fontSize: 16)),
                            ),
                            const SizedBox(height: 12),
                            OutlinedButton(
                              onPressed: () => context.go('/login'),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                              ),
                              child: const Text('Sign In', style: TextStyle(fontSize: 16)),
                            ),
                          ],
                        ).animate().fadeIn(delay: 450.ms, duration: 400.ms),

                        const SizedBox(height: 32),
                        Text(
                          'Part 1 is free — no account needed',
                          style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                        ).animate().fadeIn(delay: 500.ms),

                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String value;
  final String label;
  const _StatCard({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Text(value, style: const TextStyle(
              color: AppColors.gold, fontSize: 24, fontWeight: FontWeight.w800,
            )),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(
              color: AppColors.textMuted, fontSize: 12,
            )),
          ],
        ),
      ),
    );
  }
}

class _FeatureRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String desc;
  const _FeatureRow({required this.icon, required this.title, required this.desc});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              color: AppColors.goldFaded,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppColors.gold, size: 22),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(
                color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w600,
              )),
              Text(desc, style: const TextStyle(
                color: AppColors.textSecondary, fontSize: 13,
              )),
            ],
          ),
        ],
      ),
    );
  }
}
