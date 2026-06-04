import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/theme/app_colors.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Avatar & info
          Center(
            child: Column(
              children: [
                Container(
                  width: 80, height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.goldFaded,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.gold, width: 1.5),
                  ),
                  child: Center(
                    child: Text(
                      _initials(user?.name, user?.email),
                      style: const TextStyle(
                        color: AppColors.gold,
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                if (user?.name != null)
                  Text(user!.name!, style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 4),
                Text(
                  user?.email ?? 'Student',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
                ),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: auth.hasAccess ? AppColors.success.withOpacity(0.1) : AppColors.goldFaded,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: auth.hasAccess ? AppColors.success.withOpacity(0.5) : AppColors.gold.withOpacity(0.4),
                    ),
                  ),
                  child: Text(
                    auth.hasAccess ? 'Full Access' : 'Free',
                    style: TextStyle(
                      color: auth.hasAccess ? AppColors.success : AppColors.gold,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.1, end: 0),
          ),

          const SizedBox(height: 32),

          // Account settings
          _SectionHeader('Account'),
          _SettingsItem(
            icon: Icons.lock_outline,
            label: 'Change Password',
            onTap: () => _launchUrl('${AppConstants.baseUrl}/change-password'),
          ),
          _SettingsItem(
            icon: Icons.receipt_outlined,
            label: 'Billing & Subscription',
            onTap: () => _launchUrl('${AppConstants.baseUrl}/billing'),
          ),

          const SizedBox(height: 20),

          _SectionHeader('Support'),
          _SettingsItem(
            icon: Icons.help_outline,
            label: 'Help & FAQ',
            onTap: () => _launchUrl('${AppConstants.baseUrl}/help'),
          ),
          _SettingsItem(
            icon: Icons.contact_support_outlined,
            label: 'Contact Us',
            onTap: () => _launchUrl('${AppConstants.baseUrl}/contact'),
          ),

          const SizedBox(height: 20),

          _SectionHeader('Legal'),
          _SettingsItem(
            icon: Icons.policy_outlined,
            label: 'Privacy Policy',
            onTap: () => _launchUrl('${AppConstants.baseUrl}/privacy'),
          ),
          _SettingsItem(
            icon: Icons.gavel_outlined,
            label: 'Terms of Service',
            onTap: () => _launchUrl('${AppConstants.baseUrl}/terms'),
          ),

          const SizedBox(height: 32),

          // Logout
          OutlinedButton.icon(
            onPressed: () => _confirmLogout(context, ref),
            icon: const Icon(Icons.logout, size: 18),
            label: const Text('Sign Out'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.error,
              side: const BorderSide(color: AppColors.error),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ).animate(delay: 200.ms).fadeIn(duration: 400.ms),

          const SizedBox(height: 16),
          Center(
            child: Text('Version 1.0.0',
              style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  String _initials(String? name, String? email) {
    if (name != null && name.isNotEmpty) {
      final parts = name.trim().split(' ');
      if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
      return name[0].toUpperCase();
    }
    if (email != null && email.isNotEmpty) return email[0].toUpperCase();
    return 'U';
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Sign Out?', style: TextStyle(color: AppColors.textPrimary)),
        content: const Text('You will need to sign in again.',
          style: TextStyle(color: AppColors.textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sign Out', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ref.read(authProvider.notifier).logout();
    }
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader(this.title);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(title, style: const TextStyle(
        color: AppColors.textMuted,
        fontSize: 12,
        fontWeight: FontWeight.w600,
        letterSpacing: 1,
      )),
    );
  }
}

class _SettingsItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _SettingsItem({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: ListTile(
        leading: Icon(icon, color: AppColors.textSecondary, size: 20),
        title: Text(label, style: const TextStyle(color: AppColors.textPrimary, fontSize: 15)),
        trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted, size: 20),
        onTap: onTap,
        tileColor: AppColors.card,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: const BorderSide(color: AppColors.border),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      ),
    );
  }
}
