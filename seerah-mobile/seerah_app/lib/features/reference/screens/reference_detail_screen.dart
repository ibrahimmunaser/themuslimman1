import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/app_colors.dart';
import '../data/reference_data.dart';

class ReferenceDetailScreen extends StatelessWidget {
  final String sectionId;
  const ReferenceDetailScreen({super.key, required this.sectionId});

  @override
  Widget build(BuildContext context) {
    final section = kReferenceSections.firstWhere(
      (s) => s.id == sectionId,
      orElse: () => const ReferenceSection(id: '', title: 'Not Found', description: ''),
    );

    return Scaffold(
      appBar: AppBar(title: Text(section.title)),
      body: _buildContent(context),
    );
  }

  Widget _buildContent(BuildContext context) {
    switch (sectionId) {
      case 'family-household':  return _FamilyHouseholdContent();
      case 'timeline':          return _TimelineContent();
      case 'key-people':        return _KeyPeopleContent();
      case 'battles':           return _BattlesContent();
      case 'miracles':          return _MiraclesContent();
      case 'important-terms':   return _TermsContent();
      case 'places-maps':       return _PlacesContent();
      case 'tribes-lineage':    return _TribesContent();
      default:
        return const Center(
          child: Text('Section not yet available.', style: TextStyle(color: AppColors.textSecondary)));
    }
  }
}

// ── Shared widgets ────────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  const _SectionHeader({required this.title, this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
            style: const TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.w700)),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(subtitle!,
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4)),
          ],
        ],
      ),
    );
  }
}

class _SubTitle extends StatelessWidget {
  final String text;
  const _SubTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(text, style: const TextStyle(
        color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w700)),
    );
  }
}

// ── Family & Household ────────────────────────────────────────────────────────

class _FamilyHouseholdContent extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.only(bottom: 32),
      children: [
        _SectionHeader(
          title: 'Family & Household',
          subtitle: 'Wives, children, and household of the Prophet ﷺ',
        ).animate().fadeIn(duration: 400.ms),

        _SubTitle('Wives of the Prophet ﷺ (Mothers of the Believers)'),
        ...kWives.asMap().entries.map((e) {
          final w = e.value;
          return _InfoCard(
            title: w.name,
            subtitle: w.hasChildren ? 'Had children with the Prophet ﷺ' : null,
            body: w.notes,
            accentColor: w.hasChildren ? AppColors.success : AppColors.textMuted,
          ).animate(delay: (e.key * 40).ms).fadeIn(duration: 300.ms);
        }),

        _SubTitle('Children of the Prophet ﷺ'),
        ...kChildren.asMap().entries.map((e) {
          final c = e.value;
          return _InfoCard(
            title: c.name,
            subtitle: 'Mother: ${c.mother}',
            body: c.notes,
          ).animate(delay: (e.key * 40).ms).fadeIn(duration: 300.ms);
        }),

        const _NoteCard(
          'Historical Note',
          'Some scholars counted Rayhana bint Zayd among the wives of the Prophet ﷺ while others considered her differently. Her status is noted here as a matter of historical difference of opinion.',
        ),
      ],
    );
  }
}

// ── Timeline ──────────────────────────────────────────────────────────────────

class _TimelineContent extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.only(bottom: 32),
      children: [
        _SectionHeader(
          title: 'Timeline of the Seerah',
          subtitle: 'Dates before the Hijrah are approximate in the Gregorian calendar.',
        ).animate().fadeIn(duration: 400.ms),

        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: Column(
            children: kTimeline.asMap().entries.map((entry) {
              final i = entry.key;
              final event = entry.value;
              return _TimelineItem(event: event, isLast: i == kTimeline.length - 1)
                  .animate(delay: (i * 40).ms).fadeIn(duration: 300.ms);
            }).toList(),
          ),
        ),
      ],
    );
  }
}

