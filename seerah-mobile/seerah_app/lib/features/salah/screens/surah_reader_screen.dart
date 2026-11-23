import 'dart:async';

import 'package:audioplayers/audioplayers.dart';
import 'package:confetti/confetti.dart';
import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';

import '../models/prayer_settings.dart';
import '../models/quran_models.dart';
import '../services/quran_api_service.dart';
import '../services/quran_progress_service.dart';
import '../services/tafsir_service.dart';
import '../utils/quran_fonts.dart';
import '../utils/quran_l10n.dart';
import '../../../core/theme/app_colors.dart';

/// Reads one surah: Arabic, English translation and transliteration per
/// verse, with audio, bookmarks, favorites and expandable tafsir.
///
/// Two modes: a scrolling list of all verses, and a verse-by-verse
/// card mode with forward/back buttons (PageView). Verse-by-verse mode
/// continues across surah boundaries: Next on a surah's last verse plays
/// a short confetti celebration and moves to the next surah's first
/// verse; Previous on verse 1 moves to the previous surah's last verse.
class SurahReaderScreen extends StatefulWidget {
  final int surahNumber;
  final int initialVerse;

  const SurahReaderScreen({
    super.key,
    required this.surahNumber,
    this.initialVerse = 1,
  });

  @override
  State<SurahReaderScreen> createState() => _SurahReaderScreenState();
}

class _SurahReaderScreenState extends State<SurahReaderScreen> {
  static const int _lastSurah = 114;

  final _progress = QuranProgressService.instance;
  final _player = AudioPlayer();
  final Stopwatch _sessionWatch = Stopwatch()..start();
  final ConfettiController _confetti = ConfettiController(
    duration: const Duration(milliseconds: 1600),
  );

  /// Surah currently shown; changes as verse-by-verse mode crosses
  /// surah boundaries.
  late int _surahNumber;

  Future<SurahContent>? _future;
  bool _swipeMode = false;
  PageController? _pageController;
  int _currentPage = 0;

  /// Resolved content for [_future], kept in sync so the audio-completion
  /// listener (which runs outside of build) can look up "the next verse"
  /// without re-awaiting the future itself.
  SurahContent? _loadedContent;

  /// True while verses are being played back-to-back (either "Play Surah"
  /// or a chain started from a single verse tap continuing automatically).
  /// When true, finishing one verse's audio smoothly starts the next.
  bool _continuousPlayback = false;

  /// Blocks the nav buttons while the confetti celebration runs.
  bool _celebrating = false;

  /// The An-Nas finish celebration only fires once per visit.
  bool _quranEndCelebrated = false;

  /// Uthmani Bismillah (from the API) used to display it separately
  /// instead of glued to verse 1.
  String? _bismillah;

  /// Verses counted as read during this visit (numberInSurah).
  final Set<int> _readThisSession = {};

  /// "$surah:$verse:$lang" keys already handed to [_prefetchUpcomingTafsir],
  /// so repeated rebuilds of the same verse (e.g. scroll-mode's
  /// per-item postFrameCallback) don't keep re-kicking off the same
  /// lookups. TafsirService/TafsirTranslator already cache in memory and on
  /// disk too, but this avoids the redundant calls entirely.
  final Set<String> _tafsirPrefetched = {};
  final Set<int> _bookmarked = {};
  final Set<int> _favorited = {};

  int? _playingVerse;
  int _dailyGoal = 10;
  int _readToday = 0;
  bool _goalCelebrated = false;

  @override
  void initState() {
    super.initState();
    _surahNumber = widget.surahNumber;
    _swipeMode = widget.initialVerse > 1;
    _currentPage = (widget.initialVerse - 1).clamp(0, 9999);
    _setFuture(QuranApiService.instance.fetchSurah(_surahNumber, lang: quranLang(context)));
    _loadState();
    _loadBismillah();
    _player.onPlayerComplete.listen((_) {
      if (!mounted) return;
      final finished = _playingVerse;
      setState(() => _playingVerse = null);
      if (_continuousPlayback && finished != null) {
        unawaited(_playNextInSequence(finished));
      }
    });
  }

