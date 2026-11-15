import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';

import '../models/quran_models.dart';
import '../services/quran_api_service.dart';
import '../services/quran_progress_service.dart';
import '../utils/quran_l10n.dart';
import '../../../l10n/course_numbers.dart';
import '../../../core/theme/app_colors.dart';
import 'full_quran_screen.dart';
import 'surah_reader_screen.dart';

/// Central Quran hub: daily goal with progress, weekly habit tracker,
/// stats dashboard (Today / This Week / All Time), continue-reading
/// shortcut, quick-access surah chips, and browse by surah or juz.
class QuranHubScreen extends StatefulWidget {
  const QuranHubScreen({super.key});

  @override
  State<QuranHubScreen> createState() => _QuranHubScreenState();
}

class _QuranHubScreenState extends State<QuranHubScreen> {
  final _progress = QuranProgressService.instance;

  // Commonly-read surahs for quick access chips.
  static const _quickAccess = [
    (2, 'Al-Baqarah'),
    (18, 'Al-Kahf'),
    (36, 'Ya-Sin'),
    (55, 'Ar-Rahman'),
    (56, "Al-Waqi'ah"),
    (67, 'Al-Mulk'),
    (112, 'Al-Ikhlas'),
  ];

  static const _quickAccessAr = {2: 'البقرة', 18: 'الكهف', 36: 'يس', 55: 'الرحمن', 56: 'الواقعة', 67: 'الملك', 112: 'الإخلاص'};

  Future<List<SurahMeta>>? _surahsFuture;
  Future<List<JuzMeta>>? _juzFuture;

  int _dailyGoal = 10;
  int _readToday = 0;
  List<bool> _weeklyActivity = List.filled(7, false);
  QuranPosition? _lastRead;
  List<QuranPosition> _recent = [];
  QuranStats _statsToday = const QuranStats();
  QuranStats _statsWeek = const QuranStats();
  QuranStats _statsAll = const QuranStats();
  int _statsTab = 0;
  bool _browseByJuz = false;

  @override
  void initState() {
    super.initState();
    _surahsFuture = QuranApiService.instance.fetchSurahList();
    _juzFuture = QuranApiService.instance.fetchJuzList();
    _refreshProgress();
  }

  Future<void> _refreshProgress() async {
    final goal = await _progress.getDailyGoal();
    final today = await _progress.statsFor(QuranStatsPeriod.today);
    final week = await _progress.statsFor(QuranStatsPeriod.week);
    final all = await _progress.statsFor(QuranStatsPeriod.allTime);
    final weekly = await _progress.weeklyActivity();
    final lastRead = await _progress.getLastRead();
    final recent = await _progress.getRecent();
    if (!mounted) return;
    setState(() {
      _dailyGoal = goal;
      _statsToday = today;
      _statsWeek = week;
      _statsAll = all;
      _readToday = today.versesRead;
      _weeklyActivity = weekly;
      _lastRead = lastRead;
      _recent = recent;
    });
  }

