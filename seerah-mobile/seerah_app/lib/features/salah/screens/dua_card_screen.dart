import 'dart:async';

import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';

import '../../../core/theme/app_colors.dart';
import '../models/dua.dart';

/// A calm, timed moment to make du'a for everyone on the user's list, one
/// person at a time.
///
/// Deliberately NOT the "Allah is calling" call screen: no ringing, no
/// Answer/Decline. It holds the screen quietly for [seconds] per person (30
/// or 60, the user's choice) with that person's name and a du'a, then
/// automatically rotates to the next person — doing this for every person in
/// [people] before closing itself. The user can move on early with "Ameen"
/// or end the whole session with "Not now".
class DuaCardScreen extends StatefulWidget {
  const DuaCardScreen({
    super.key,
    required this.people,
    required this.seconds,
    this.startIndex = 0,
  });

  /// Everyone to make du'a for, in list order. Empty shows a single general
  /// du'a for "your loved ones" instead.
  final List<DuaPerson> people;

  /// How long to spend on each person before auto-advancing.
  final int seconds;

  /// Which person to start on (e.g. the one named in the notification that
  /// opened this screen). Rotation still wraps around to cover everyone
  /// else on the list afterward.
  final int startIndex;

  @override
  State<DuaCardScreen> createState() => _DuaCardScreenState();
}

class _DuaCardScreenState extends State<DuaCardScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _progress;
  late final List<DuaPerson?> _order;
  Timer? _closeTimer;
  int _index = 0;
  bool _done = false;

  @override
  void initState() {
    super.initState();
    _order = _buildOrder();
    _progress = AnimationController(
      vsync: this,
      duration: Duration(seconds: widget.seconds),
    )..addStatusListener((status) {
      if (status == AnimationStatus.completed) _finishCurrent();
    });
    _progress.forward();
  }

  /// The people to show, starting at [DuaCardScreen.startIndex] and wrapping
  /// around the full list so everyone gets their turn. An empty list is
  /// represented as a single `null` entry (the general du'a).
  List<DuaPerson?> _buildOrder() {
    final people = widget.people;
    if (people.isEmpty) return const [null];
    final n = people.length;
    final start = widget.startIndex % n;
    return List.generate(n, (i) => people[(start + i) % n]);
  }

  bool get _isLastPerson => _index >= _order.length - 1;

  /// The current person's time is up (or the user said Ameen for them):
  /// show a short closing line, then either rotate to the next person or,
  /// if this was the last one, leave on our own.
  void _finishCurrent() {
    if (_done || !mounted) return;
    setState(() => _done = true);
    _progress.stop();
    _closeTimer = Timer(const Duration(milliseconds: 1400), () {
      if (!mounted) return;
      if (_isLastPerson) {
        Navigator.of(context).maybePop();
      } else {
        _advance();
      }
    });
  }

  void _advance() {
    if (!mounted) return;
    setState(() {
      _index++;
      _done = false;
    });
    _progress
      ..reset()
      ..forward();
  }

  /// Ends the whole session (not just the current person).
  void _stop() {
    _closeTimer?.cancel();
    if (mounted) Navigator.of(context).maybePop();
  }

  @override
  void dispose() {
    _closeTimer?.cancel();
    _progress.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final person = _order[_index];
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
    final showsMultiple = _order.length > 1;

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
                if (showsMultiple) ...[
                  const SizedBox(height: 8),
                  _DotProgress(current: _index, total: _order.length),
                ],
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
                                  onPressed: _finishCurrent,
                                  child: Text(
                                    showsMultiple && !_isLastPerson
                                        ? 'Ameen — next'
                                        : 'Ameen',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                              ),
                              TextButton(
                                onPressed: _stop,
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

/// Small row of dots showing progress through the list of people (e.g.
/// "person 2 of 5"), without spelling out the count in words.
class _DotProgress extends StatelessWidget {
  const _DotProgress({required this.current, required this.total});

  final int current;
  final int total;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < total; i++)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 3),
            child: Container(
              width: i == current ? 8 : 6,
              height: i == current ? 8 : 6,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color:
                    i == current
                        ? AppColors.gold
                        : AppColors.gold.withValues(alpha: 0.25),
              ),
            ),
          ),
      ],
    );
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