class _TimelineItem extends StatelessWidget {
  final TimelineEvent event;
  final bool isLast;
  const _TimelineItem({required this.event, required this.isLast});

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Left column: dot + line
          SizedBox(
            width: 32,
            child: Column(
              children: [
                Container(
                  width: 12, height: 12,
                  margin: const EdgeInsets.only(top: 4),
                  decoration: BoxDecoration(
                    color: AppColors.gold,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.goldDark, width: 2),
                  ),
                ),
                if (!isLast)
                  Expanded(child: Container(
                    width: 1.5,
                    color: AppColors.gold.withOpacity(0.2),
                  )),
              ],
            ),
          ),
          const SizedBox(width: 10),
          // Right: content
          Expanded(
            child: Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(event.date,
                    style: const TextStyle(color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.5)),
                  const SizedBox(height: 3),
                  Text(event.title,
                    style: const TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  Text(event.description,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.4)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Key People ────────────────────────────────────────────────────────────────

class _KeyPeopleContent extends StatefulWidget {
  @override
  State<_KeyPeopleContent> createState() => _KeyPeopleContentState();
}

class _KeyPeopleContentState extends State<_KeyPeopleContent> {
  String _search = '';
  String _filter = 'All';
  final _ctrl = TextEditingController();

  List<String> get _categories {
    final cats = kKeyPeople.map((p) => p.category).toSet().toList()..sort();
    return ['All', ...cats];
  }

  List<PersonEntry> get _filtered {
    return kKeyPeople.where((p) {
      final matchSearch = _search.isEmpty ||
          p.name.toLowerCase().contains(_search) ||
          p.role.toLowerCase().contains(_search) ||
          p.description.toLowerCase().contains(_search);
      final matchFilter = _filter == 'All' || p.category == _filter;
      return matchSearch && matchFilter;
    }).toList();
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final people = _filtered;
    return Column(
      children: [
        // Search
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: TextField(
            controller: _ctrl,
            onChanged: (v) => setState(() => _search = v.toLowerCase()),
            decoration: InputDecoration(
              hintText: 'Search people…',
              prefixIcon: const Icon(Icons.search, size: 20, color: AppColors.textMuted),
              suffixIcon: _search.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.close, size: 18, color: AppColors.textMuted),
                      onPressed: () { _ctrl.clear(); setState(() => _search = ''); })
                  : null,
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
            ),
          ),
        ),
        // Filter chips
        SizedBox(
          height: 36,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: _categories.map((cat) => Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: Text(cat, style: TextStyle(
                  fontSize: 12,
                  color: _filter == cat ? AppColors.background : AppColors.textSecondary,
                )),
                selected: _filter == cat,
                onSelected: (_) => setState(() => _filter = cat),
                backgroundColor: AppColors.card,
                selectedColor: AppColors.gold,
                side: BorderSide(color: _filter == cat ? AppColors.gold : AppColors.border),
                padding: const EdgeInsets.symmetric(horizontal: 4),
              ),
            )).toList(),
          ),
        ),
        const SizedBox(height: 8),
        // Results
        Expanded(
          child: people.isEmpty
              ? const Center(child: Text('No results found', style: TextStyle(color: AppColors.textSecondary)))
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
                  itemCount: people.length,
                  itemBuilder: (ctx, i) {
                    final p = people[i];
                    return _InfoCard(
                      title: p.name,
                      subtitle: p.role,
                      body: p.description,
                      tag: p.category,
                    );
                  },
                ),
        ),
      ],
    );
  }
}

// ── Battles ───────────────────────────────────────────────────────────────────

class _BattlesContent extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.only(bottom: 32),
      children: [
        _SectionHeader(
          title: 'Battles and Expeditions',
          subtitle: 'Major military events in the life of the Prophet ﷺ',
        ).animate().fadeIn(duration: 400.ms),
        ...kBattles.asMap().entries.map((e) {
          final b = e.value;
          return Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(b.name,
                          style: const TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w700)),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.goldFaded,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: AppColors.gold.withOpacity(0.3)),
                        ),
                        child: Text(b.type,
                          style: const TextStyle(color: AppColors.gold, fontSize: 10, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.calendar_today_outlined, size: 12, color: AppColors.textMuted),
                      const SizedBox(width: 4),
                      Text(b.date, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                      const SizedBox(width: 12),
                      const Icon(Icons.flag_outlined, size: 12, color: AppColors.textMuted),
                      const SizedBox(width: 4),
                      Text(b.outcome, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(b.significance,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.4)),
                ],
              ),
            ).animate(delay: (e.key * 50).ms).fadeIn(duration: 300.ms),
          );
        }),
      ],
    );
  }
}

// ── Miracles ──────────────────────────────────────────────────────────────────

