import 'package:flutter/material.dart' hide Text;
import 'package:provider/provider.dart';
import 'package:seerah_app/core/widgets/localized_text.dart';

import '../../../core/theme/app_colors.dart';
import '../../../l10n/salah_phrases.dart';
import '../models/dua.dart';
import '../models/scheduled_reminder.dart';
import '../state/app_controller.dart';
import '../utils/formatting.dart';
import 'dua_card_screen.dart';

/// Set up "Du'a for loved ones": the righteous-child reminder.
///
/// Turn it on, pick when during the day, how long the du'a card stays up,
/// and who to make du'a for. The list never leaves the device.
class DuaRemindersScreen extends StatelessWidget {
  const DuaRemindersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<AppController>();
    final settings = controller.settings;
    final people = controller.duaPeople;
    final enabled = settings.duaReminderEnabled;
    final notificationsOn = settings.notificationsEnabled;
    final nextDua =
        controller.scheduledReminders
            .where((r) => r.kind == ReminderKind.dua)
            .fold<ScheduledReminder?>(
              null,
              (best, r) =>
                  best == null || r.scheduledAtMillis < best.scheduledAtMillis
                      ? r
                      : best,
            );

    return Scaffold(
      appBar: AppBar(title: const Text('Du\'a for loved ones')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _IntroCard(),
          const SizedBox(height: 16),
          Card(
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text('Remind me to make du\'a'),
                  subtitle: Text(
                    !notificationsOn
                        ? 'Turn on prayer reminders in Settings first.'
                        : !settings.hasLocation
                        ? 'Set your location first — the reminders follow the '
                            'prayer times.'
                        : 'A gentle notification. Tap it to open a quiet '
                            'moment to make du\'a.',
                  ),
                  value: notificationsOn && enabled,
                  onChanged:
                      notificationsOn
                          ? (v) => controller.updateSettings(
                            settings.copyWith(duaReminderEnabled: v),
                          )
                          : null,
                ),
                if (!controller.notificationsPermitted) ...[
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(
                      Icons.notifications_off_outlined,
                      color: Colors.orange,
                    ),
                    title: const Text('Notifications are not permitted'),
                    subtitle: const Text('Tap to request permission'),
                    onTap: controller.requestNotificationPermission,
                  ),
                ],
                if (enabled && notificationsOn) ...[
                  const Divider(height: 1),
                  SwitchListTile(
                    title: const Text('Open the card automatically'),
                    subtitle: Text(
                      settings.duaFullScreenEnabled
                          ? 'Opens full screen on its own, like the prayer '
                              'call screen, even while the phone is locked.'
                          : 'Off: a plain notification at the top of the '
                              'screen — tap it to open the card.',
                    ),
                    value: settings.duaFullScreenEnabled,
                    onChanged:
                        (v) => controller.updateSettings(
                          settings.copyWith(duaFullScreenEnabled: v),
                        ),
                  ),
                ],
              ],
            ),
          ),
          if (enabled && notificationsOn) ...[
            const SizedBox(height: 16),
            const _SectionHeader('When'),
            Card(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Pick one or more. You get one reminder for each, every '
                      'day.',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 10),
                    for (final w in DuaWindow.values)
                      CheckboxListTile(
                        contentPadding: EdgeInsets.zero,
                        dense: true,
                        activeColor: AppColors.gold,
                        checkColor: AppColors.onGold,
                        title: Text(w.label),
                        subtitle: Text(w.description),
                        value: settings.duaWindows.contains(w),
                        onChanged: (checked) {
                          final next = [...settings.duaWindows];
                          if (checked == true) {
                            if (!next.contains(w)) next.add(w);
                          } else {
                            next.remove(w);
                          }
                          controller.updateSettings(
                            settings.copyWith(duaWindows: next),
                          );
                        },
                      ),
                    if (settings.duaWindows.isEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        'No reminder will be sent until you pick at least '
                        'one time above.',
                        style: TextStyle(
                          fontSize: 12.5,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                    const Divider(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Next reminder',
                          style: TextStyle(fontWeight: FontWeight.w600),
                        ),
                        Text(
                          nextDua == null
                              ? 'None scheduled'
                              : formatDateTime(nextDua.scheduledAt.toLocal()),
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            const _SectionHeader('How long the card stays up'),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: SizedBox(
                  width: double.infinity,
                  child: SegmentedButton<int>(
                    showSelectedIcon: false,
                    segments: const [
                      ButtonSegment(value: 30, label: Text('30 seconds')),
                      ButtonSegment(value: 60, label: Text('1 minute')),
                    ],
                    selected: {settings.duaCardSeconds},
                    onSelectionChanged:
                        (s) => controller.updateSettings(
                          settings.copyWith(duaCardSeconds: s.first),
                        ),
                  ),
                ),
              ),
            ),
          ],
          const SizedBox(height: 16),
          const _SectionHeader('Who to make du\'a for'),
          Card(
            child: Column(
              children: [
                if (people.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'Add your parents, family or friends — living or '
                      'passed away. The reminder will name them.',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                for (var i = 0; i < people.length; i++) ...[
                  if (i > 0) const Divider(height: 1),
                  ListTile(
                    leading: Icon(
                      people[i].deceased
                          ? Icons.favorite_border
                          : Icons.person_outline,
                      color: AppColors.gold,
                    ),
                    title: Text(people[i].displayName),
                    subtitle: Text(
                      [
                        people[i].relation.label,
                        if (people[i].deceased) 'Passed away',
                      ].join(' • '),
                    ),
                    onTap: () => _editPerson(context, controller, people, i),
                    trailing: IconButton(
                      tooltip: 'Remove',
                      icon: const Icon(Icons.delete_outline),
                      onPressed:
                          () => controller.setDuaPeople([
                            for (var j = 0; j < people.length; j++)
                              if (j != i) people[j],
                          ]),
                    ),
                  ),
                ],
                const Divider(height: 1),
                ListTile(
                  leading: Icon(Icons.add_circle_outline, color: AppColors.gold),
                  title: const Text('Add someone'),
                  onTap: () => _editPerson(context, controller, people, null),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 10, 4, 0),
            child: Text(
              'Du\'as of forgiveness are for Muslim loved ones. For anyone '
              'else, ask Allah for guidance. Your list stays on this phone.',
              style: TextStyle(fontSize: 12, color: AppColors.textMuted),
            ),
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            icon: const Icon(Icons.play_circle_outline),
            label: const Text('Preview the card'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.gold,
              side: BorderSide(color: AppColors.gold),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            onPressed:
                () => Navigator.of(context).push(
                  MaterialPageRoute(
                    fullscreenDialog: true,
                    builder:
                        (_) => DuaCardScreen(
                          person: people.isEmpty ? null : people.first,
                          seconds: settings.duaCardSeconds,
                        ),
                  ),
                ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Future<void> _editPerson(
    BuildContext context,
    AppController controller,
    List<DuaPerson> people,
    int? index,
  ) async {
    final result = await showDialog<DuaPerson>(
      context: context,
      builder: (_) => _PersonDialog(existing: index == null ? null : people[index]),
    );
    if (result == null) return;
    final next = [...people];
    if (index == null) {
      next.add(result);
    } else {
      next[index] = result;
    }
    await controller.setDuaPeople(next);
  }
}

class _IntroCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.gold.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'A righteous child who prays for them',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.gold,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'When a person dies, their deeds end except three: ongoing '
            'charity, beneficial knowledge, and a righteous child who makes '
            'du\'a for them. (Sahih Muslim)\n\nIt is easy to forget the '
            'people we love. Get a gentle reminder to make du\'a for them.',
            style: TextStyle(
              fontSize: 13.5,
              height: 1.45,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader(this.title);
  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 0, 4, 8),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.4,
          color: AppColors.gold,
        ),
      ),
    );
  }
}

/// Add / edit one person.
class _PersonDialog extends StatefulWidget {
  const _PersonDialog({this.existing});
  final DuaPerson? existing;

  @override
  State<_PersonDialog> createState() => _PersonDialogState();
}

class _PersonDialogState extends State<_PersonDialog> {
  late final TextEditingController _name;
  late DuaRelation _relation;
  late bool _isFemale;
  late bool _deceased;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _name = TextEditingController(text: e?.name ?? '');
    _relation = e?.relation ?? DuaRelation.mother;
    _isFemale = e?.isFemale ?? (_relation.isFemale ?? false);
    _deceased = e?.deceased ?? false;
  }

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  void _save() {
    final typed = _name.text.trim();
    Navigator.of(context).pop(
      DuaPerson(
        id:
            widget.existing?.id ??
            DateTime.now().microsecondsSinceEpoch.toString(),
        name: typed.isEmpty ? _relation.label : typed,
        relation: _relation,
        isFemale: _isFemale,
        deceased: _deceased,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.existing == null ? 'Add someone' : 'Edit'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _name,
              textCapitalization: TextCapitalization.words,
              decoration: InputDecoration(
                labelText: translateSalah(salahLang, 'Name'),
                hintText: translateSalah(salahLang, _relation.label),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Relationship',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: [
                for (final r in DuaRelation.values)
                  ChoiceChip(
                    label: Text(r.label),
                    selected: _relation == r,
                    onSelected:
                        (_) => setState(() {
                          _relation = r;
                          final implied = r.isFemale;
                          if (implied != null) _isFemale = implied;
                        }),
                  ),
              ],
            ),
            if (_relation.isFemale == null) ...[
              const SizedBox(height: 12),
              SegmentedButton<bool>(
                showSelectedIcon: false,
                segments: const [
                  ButtonSegment(value: false, label: Text('Male')),
                  ButtonSegment(value: true, label: Text('Female')),
                ],
                selected: {_isFemale},
                onSelectionChanged: (s) => setState(() => _isFemale = s.first),
              ),
            ],
            const SizedBox(height: 8),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Passed away'),
              value: _deceased,
              onChanged: (v) => setState(() => _deceased = v),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(onPressed: _save, child: const Text('Save')),
      ],
    );
  }
}