  Future<void> _openReader(int surah, {int verse = 1}) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder:
            (_) => SurahReaderScreen(surahNumber: surah, initialVerse: verse),
      ),
    );
    await _refreshProgress();
  }

  Future<void> _editGoal() async {
    final controller = TextEditingController(text: '$_dailyGoal');
    final result = await showDialog<int>(
      context: context,
      builder:
          (context) => AlertDialog(
            title: Text(qc(context, 'editGoal')),
            content: TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              autofocus: true,
              decoration: InputDecoration(
                labelText: qc(context, 'editGoalHint'),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: Text(qc(context, 'cancel')),
              ),
              FilledButton(
                onPressed:
                    () => Navigator.of(
                      context,
                    ).pop(int.tryParse(controller.text)),
                child: Text(qc(context, 'save')),
              ),
            ],
          ),
    );
    if (result != null && result > 0) {
      await _progress.setDailyGoal(result);
      await _refreshProgress();
    }
  }

  Future<void> _showSavedVerses() async {
    final bookmarks = await _progress.getBookmarks();
    final favorites = await _progress.getFavorites();
    if (!mounted) return;
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder:
          (context) => DefaultTabController(
            length: 2,
            child: Column(
              children: [
                TabBar(
                  labelColor: AppColors.textPrimary,
                  indicatorColor: AppColors.gold,
                  tabs: [
                    Tab(text: qc(context, 'bookmarks')),
                    Tab(text: qc(context, 'favorites')),
                  ],
                ),
                Expanded(
                  child: TabBarView(
                    children: [
                      _SavedList(
                        items: bookmarks,
                        emptyText: qc(context, 'noBookmarks'),
                        icon: Icons.bookmark,
                        onTap: (p) {
                          Navigator.of(context).pop();
                          _openReader(p.surah, verse: p.verse);
                        },
                      ),
                      _SavedList(
                        items: favorites,
                        emptyText: qc(context, 'noFavorites'),
                        icon: Icons.favorite,
                        onTap: (p) {
                          Navigator.of(context).pop();
                          _openReader(p.surah, verse: p.verse);
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(qc(context, 'title')),
        actions: [
          IconButton(
            icon: const Icon(Icons.bookmarks_outlined),
            tooltip: qc(context, 'bookmarks'),
            onPressed: _showSavedVerses,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 28),
        children: [
          _buildGoalCard(),
          const SizedBox(height: 14),
          _buildWeeklyTracker(),
          const SizedBox(height: 14),
          _buildStatsCard(),
          const SizedBox(height: 14),
          _buildFullQuranCard(),
          if (_lastRead != null) ...[
            const SizedBox(height: 14),
            _buildContinueCard(),
          ],
          if (_recent.isNotEmpty) ...[
            const SizedBox(height: 18),
            _sectionTitle(qc(context, 'recentlyRead')),
            const SizedBox(height: 8),
            _buildRecentChips(),
          ],
          const SizedBox(height: 18),
          _sectionTitle(qc(context, 'quickAccess')),
          const SizedBox(height: 8),
          _buildQuickAccessChips(),
          const SizedBox(height: 18),
          Row(
            children: [
              _sectionTitle(qc(context, 'allSurahs')),
              Spacer(),
              SegmentedButton<bool>(
                showSelectedIcon: false,
                style: SegmentedButton.styleFrom(
                  visualDensity: VisualDensity.compact,
                  selectedBackgroundColor: AppColors.gold,
                  selectedForegroundColor: AppColors.textPrimary,
                ),
                segments: [
                  ButtonSegment(
                    value: false,
                    label: Text(qc(context, 'bySurah')),
                  ),
                  ButtonSegment(
                    value: true,
                    label: Text(qc(context, 'byJuz')),
                  ),
                ],
                selected: {_browseByJuz},
                onSelectionChanged:
                    (selection) =>
                        setState(() => _browseByJuz = selection.first),
              ),
            ],
          ),
          const SizedBox(height: 8),
          _browseByJuz ? _buildJuzList() : _buildSurahList(),
        ],
      ),
    );
  }

  Widget _sectionTitle(String title) => Text(
    title,
    style: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w700,
      color: AppColors.textPrimary,
    ),
  );

  Widget _buildGoalCard() {
    final ratio =
        _dailyGoal == 0 ? 0.0 : (_readToday / _dailyGoal).clamp(0.0, 1.0);
    final reached = _readToday >= _dailyGoal;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.surface, AppColors.gold],
        ),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.flag_outlined, color: AppColors.gold, size: 20),
              const SizedBox(width: 8),
              Text(
                qc(context, 'dailyGoal'),
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Spacer(),
              InkWell(
                onTap: _editGoal,
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: EdgeInsets.all(4),
                  child: Icon(
                    Icons.edit_outlined,
                    color: AppColors.gold,
                    size: 18,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: ratio,
              minHeight: 10,
              backgroundColor: Colors.white.withValues(alpha: 0.15),
              valueColor: AlwaysStoppedAnimation(
                reached ? AppColors.gold : AppColors.goldLight,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            qc(context, 'versesProgress', {'read': _readToday, 'goal': _dailyGoal}),
            style: TextStyle(
              color: AppColors.textPrimary.withValues(alpha: 0.85),
              fontSize: 13,
            ),
          ),
          if (reached)
            Padding(
              padding: EdgeInsets.only(top: 4),
              child: Text(
                qc(context, 'goalReached'),
                style: TextStyle(
                  color: AppColors.gold,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildWeeklyTracker() {
    final now = DateTime.now();
    final dayLetters = quranLang(context) == 'ar'
        ? ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح']
        : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(7, (i) {
            final date = now.subtract(Duration(days: 6 - i));
            final isToday = i == 6;
            final read = _weeklyActivity[i];
            final Color fill;
            final Widget child;
            if (read) {
              fill = AppColors.gold;
              child = Icon(Icons.check, size: 18, color: AppColors.textPrimary);
            } else if (isToday) {
              fill = AppColors.gold.withValues(alpha: 0.18);
              child = Text(
                localizeNumerals(quranLang(context), '${date.day}'),
                style: TextStyle(
                  color: AppColors.gold,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              );
            } else {
              fill = AppColors.border;
              child = Text(
                localizeNumerals(quranLang(context), '${date.day}'),
                style: TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 13,
                ),
              );
            }
            return Column(
              children: [
                Text(
                  dayLetters[date.weekday - 1],
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: isToday ? AppColors.gold : Colors.grey.shade500,
                  ),
                ),
                SizedBox(height: 6),
                Container(
                  width: 34,
                  height: 34,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: fill,
                    border:
                        isToday && !read
                            ? Border.all(color: AppColors.gold, width: 2)
                            : null,
                  ),
                  child: child,
                ),
              ],
            );
          }),
        ),
      ),
    );
  }

  Widget _buildStatsCard() {
    final stats = switch (_statsTab) {
      0 => _statsToday,
      1 => _statsWeek,
      _ => _statsAll,
    };
    return Card(
      child: Padding(
        padding: EdgeInsets.all(14),
        child: Column(
          children: [
            SegmentedButton<int>(
              showSelectedIcon: false,
              style: SegmentedButton.styleFrom(
                visualDensity: VisualDensity.compact,
                selectedBackgroundColor: AppColors.gold,
                selectedForegroundColor: AppColors.surface,
              ),
              segments: [
                ButtonSegment(
                  value: 0,
                  label: Text(qc(context, 'today')),
                ),
                ButtonSegment(value: 1, label: Text(qc(context, 'week'))),
                ButtonSegment(
                  value: 2,
                  label: Text(qc(context, 'allTime')),
                ),
              ],
              selected: {_statsTab},
              onSelectionChanged:
                  (selection) => setState(() => _statsTab = selection.first),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                _statTile(
                  Icons.menu_book_outlined,
                  '${stats.versesRead}',
                  qc(context, 'verses'),
                ),
                _statTile(
                  Icons.auto_awesome_outlined,
                  _formatCount(stats.hasanat),
                  qc(context, 'hasanat'),
                ),
                _statTile(
                  Icons.timer_outlined,
                  _formatDuration(stats.secondsReading),
                  qc(context, 'time'),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                _statTile(
                  Icons.description_outlined,
                  '${stats.pages}',
                  qc(context, 'pages'),
                ),
                _statTile(
                  Icons.task_alt_outlined,
                  '${stats.surahsFinished}',
                  qc(context, 'surahs'),
                ),
                _statTile(
                  Icons.replay_outlined,
                  '${stats.sessions}',
                  qc(context, 'sessions'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  static String _formatCount(int n) {
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 10000) return '${(n / 1000).toStringAsFixed(1)}K';
    return '$n';
  }

  static String _formatDuration(int seconds) {
    if (seconds >= 3600) {
      return '${(seconds / 3600).toStringAsFixed(1)}h';
    }
    return '${(seconds / 60).ceil()}m';
  }

  Widget _statTile(IconData icon, String value, String label) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, size: 20, color: AppColors.gold),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          Text(
            label,
            style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
          ),
        ],
      ),
    );
  }

  Widget _buildFullQuranCard() {
    return Card(
      child: ListTile(
        onTap:
            () => Navigator.of(
              context,
            ).push(MaterialPageRoute(builder: (_) => const FullQuranScreen())),
        leading: CircleAvatar(
          backgroundColor: AppColors.surface,
          child: Icon(Icons.auto_stories, color: AppColors.textPrimary),
        ),
        title: Text(
          qc(context, 'fullTitle'),
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        ),
        subtitle: Text(qc(context, 'fullSubtitle')),
        trailing: Icon(Icons.chevron_right, color: AppColors.gold),
      ),
    );
  }

  Widget _buildContinueCard() {
    final last = _lastRead!;
    return Card(
      child: ListTile(
        onTap: () => _openReader(last.surah, verse: last.verse),
        leading: CircleAvatar(
          backgroundColor: AppColors.gold,
          child: Icon(Icons.play_arrow, color: AppColors.surface),
        ),
        title: Text(
          qc(context, 'continueReading'),
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        ),
        subtitle: Text('${surahNameFor(last.surah, quranLang(context), last.surahName)} \u2022 ${qc(context, 'verse')} ${last.verse}'),
        trailing: Icon(Icons.chevron_right, color: AppColors.gold),
      ),
    );
  }

  Widget _buildRecentChips() {
    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _recent.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final r = _recent[index];
          return ActionChip(
            avatar: Icon(
              Icons.history,
              size: 16,
              color: AppColors.gold,
            ),
            label: Text('${surahNameFor(r.surah, quranLang(context), r.surahName)} ${r.verse}'),
            onPressed: () => _openReader(r.surah, verse: r.verse),
          );
        },
      ),
    );
  }

  Widget _buildQuickAccessChips() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final (number, name) in _quickAccess)
          ActionChip(
            backgroundColor: AppColors.gold.withValues(alpha: 0.08),
            side: BorderSide(color: AppColors.gold.withValues(alpha: 0.3)),
            label: Text(
              quranLang(context) == 'ar' ? (_quickAccessAr[number] ?? name) : surahNameFor(number, quranLang(context), name),
              style: TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w600,
              ),
            ),
            onPressed: () => _openReader(number),
          ),
      ],
    );
  }

  Widget _buildSurahList() {
    return FutureBuilder<List<SurahMeta>>(
      future: _surahsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Padding(
            padding: EdgeInsets.all(24),
            child: Center(child: CircularProgressIndicator()),
          );
        }
        final surahs = snapshot.data;
        if (surahs == null) {
          return _inlineError(
            () => setState(() {
              _surahsFuture = QuranApiService.instance.fetchSurahList();
            }),
          );
        }
        return Column(
          children: [
            for (final surah in surahs)
              Card(
                margin: const EdgeInsets.only(bottom: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: AppColors.gold, width: 1),
                ),
                child: ListTile(
                  onTap: () => _openReader(surah.number),
                  leading: Container(
                    width: 38,
                    height: 38,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: AppColors.gold.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.gold, width: 1),
                    ),
                    child: Text(
                      '${surah.number}',
                      style: TextStyle(
                        color: AppColors.gold,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  title: Text(
                    surahTitle(surah, quranLang(context)),
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                  ),
                  subtitle: Text(
                    [surahMeaning(surah, quranLang(context)), qc(context, 'versesCount', {'n': surah.verseCount})].where((s) => s.isNotEmpty).join(' \u2022 '),
                    style: const TextStyle(fontSize: 12),
                  ),
                  trailing: Text(
                    quranLang(context) == 'ar' ? '' : surah.arabicName,
                    textDirection: TextDirection.rtl,
                    style: TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 17,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  Widget _buildJuzList() {
    return FutureBuilder<List<JuzMeta>>(
      future: _juzFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Padding(
            padding: EdgeInsets.all(24),
            child: Center(child: CircularProgressIndicator()),
          );
        }
        final juzList = snapshot.data;
        if (juzList == null) {
          return _inlineError(
            () => setState(() {
              _juzFuture = QuranApiService.instance.fetchJuzList();
            }),
          );
        }
        return FutureBuilder<List<SurahMeta>>(
          future: _surahsFuture,
          builder: (context, surahSnapshot) {
            final surahs = surahSnapshot.data;
            return Column(
              children: [
                for (final juz in juzList)
                  Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: AppColors.gold, width: 1),
                    ),
                    child: ListTile(
                      onTap:
                          () => _openReader(
                            juz.startSurah,
                            verse: juz.startVerse,
                          ),
                      leading: Container(
                        width: 38,
                        height: 38,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: AppColors.gold.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.gold, width: 1),
                        ),
                        child: Text(
                          '${juz.number}',
                          style: TextStyle(
                            color: AppColors.gold,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      title: Text(
                        '${qc(context, 'juz')} ${juz.number}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                        ),
                      ),
                      subtitle: Text(
                        surahs == null
                            ? qc(context, 'startsAt', {'s': '${juz.startSurah}', 'v': juz.startVerse})
                            : qc(context, 'startsAt', {'s': surahTitle(surahs[juz.startSurah - 1], quranLang(context)), 'v': juz.startVerse}),
                        style: const TextStyle(fontSize: 12),
                      ),
                      trailing: Icon(
                        Icons.chevron_right,
                        color: AppColors.gold,
                      ),
                    ),
                  ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _inlineError(VoidCallback onRetry) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Text(
            qc(context, 'loadError'),
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: onRetry,
            child: Text(qc(context, 'retry')),
          ),
        ],
      ),
    );
  }
}

class _SavedList extends StatelessWidget {
  final List<QuranPosition> items;
  final String emptyText;
  final IconData icon;
  final void Function(QuranPosition) onTap;

  const _SavedList({
    required this.items,
    required this.emptyText,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return Center(
        child: Text(emptyText, style: TextStyle(color: Colors.grey.shade600)),
      );
    }
    return ListView.builder(
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return ListTile(
          leading: Icon(icon, color: AppColors.gold, size: 20),
          title: Text('${surahNameFor(item.surah, quranLang(context), item.surahName)} \u2022 ${qc(context, 'verse')} ${item.verse}'),
          onTap: () => onTap(item),
        );
      },
    );
  }
}
