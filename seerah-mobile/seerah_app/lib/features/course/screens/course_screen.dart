import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/data/parts_data.dart';
import '../../../core/models/part_model.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/ui_kit.dart';
import '../widgets/part_card.dart';

class CourseScreen extends ConsumerStatefulWidget {
  const CourseScreen({super.key});

  @override
  ConsumerState<CourseScreen> createState() => _CourseScreenState();
}

class _CourseScreenState extends ConsumerState<CourseScreen> {
  String _search = '';
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Bug 5: read access so we can lock paid parts in the list
    final hasAccess = ref.watch(authProvider).hasAccess;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Lessons'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(72),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: AppSearchField(
              controller: _searchCtrl,
              onChanged: (v) => setState(() => _search = v.toLowerCase()),
              onClear: _search.isNotEmpty
                  ? () { _searchCtrl.clear(); setState(() => _search = ''); }
                  : null,
              hint: 'Search parts…',
            ),
          ),
        ),
      ),
      body: AppGradientBackground(
        child: SafeArea(
          child: _search.isNotEmpty ? _buildSearchResults(hasAccess) : _buildEraList(hasAccess),
        ),
      ),
    );
  }

  Widget _buildEraList(bool hasAccess) {
    final groups = getEraGroups();
    return ListView.builder(
      padding: const EdgeInsets.only(bottom: 24),
      itemCount: groups.length,
      itemBuilder: (ctx, i) {
        final group = groups[i];
        final era = group['era'] as EraModel;
        final parts = group['parts'] as List<PartModel>;
        return _EraSection(era: era, parts: parts, hasAccess: hasAccess)
            .animate(delay: (i * 50).ms)
            .fadeIn(duration: 400.ms)
            .slideY(begin: 0.05, end: 0);
      },
    );
  }

  Widget _buildSearchResults(bool hasAccess) {
    final results = PARTS.where((p) =>
      p.title.toLowerCase().contains(_search) ||
      p.subtitle.toLowerCase().contains(_search) ||
      p.description.toLowerCase().contains(_search) ||
      'part ${p.partNumber}'.contains(_search)
    ).toList();

    if (results.isEmpty) {
      return const EmptyState(
        icon: Icons.search_off_rounded,
        title: 'No parts found',
        subtitle: 'Try a different search term or browse by era.',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      itemCount: results.length,
      itemBuilder: (ctx, i) {
        final p = results[i];
        final locked = p.partNumber > 1 && !hasAccess;
        return Padding(
          padding: const EdgeInsets.only(bottom: 1),
          child: PartCard(
            part: p,
            isLocked: locked,
            grouped: true,
            isFirst: i == 0,
            isLast: i == results.length - 1,
            onTap: () => context.push('/part/${p.partNumber}'),
          ),
        );
      },
    );
  }
}

class _EraSection extends StatefulWidget {
  final EraModel era;
  final List<PartModel> parts;
  final bool hasAccess;
  const _EraSection({required this.era, required this.parts, required this.hasAccess});

  @override
  State<_EraSection> createState() => _EraSectionState();
}

class _EraSectionState extends State<_EraSection> {
  bool _expanded = false;

  @override
  void initState() {
    super.initState();
    // Auto-expand the first era (pre-islamic)
    _expanded = widget.era.id == 'pre-islamic';
  }

  @override
  Widget build(BuildContext context) {
    final color = AppColors.forEra(widget.era.id);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Era header
        InkWell(
          onTap: () => setState(() => _expanded = !_expanded),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              border: Border(
                left: BorderSide(color: color, width: 3),
                bottom: const BorderSide(color: AppColors.border),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(widget.era.name,
                        style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text('${widget.parts.length} parts',
                        style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ),
                AnimatedRotation(
                  turns: _expanded ? 0.5 : 0,
                  duration: const Duration(milliseconds: 200),
                  child: Icon(Icons.keyboard_arrow_down, color: AppColors.textMuted, size: 22),
                ),
              ],
            ),
          ),
        ),

        // Parts list
        AnimatedCrossFade(
          firstChild: const SizedBox.shrink(),
          secondChild: Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: Column(
              children: widget.parts.asMap().entries.map((e) {
                final i = e.key;
                final p = e.value;
                final locked = p.partNumber > 1 && !widget.hasAccess;
                return PartCard(
                  part: p,
                  isLocked: locked,
                  grouped: true,
                  isFirst: i == 0,
                  isLast: i == widget.parts.length - 1,
                  onTap: () => context.push('/part/${p.partNumber}'),
                );
              }).toList(),
            ),
          ),
          crossFadeState: _expanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
          duration: const Duration(milliseconds: 300),
          sizeCurve: Curves.easeOut,
        ),
      ],
    );
  }
}