class _MiraclesContent extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.only(bottom: 32),
      children: [
        _SectionHeader(
          title: 'Miracles and Signs',
          subtitle: 'Verified narrations from the Qur\'an, Sahih al-Bukhari, and Sahih Muslim only.',
        ).animate().fadeIn(duration: 400.ms),

        const _NoteCard(
          'Source Verification',
          'Only miracles with clear evidence from the Qur\'an or Sahih al-Bukhari/Muslim are listed here. Popular stories without verified chains have been excluded.',
        ),

        ...kMiracles.asMap().entries.map((e) {
          final m = e.value;
          final isQuran = m.source.contains('Qur');
          return Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(m.title,
                          style: const TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w700)),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                        decoration: BoxDecoration(
                          color: isQuran ? AppColors.goldFaded : AppColors.success.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: isQuran ? AppColors.gold.withOpacity(0.4) : AppColors.success.withOpacity(0.4)),
                        ),
                        child: Text(m.source,
                          style: TextStyle(
                            color: isQuran ? AppColors.gold : AppColors.success,
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                          )),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(m.description,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.4)),
                ],
              ),
            ).animate(delay: (e.key * 50).ms).fadeIn(duration: 300.ms),
          );
        }),
      ],
    );
  }
}

// ── Terms ─────────────────────────────────────────────────────────────────────

class _TermsContent extends StatefulWidget {
  @override
  State<_TermsContent> createState() => _TermsContentState();
}

class _TermsContentState extends State<_TermsContent> {
  String _search = '';
  String _filter = 'All';
  final _ctrl = TextEditingController();

  List<String> get _categories {
    final cats = kTerms.map((t) => t.category).toSet().toList()..sort();
    return ['All', ...cats];
  }

  List<TermEntry> get _filtered {
    return kTerms.where((t) {
      final matchSearch = _search.isEmpty ||
          t.arabic.contains(_search) ||
          t.transliteration.toLowerCase().contains(_search) ||
          t.definition.toLowerCase().contains(_search);
      final matchFilter = _filter == 'All' || t.category == _filter;
      return matchSearch && matchFilter;
    }).toList();
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final terms = _filtered;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: TextField(
            controller: _ctrl,
            onChanged: (v) => setState(() => _search = v.toLowerCase()),
            decoration: InputDecoration(
              hintText: 'Search terms…',
              prefixIcon: const Icon(Icons.search, size: 20, color: AppColors.textMuted),
              suffixIcon: _search.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.close, size: 18),
                      onPressed: () { _ctrl.clear(); setState(() => _search = ''); })
                  : null,
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
            ),
          ),
        ),
        SizedBox(
          height: 36,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: _categories.map((cat) => Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: Text(cat, style: TextStyle(
                  fontSize: 12,
                  color: _filter == cat ? AppColors.background : AppColors.textSecondary,
                )),
                selected: _filter == cat,
                onSelected: (_) => setState(() => _filter = cat),
                backgroundColor: AppColors.card,
                selectedColor: AppColors.gold,
                side: BorderSide(color: _filter == cat ? AppColors.gold : AppColors.border),
                padding: const EdgeInsets.symmetric(horizontal: 4),
              ),
            )).toList(),
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
            itemCount: terms.length,
            itemBuilder: (ctx, i) {
              final t = terms[i];
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 52,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(t.arabic,
                            textAlign: TextAlign.right,
                            style: const TextStyle(color: AppColors.gold, fontSize: 18, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(t.transliteration,
                                style: const TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w700)),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.border,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(t.category,
                                  style: const TextStyle(color: AppColors.textMuted, fontSize: 10)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(t.definition,
                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.4)),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

// ── Places ────────────────────────────────────────────────────────────────────

class _PlacesContent extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final cats = kPlaces.map((p) => p.category).toSet().toList();
    return ListView(
      padding: const EdgeInsets.only(bottom: 32),
      children: [
        _SectionHeader(
          title: 'Places and Maps',
          subtitle: 'Key cities, routes, and locations in the Seerah',
        ).animate().fadeIn(duration: 400.ms),

        ...cats.map((cat) {
          final places = kPlaces.where((p) => p.category == cat).toList();
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _SubTitle(cat),
              ...places.map((p) => _InfoCard(
                title: p.name,
                body: p.significance,
              )),
            ],
          );
        }),
      ],
    );
  }
}

// ── Tribes & Lineage ──────────────────────────────────────────────────────────