  /// Assigns [_future] and keeps [_loadedContent] in sync once it
  /// resolves, so audio autoplay always has the current verse list handy.
  void _setFuture(Future<SurahContent> future) {
    _future = future;
    _loadedContent = null;
    future.then((content) {
      if (mounted) setState(() => _loadedContent = content);
    });
  }

  Future<void> _loadBismillah() async {
    try {
      final bismillah = await QuranApiService.instance.fetchBismillah();
      if (mounted) setState(() => _bismillah = bismillah);
    } catch (_) {
      // Offline with no cache: verse 1 keeps its embedded Bismillah.
    }
  }

  /// True when this surah shows a separate Bismillah line (all except
  /// Al-Fatihah, where it IS verse 1, and At-Tawbah, which has none).
  bool get _showsBismillah =>
      _surahNumber != 1 && _surahNumber != 9 && _bismillah != null;

  /// Verse text with the embedded Bismillah prefix split off verse 1,
  /// since it is rendered as its own centered line.
  String _displayArabic(QuranVerse verse) {
    final bismillah = _bismillah;
    if (verse.numberInSurah == 1 &&
        _showsBismillah &&
        bismillah != null &&
        verse.arabic.startsWith(bismillah)) {
      final stripped = verse.arabic.substring(bismillah.length).trimLeft();
      if (stripped.isNotEmpty) return stripped;
    }
    return verse.arabic;
  }

