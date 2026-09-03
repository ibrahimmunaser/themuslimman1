import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/part_provider.dart';
import '../theme/app_colors.dart';
import '../../l10n/app_strings.dart';

/// Full-bleed error state for in-app WebViews (checkout, sign-in, legal
/// pages, profile settings). Every WebViewController in this app wires its
/// `onWebResourceError` to show this instead of leaving the user staring at
/// a silently blank or frozen page with no way forward besides force-
/// quitting — which was previously the only outcome of a DNS failure,
/// airplane mode, a timeout, or the backend returning a non-2xx for the
/// main frame while mid-checkout or mid-sign-in.
class WebViewErrorOverlay extends ConsumerWidget {
  final VoidCallback onRetry;
  final String? message;

  const WebViewErrorOverlay({
    super.key,
    required this.onRetry,
    this.message,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(courseLangProvider);
    return Container(
      color: AppColors.background,
      alignment: Alignment.center,
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.wifi_off_rounded, size: 44, color: AppColors.textMuted),
          const SizedBox(height: 16),
          Text(
            message ?? t(lang, 'couldntLoadPage'),
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.4),
          ),
          const SizedBox(height: 20),
          OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh_rounded, size: 18),
            label: Text(t(lang, 'retry')),
          ),
        ],
      ),
    );
  }
}