class _TribesContent extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _SectionHeader(
          title: 'Tribes and Lineage',
          subtitle: 'The Prophet\'s ﷺ lineage and major Arab tribes',
        ).animate().fadeIn(duration: 400.ms),

        const _SubTitle('The Prophet\'s ﷺ Lineage (Summary)'),
        _LineageCard().animate(delay: 100.ms).fadeIn(),

        const _SubTitle('Quraysh Clans of Makkah'),
        ...[
          ['Banu Hashim',     'The Prophet\'s clan. Custodians of Zamzam. Known for nobility and generosity.'],
          ['Banu Umayya',     'Powerful Qurayshi clan. Abu Sufyan was from this clan. Later became the Umayyad caliphs.'],
          ['Banu Makhzum',    'Warrior clan of Quraysh. Khalid ibn al-Walid was from Banu Makhzum.'],
          ['Banu Asad',       'Another Qurayshi clan connected to several prominent companions.'],
          ['Banu Zuhrah',     'Clan of Aminah, the Prophet\'s ﷺ mother. Abd al-Rahman ibn Awf ؓ was from here.'],
          ['Banu Taym',       'Clan of Abu Bakr al-Siddiq ؓ.'],
          ['Banu Adi',        'Clan of Umar ibn al-Khattab ؓ.'],
        ].asMap().entries.map((e) => _InfoCard(
          title: e.value[0],
          body: e.value[1],
        ).animate(delay: (e.key * 40).ms).fadeIn()),

        const _SubTitle('Major Tribes of Madinah (Ansar)'),
        ...[
          ['Banu Aws',        'One of the two main tribes of Madinah. They were among the Ansar who welcomed the Prophet ﷺ.'],
          ['Banu Khazraj',    'The larger of the two main Madinan tribes. Many leading Ansar companions were from here.'],
        ].map((d) => _InfoCard(title: d[0], body: d[1])),

        const _SubTitle('Jewish Tribes of Madinah'),
        ...[
          ["Banu Qaynuqa'",   'Exiled from Madinah after breaking the treaty following Badr.'],
          ['Banu Nadir',      'Exiled from Madinah in 4 AH for plotting against the Prophet ﷺ.'],
          ['Banu Qurayza',    'Broke their covenant during the Battle of the Trench.'],
        ].map((d) => _InfoCard(title: d[0], body: d[1])),
      ],
    );
  }
}

class _LineageCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final chain = [
      'Muhammad ﷺ',
      'Abdullah (father)',
      'Abd al-Muttalib (grandfather)',
      'Hashim (great-grandfather)',
      'Abd Manaf',
      'Qusayy',
      'Kilab → Murrah → Ka\'b → Luayy → Ghalib → Fihr (Quraysh)',
      '... → Kinanah → Khuzaymah → Mudrika → Ilyas → Mudar → Nizar → Ma\'add → Adnan',
      '... → Ibrahim ؑ',
    ];

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.gold.withOpacity(0.3)),
      ),
      child: Column(
        children: chain.asMap().entries.map((e) {
          final isFirst = e.key == 0;
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: [
                  Container(
                    width: 8, height: 8,
                    decoration: BoxDecoration(
                      color: isFirst ? AppColors.gold : AppColors.textMuted,
                      shape: BoxShape.circle,
                    ),
                  ),
                  if (e.key < chain.length - 1)
                    Container(width: 1, height: 24, color: AppColors.border),
                ],
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Text(e.value,
                    style: TextStyle(
                      color: isFirst ? AppColors.gold : AppColors.textSecondary,
                      fontSize: isFirst ? 14 : 12,
                      fontWeight: isFirst ? FontWeight.w700 : FontWeight.w400,
                      height: 1.3,
                    )),
                ),
              ),
            ],
          );
        }).toList(),
      ),
    );
  }
}

// ── Shared cards ──────────────────────────────────────────────────────────────

class _InfoCard extends StatelessWidget {
  final String title;
  final String? subtitle;
  final String? body;
  final String? tag;
  final Color? accentColor;

  const _InfoCard({
    required this.title,
    this.subtitle,
    this.body,
    this.tag,
    this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(title,
                  style: const TextStyle(
                    color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w700)),
              ),
              if (tag != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(tag!, style: const TextStyle(color: AppColors.textMuted, fontSize: 10)),
                ),
            ],
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 2),
            Text(subtitle!,
              style: TextStyle(
                color: accentColor ?? AppColors.gold,
                fontSize: 11,
                fontWeight: FontWeight.w500,
              )),
          ],
          if (body != null) ...[
            const SizedBox(height: 6),
            Text(body!,
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.4)),
          ],
        ],
      ),
    );
  }
}

class _NoteCard extends StatelessWidget {
  final String title;
  final String body;
  const _NoteCard(this.title, this.body);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.goldFaded,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.gold.withOpacity(0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline, color: AppColors.gold, size: 16),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                  style: const TextStyle(color: AppColors.gold, fontSize: 12, fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(body,
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
