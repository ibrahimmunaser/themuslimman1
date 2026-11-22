import 'dart:async';

import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';

import '../../../core/theme/app_colors.dart';
import '../models/dua.dart';

/// A calm, timed moment to make du'a for one person.
///
/// Deliberately NOT the "Allah is calling" call screen: no ringing, no
/// Answer/Decline. It just holds the screen quietly for [seconds] (30 or 60,
/// the user's choice) with the person's name and a du'a, then closes itself.
/// The user can finish early with "Ameen" or skip with "Not now".
class DuaCardScreen extends StatefulWidget {
  const DuaCardScreen({super.key, required this.person, required this.seconds});

  /// Who the du'a is for, or null for a general du'a for loved ones.
  final DuaPerson? person;
  final int seconds;

  @override
  State<DuaCardScreen> createState() => _DuaCardScreenState();
}

class _DuaCardScreenState extends State<DuaCardScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _progress;
  Timer? _closeTimer;
  bool _done = false;

  @override
  void initState() {
    super.initState();
    _progress = AnimationController(
      vsync: this,
      duration: Duration(seconds: widget.seconds),
    )..addStatusListener((status) {
      if (status == AnimationStatus.completed) _finish();
    });
    _progress.forward();
  }

  /// The time is up (or the user said Ameen): show a short closing line, then
  /// leave on our own.
  void _finish() {
    if (_done || !mounted) return;
    setState(() => _done = true);
    _progress.stop();
    _closeTimer = Timer(const Duration(milliseconds: 1800), () {
      if (mounted) Navigator.of(context).maybePop();
    });
  }

  @override
  void dispose() {
    _closeTimer?.cancel();
    _progress.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final person = widget.person;
    final now = DateTime.now();
    final dayIndex =
        DateTime.utc(
          now.year,
          now.month,
          now.day,
        ).millisecondsSinceEpoch ~/
        Duration.millisecondsPerDay;
    final duas = duaTextsFor(person, dayIndex: dayIndex);
    final subtitle = person == null ? null : _subtitleFor(person);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Container(
        decoration: BoxDecoration(
          gradient: RadialGradient(
            center: const Alignment(0, -0.6),
            radius: 1.2,
            colors: [
              AppColors.gold.withValues(alpha: 0.16),
              AppColors.background,
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 28, 24, 20),
            child: Column(
              children: [
                Text(
                  person == null ? 'Du\'a for your loved ones' : 'Make du\'a for',
                  style: TextStyle(
                    fontSize: 13,
                    letterSpacing: 1.4,
                    fontWeight: FontWeight.w700,
                    color: AppColors.gold,
                  ),
                ),
                if (person != null) ...[
                  const SizedBox(height: 10),
                  Text(
                    person.displayName,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 38,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ],
                const SizedBox(height: 24),
                Expanded(
                  child: Center(
                    child: SingleChildScrollView(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          for (final d in duas) ...[
                            Directionality(
                              textDirection: TextDirection.rtl,
                              child: Text(
                                d.arabic,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 30,
                                  height: 1.9,
                                  color: AppColors.goldLight,
                                ),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              d.transliteration,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 13,
                                height: 1.4,
                                color: AppColors.textMuted,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              d.translation,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 15,
                                height: 1.45,
                                fontStyle: FontStyle.italic,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              d.source,
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.textMuted,
                              ),
                            ),
                            const SizedBox(height: 26),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                _ProgressRing(
                  controller: _progress,
                  seconds: widget.seconds,
                  done: _done,
                ),
                const SizedBox(height: 18),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 250),
                  child:
                      _done
                          ? Padding(
                            key: const ValueKey('done'),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            child: Text(
                              'Ameen. May Allah accept it.',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: AppColors.gold,
                              ),
                            ),
                          )
                          : Column(
                            key: const ValueKey('actions'),
                            children: [
                              SizedBox(
                                width: double.infinity,
                                child: FilledButton(
                                  style: FilledButton.styleFrom(
                                    backgroundColor: AppColors.gold,
                                    foregroundColor: AppColors.onGold,
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 14,
                                    ),
                                  ),
                                  onPressed: _finish,
                                  child: const Text(
                                    'Ameen',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                              ),
                              TextButton(
                                onPressed: () => Navigator.of(context).maybePop(),
                                child: Text(
                                  'Not now',
                                  style: TextStyle(color: AppColors.textMuted),
                                ),
                              ),
                            ],
                          ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  static String? _subtitleFor(DuaPerson person) {
    final parts = <String>[];
    if (person.name.trim().isNotEmpty &&
        person.name.trim().toLowerCase() !=
            person.relation.label.toLowerCase()) {
      parts.add(person.relation.label);
    }
    if (person.deceased) parts.add('May Allah have mercy on them');
    return parts.isEmpty ? null : parts.join(' • ');
  }
}

class _ProgressRing extends StatelessWidget {
  const _ProgressRing({
    required this.controller,
    required this.seconds,
    required this.done,
  });

  final AnimationController controller;
  final int seconds;
  final bool done;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final remaining = (seconds * (1 - controller.value)).ceil();
        return SizedBox(
          width: 76,
          height: 76,
          child: Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 76,
                height: 76,
                child: CircularProgressIndicator(
                  value: done ? 1 : 1 - controller.value,
                  strokeWidth: 3,
                  color: AppColors.gold,
                  backgroundColor: AppColors.gold.withValues(alpha: 0.15),
                ),
              ),
              done
                  ? Icon(Icons.check_rounded, color: AppColors.gold, size: 30)
                  : Text(
                    '$remaining',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
            ],
          ),
        );
      },
    );
  }
}