  Widget _buildBismillahLine(QuranFontOption quranFont) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Text(
        _bismillah!,
        textAlign: TextAlign.center,
        textDirection: TextDirection.rtl,
        style: quranTextStyle(
          quranFont,
          TextStyle(
            fontSize: 24,
            height: 1.8,
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Future<void> _loadState() async {
    _dailyGoal = await _progress.getDailyGoal();
    final todayStats = await _progress.statsFor(QuranStatsPeriod.today);
    _readToday = todayStats.versesRead;
    _goalCelebrated = _readToday >= _dailyGoal;
    final bookmarks = await _progress.getBookmarks();
    final favorites = await _progress.getFavorites();
    if (!mounted) return;
    setState(() {
      _bookmarked
        ..clear()
        ..addAll(
          bookmarks.where((b) => b.surah == _surahNumber).map((b) => b.verse),
        );
      _favorited
        ..clear()
        ..addAll(
          favorites.where((f) => f.surah == _surahNumber).map((f) => f.verse),
        );
    });
  }

  @override
  void dispose() {
    _player.dispose();
    _pageController?.dispose();
    _confetti.dispose();
    _sessionWatch.stop();
    // Fire-and-forget: persist the reading session time.
    _progress.addReadingSession(_sessionWatch.elapsed);
    super.dispose();
  }

  /// Quietly warms the tafsir cache for the verse just shown plus the next
  /// couple, in the background, so that by the time the reader actually
  /// taps "Tafsir" — usually a verse or two after they started reading it —
  /// the lookup (network call, or for German/Malay/Swahili, on-device
  /// translation) has often already finished. Never surfaces errors or
  /// blocks the UI; a failed/slow prefetch just means the normal on-tap
  /// lookup happens as before.
  void _prefetchUpcomingTafsir(SurahContent content, QuranVerse verse) {
    final lang = quranLang(context);
    final startIndex = content.verses.indexWhere(
      (v) => v.numberInSurah == verse.numberInSurah,
    );
    if (startIndex < 0) return;
    for (var i = startIndex; i < startIndex + 3 && i < content.verses.length; i++) {
      final v = content.verses[i];
      final key = '$_surahNumber:${v.numberInSurah}:$lang';
      if (!_tafsirPrefetched.add(key)) continue;
      unawaited(TafsirService.instance.getTafsir(_surahNumber, v.numberInSurah, lang));
    }
  }

  /// Verse-by-verse (swipe) mode: each verse is counted automatically as
  /// it comes into view, same as always.
  Future<void> _onVerseSeen(SurahContent content, QuranVerse verse) async {
    _prefetchUpcomingTafsir(content, verse);
    await _recordVerseRead(content, verse);
  }

  /// Records a verse as read (hasanat, last-read position, recents, daily
  /// goal, surah-finished). In scroll mode this only runs when the reader
  /// taps the verse number; in swipe mode it runs automatically for the
  /// verse currently shown (see [_onVerseSeen]).
  Future<void> _recordVerseRead(SurahContent content, QuranVerse verse) async {
    // Called un-awaited from audio-sequence callbacks that can resolve after
    // the reader was closed; setState on an unmounted State throws
    // "Null check operator used on a null value" (Sentry SEERAH-MOBILE-4).
    if (!mounted) return;
    if (_readThisSession.contains(verse.numberInSurah)) return;
    setState(() => _readThisSession.add(verse.numberInSurah));

    final position = QuranPosition(
      surah: _surahNumber,
      verse: verse.numberInSurah,
      surahName: surahTitle(content.meta, quranLang(context)),
    );
    unawaited(_progress.setLastRead(position));
    unawaited(_progress.addRecent(position));

    final counted = await _progress.recordVerseRead(
      surah: _surahNumber,
      verse: verse.numberInSurah,
      arabicText: verse.arabic,
      page: verse.page,
    );
    if (counted) {
      _readToday += 1;
      if (_readToday >= _dailyGoal && !_goalCelebrated && mounted) {
        _goalCelebrated = true;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(qc(context, 'goalReached'))),
        );
      }
    }
    if (verse.numberInSurah == content.meta.verseCount) {
      unawaited(_progress.markSurahFinished(_surahNumber));
    }
  }

  /// Tapping a verse's play button starts listening from there and
  /// autoplays smoothly into the following ayat (so playing any verse
  /// doubles as "listen to the rest of the surah from here"). Tapping the
  /// button again while that verse is playing stops playback entirely
  /// rather than just skipping ahead.
  Future<void> _toggleAudio(QuranVerse verse) async {
    if (_playingVerse == verse.numberInSurah) {
      await _player.stop();
      setState(() {
        _playingVerse = null;
        _continuousPlayback = false;
      });
      return;
    }
    await _playVerseAudio(verse, continuous: true);
  }

  Future<void> _playVerseAudio(QuranVerse verse, {required bool continuous}) async {
    if (!mounted) return;
    setState(() {
      _playingVerse = verse.numberInSurah;
      _continuousPlayback = continuous;
    });
    try {
      await _player.stop();
      await _player.play(UrlSource(verse.audioUrl));
    } catch (_) {
      if (mounted) setState(() => _playingVerse = null);
    }
  }

  /// Called when a verse finishes while [_continuousPlayback] is on: moves
  /// to the next verse with a short, smooth gap (a clean breath between
  /// ayahs rather than an abrupt instant cut), keeps reading progress in
  /// sync, and — in swipe mode — animates the card to follow the narration.
  /// Reaching the surah's last verse simply stops; it doesn't auto-advance
  /// into the next surah, so "listen to the whole surah" ends cleanly.
  Future<void> _playNextInSequence(int finishedVerseNumber) async {
    final content = _loadedContent;
    if (content == null) {
      if (mounted) setState(() => _continuousPlayback = false);
      return;
    }
    final idx = content.verses.indexWhere((v) => v.numberInSurah == finishedVerseNumber);
    if (idx < 0 || idx + 1 >= content.verses.length) {
      if (mounted) setState(() => _continuousPlayback = false);
      return;
    }
    await Future<void>.delayed(const Duration(milliseconds: 300));
    if (!mounted || !_continuousPlayback) return;
    final next = content.verses[idx + 1];
    await _playVerseAudio(next, continuous: true);
    if (!mounted) return;
    unawaited(_recordVerseRead(content, next));
    if (_swipeMode && mounted) {
      final nextPage = content.verses.indexOf(next);
      final controller = _pageController;
      if (nextPage >= 0 && controller != null && controller.hasClients) {
        setState(() => _currentPage = nextPage);
        unawaited(
          controller.animateToPage(
            nextPage,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          ),
        );
      }
    }
  }

  /// "Listen to the whole surah": starts (or stops) continuous playback.
  /// In swipe mode it starts from the verse currently on screen; in scroll
  /// mode it starts from the beginning of the surah.
  Future<void> _toggleSurahPlayback(SurahContent content) async {
    if (_continuousPlayback) {
      await _player.stop();
      setState(() {
        _playingVerse = null;
        _continuousPlayback = false;
      });
      return;
    }
    if (content.verses.isEmpty) return;
    final startVerse = _swipeMode
        ? content.verses[_currentPage.clamp(0, content.verses.length - 1)]
        : content.verses.first;
    await _playVerseAudio(startVerse, continuous: true);
    unawaited(_recordVerseRead(content, startVerse));
  }

  Future<void> _toggleBookmark(SurahContent content, QuranVerse verse) async {
    final added = await _progress.toggleBookmark(
      QuranPosition(
        surah: _surahNumber,
        verse: verse.numberInSurah,
        surahName: surahTitle(content.meta, quranLang(context)),
      ),
    );
    if (!mounted) return;
    setState(() {
      added
          ? _bookmarked.add(verse.numberInSurah)
          : _bookmarked.remove(verse.numberInSurah);
    });
  }

  Future<void> _toggleFavorite(SurahContent content, QuranVerse verse) async {
    final added = await _progress.toggleFavorite(
      QuranPosition(
        surah: _surahNumber,
        verse: verse.numberInSurah,
        surahName: surahTitle(content.meta, quranLang(context)),
      ),
    );
    if (!mounted) return;
    setState(() {
      added
          ? _favorited.add(verse.numberInSurah)
          : _favorited.remove(verse.numberInSurah);
    });
  }

  @override
  Widget build(BuildContext context) {
    // Resolved here (this State's real build) and threaded down through
    // _buildScrollMode/_buildSwipeMode/_buildBismillahLine/_buildVerseCard,
    // since those run from ListView/PageView's lazy itemBuilder — calling
    // context.select from inside them directly trips Provider's "outside
    // of build" assertion.
    final quranFont = watchQuranFont(context);
    return FutureBuilder<SurahContent>(
      future: _future,
      builder: (context, snapshot) {
        final content = snapshot.data;
        return Scaffold(
          appBar: AppBar(
            title: Text(content != null ? surahTitle(content.meta, quranLang(context)) : '${qc(context, 'bySurah')} $_surahNumber'),
            actions: [
              if (content != null)
                IconButton(
                  icon: Icon(
                    _continuousPlayback
                        ? Icons.stop_circle_outlined
                        : Icons.headphones_outlined,
                  ),
                  tooltip: qc(context, 'playSurah'),
                  onPressed: () => _toggleSurahPlayback(content),
                ),
              IconButton(
                icon: const Icon(Icons.text_fields),
                tooltip: 'Quran Font',
                onPressed: () => showQuranFontPicker(context),
              ),
              IconButton(
                icon: Icon(
                  _swipeMode ? Icons.view_agenda_outlined : Icons.swipe,
                ),
                tooltip: _swipeMode ? qc(context, 'scrollMode') : qc(context, 'verseMode'),
                onPressed: () => setState(() => _swipeMode = !_swipeMode),
              ),
            ],
          ),
          body: Stack(
            children: [
              switch (snapshot.connectionState) {
                ConnectionState.waiting => const Center(
                  child: CircularProgressIndicator(),
                ),
                _ when snapshot.hasError || content == null => _ErrorView(
                  onRetry:
                      () => setState(() {
                        _setFuture(QuranApiService.instance.fetchSurah(_surahNumber, lang: quranLang(context)));
                      }),
                ),
                _ =>
                  _swipeMode
                      ? _buildSwipeMode(content, quranFont)
                      : _buildScrollMode(content, quranFont),
              },
              Align(
                alignment: Alignment.topCenter,
                child: ConfettiWidget(
                  confettiController: _confetti,
                  blastDirectionality: BlastDirectionality.explosive,
                  numberOfParticles: 70,
                  maxBlastForce: 34,
                  minBlastForce: 14,
                  emissionFrequency: 0.06,
                  gravity: 0.25,
                  colors: [
                    AppColors.gold,
                    AppColors.goldLight,
                    AppColors.gold,
                    AppColors.surface,
                    Colors.white,
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildScrollMode(SurahContent content, QuranFontOption quranFont) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      itemCount: content.verses.length + 1,
      itemBuilder: (context, index) {
        if (index == 0) {
          return Column(
            children: [
              _SurahHeader(meta: content.meta),
              if (_showsBismillah) _buildBismillahLine(quranFont),
            ],
          );
        }
        final verse = content.verses[index - 1];
        // Scroll mode doesn't auto-count hasanat just by scrolling a verse
        // into view — only warm the tafsir cache here. Counting happens
        // when the reader taps the verse number (see _buildVerseCard).
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _prefetchUpcomingTafsir(content, verse);
        });
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _buildVerseCard(
            content,
            verse,
            quranFont,
            tapToCount: true,
          ),
        );
      },
    );
  }

  Widget _buildSwipeMode(SurahContent content, QuranFontOption quranFont) {
    final lastPage = content.verses.length - 1;
    final page = _currentPage.clamp(0, lastPage);
    _pageController ??= PageController(initialPage: page);
    // Previous/Next cross surah boundaries; they only disappear at the
    // absolute ends of the Quran (Al-Fatihah 1:1 and An-Nas 114:6).
    final isQuranStart = _surahNumber == 1 && page == 0;
    final isQuranEnd = _surahNumber == _lastSurah && page == lastPage;

    // Count the initially shown verse.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _onVerseSeen(content, content.verses[page]);
    });

    // Reaching the very last verse of the Quran: celebrate, stay put.
    if (isQuranEnd && !_quranEndCelebrated) {
      _quranEndCelebrated = true;
      WidgetsBinding.instance.addPostFrameCallback((_) => _confetti.play());
    }

    return Column(
      children: [
        Expanded(
          child: PageView.builder(
            controller: _pageController,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: content.verses.length,
            onPageChanged: (newPage) {
              setState(() => _currentPage = newPage);
              _onVerseSeen(content, content.verses[newPage]);
            },
            itemBuilder: (context, index) {
              final verse = content.verses[index];
              return SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _SurahHeader(meta: content.meta),
                    if (verse.numberInSurah == 1 && _showsBismillah)
                      _buildBismillahLine(quranFont),
                    _buildVerseCard(
                      content,
                      verse,
                      quranFont,
                      tapToCount: false,
                    ),
                  ],
                ),
              );
            },
          ),
        ),
        DecoratedBox(
          decoration: BoxDecoration(
            color: AppColors.card,
            border: Border(top: BorderSide(color: AppColors.border)),
          ),
          child: SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      if (!isQuranStart)
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed:
                                _celebrating
                                    ? null
                                    : () =>
                                        page > 0
                                            ? _goToPage(page - 1)
                                            : _goToSurah(
                                              _surahNumber - 1,
                                              page: 1 << 20,
                                            ),
                            icon: const Icon(Icons.arrow_back),
                            label: Text(qc(context, 'previous')),
                            style: OutlinedButton.styleFrom(
                              backgroundColor: Colors.transparent,
                              foregroundColor: AppColors.textPrimary,
                              side: BorderSide(
                                color: AppColors.gold.withValues(alpha: 0.4),
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                          ),
                        ),
                      if (!isQuranStart && !isQuranEnd)
                        const SizedBox(width: 12),
                      if (!isQuranEnd)
                        Expanded(
                          child: FilledButton.icon(
                            onPressed:
                                _celebrating
                                    ? null
                                    : () =>
                                        page < lastPage
                                            ? _goToPage(page + 1)
                                            : _finishSurahAndAdvance(),
                            icon: const Icon(Icons.arrow_forward),
                            label: Text(qc(context, 'next')),
                            iconAlignment: IconAlignment.end,
                            style: FilledButton.styleFrom(
                              backgroundColor: AppColors.gold,
                              foregroundColor: AppColors.onGold,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    '${page + 1} / ${content.meta.verseCount}',
                    style: TextStyle(
                      fontSize: 13,
                      color: AppColors.textPrimary.withValues(alpha: 0.55),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  void _goToPage(int page) {
    _pageController?.jumpToPage(page);
  }

  /// Switches verse-by-verse mode to another surah. [page] is clamped to
  /// the new surah's verse range, so a huge value means "last verse".
  void _goToSurah(int surah, {required int page}) {
    setState(() {
      _surahNumber = surah;
      _setFuture(QuranApiService.instance.fetchSurah(surah, lang: quranLang(context)));
      _pageController?.dispose();
      _pageController = null;
      _currentPage = page;
      _readThisSession.clear();
    });
    _loadState();
  }

  /// Confetti celebration for finishing a surah, then on to the next one.
  void _finishSurahAndAdvance() {
    setState(() => _celebrating = true);
    _confetti.play();
    Timer(const Duration(milliseconds: 1800), () {
      if (!mounted) return;
      _celebrating = false;
      _goToSurah(_surahNumber + 1, page: 0);
    });
  }

  Widget _buildVerseCard(
    SurahContent content,
    QuranVerse verse,
    QuranFontOption quranFont, {
    required bool tapToCount,
  }) {
    final playing = _playingVerse == verse.numberInSurah;
    final bookmarked = _bookmarked.contains(verse.numberInSurah);
    final favorited = _favorited.contains(verse.numberInSurah);
    final hasanat = QuranProgressService.hasanatForText(verse.arabic);
    // In scroll mode, hasanat are only counted once the reader taps the
    // verse number below; in swipe mode they're already counted by the
    // time this builds (see _onVerseSeen), so `counted` is always true.
    final counted = !tapToCount || _readThisSession.contains(verse.numberInSurah);

    final numberBadge = Container(
      width: 32,
      height: 32,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: counted ? AppColors.gold : AppColors.surface,
        border: Border.all(color: AppColors.gold, width: 1),
      ),
      child:
          counted && tapToCount
              ? Icon(Icons.check, size: 16, color: AppColors.onGold)
              : Text(
                '${verse.numberInSurah}',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
    );

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: AppColors.gold, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                tapToCount
                    ? Tooltip(
                      message: qc(context, 'tapNumberToCount'),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(16),
                        onTap:
                            counted
                                ? null
                                : () => _recordVerseRead(content, verse),
                        child: numberBadge,
                      ),
                    )
                    : numberBadge,
                const Spacer(),
                Text(
                  counted
                      ? qc(context, 'hasanatNote', {'n': hasanat})
                      : qc(context, 'tapNumberToCount'),
                  textAlign: TextAlign.right,
                  style: TextStyle(
                    fontSize: 11,
                    color:
                        counted
                            ? AppColors.gold
                            : AppColors.textPrimary.withValues(alpha: 0.45),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              _displayArabic(verse),
              textAlign: TextAlign.right,
              textDirection: TextDirection.rtl,
              style: quranTextStyle(
                quranFont,
                TextStyle(
                  fontSize: 24,
                  height: 1.9,
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            if (verse.transliteration.isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(
                verse.transliteration,
                style: TextStyle(
                  fontSize: 13,
                  fontStyle: FontStyle.italic,
                  height: 1.5,
                  color: AppColors.textPrimary.withValues(alpha: 0.6),
                ),
              ),
            ],
            const SizedBox(height: 10),
            Text(
              verse.translation,
              style: const TextStyle(fontSize: 15, height: 1.5),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                IconButton(
                  icon: Icon(
                    playing
                        ? Icons.stop_circle_outlined
                        : Icons.play_circle_outline,
                    color: AppColors.gold,
                  ),
                  tooltip: qc(context, 'play'),
                  onPressed: () => _toggleAudio(verse),
                ),
                IconButton(
                  icon: Icon(
                    bookmarked ? Icons.bookmark : Icons.bookmark_border,
                    color: bookmarked ? AppColors.gold : AppColors.gold,
                  ),
                  tooltip: qc(context, 'bookmark'),
                  onPressed: () => _toggleBookmark(content, verse),
                ),
                IconButton(
                  icon: Icon(
                    favorited ? Icons.favorite : Icons.favorite_border,
                    color: favorited ? AppColors.gold : AppColors.gold,
                  ),
                  tooltip: qc(context, 'favorite'),
                  onPressed: () => _toggleFavorite(content, verse),
                ),
                const Spacer(),
              ],
            ),
            _TafsirSection(surah: _surahNumber, verse: verse.numberInSurah),
          ],
        ),
      ),
    );
  }
}

class _SurahHeader extends StatelessWidget {
  final SurahMeta meta;

  const _SurahHeader({required this.meta});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
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
        children: [
          Text(
            meta.arabicName,
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 26,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            [surahTitle(meta, quranLang(context)), surahMeaning(meta, quranLang(context))].where((s) => s.isNotEmpty).join(' \u2022 '),
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.textPrimary.withValues(alpha: 0.85),
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            '${qc(context, 'versesCount', {'n': meta.verseCount})} \u2022 ${revelationLabel(quranLang(context), meta.revelationType)}',
            style: TextStyle(
              color: AppColors.textPrimary.withValues(alpha: 0.6),
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

/// Expandable per-verse tafsir loaded lazily from local assets with a
/// cached network fallback.
class _TafsirSection extends StatefulWidget {
  final int surah;
  final int verse;

  const _TafsirSection({required this.surah, required this.verse});

  @override
  State<_TafsirSection> createState() => _TafsirSectionState();
}

class _TafsirSectionState extends State<_TafsirSection> {
  bool _expanded = false;
  Future<String?>? _future;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: () {
            setState(() {
              _expanded = !_expanded;
              _future ??= TafsirService.instance.getTafsir(
                widget.surah,
                widget.verse,
                quranLang(context),
              );
            });
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              children: [
                Icon(
                  Icons.menu_book_outlined,
                  size: 18,
                  color: AppColors.gold,
                ),
                const SizedBox(width: 8),
                Text(
                  qc(context, 'tafsir'),
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textMuted,
                  ),
                ),
                const Spacer(),
                Icon(
                  _expanded ? Icons.expand_less : Icons.expand_more,
                  size: 20,
                  color: AppColors.gold,
                ),
              ],
            ),
          ),
        ),
        if (_expanded)
          FutureBuilder<String?>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: Center(
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
                );
              }
              final text = snapshot.data;
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.textPrimary,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    text ?? qc(context, 'tafsirUnavailable'),
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.5,
                      color:
                          text == null
                              ? Colors.black.withValues(alpha: 0.5)
                              : Colors.black.withValues(alpha: 0.75),
                    ),
                  ),
                ),
              );
            },
          ),
      ],
    );
  }
}

class _ErrorView extends StatelessWidget {
  final VoidCallback onRetry;

  const _ErrorView({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.wifi_off_outlined,
              size: 44,
              color: AppColors.gold,
            ),
            const SizedBox(height: 16),
            Text(
              qc(context, 'loadError'),
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 15),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: onRetry,
              child: Text(qc(context, 'retry')),
            ),
          ],
        ),
      ),
    );
  }
}
