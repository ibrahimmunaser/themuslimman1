import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/prayer_settings.dart';
import '../state/app_controller.dart';

/// Bottom sheet for picking which bundled Athan recording plays on the
/// full-screen prayer call UI, with a tap-to-preview button on each option.
/// Reused by Settings > Prayers > "Athan sound".
Future<void> showAthanSoundPicker(BuildContext context) async {
  final controller = context.read<AppController?>();
  // Preferences aren't loaded yet; nothing to pick against.
  if (controller == null) return;
  final current = controller.settings.athanSound;

  final choice = await showModalBottomSheet<AthanSound>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (sheetContext) => _AthanSoundSheet(current: current),
  );

  if (choice != null && choice != current) {
    await controller.updateSettings(
      controller.settings.copyWith(athanSound: choice),
    );
  }
}

class _AthanSoundSheet extends StatefulWidget {
  const _AthanSoundSheet({required this.current});

  final AthanSound current;

  @override
  State<_AthanSoundSheet> createState() => _AthanSoundSheetState();
}

class _AthanSoundSheetState extends State<_AthanSoundSheet> {
  final _preview = AudioPlayer();
  AthanSound? _playing;

  Future<void> _togglePreview(AthanSound sound) async {
    if (_playing == sound) {
      await _preview.stop();
      if (mounted) setState(() => _playing = null);
      return;
    }
    await _preview.stop();
    if (mounted) setState(() => _playing = sound);
    try {
      await _preview.setReleaseMode(ReleaseMode.stop);
      await _preview.play(
        AssetSource(sound.assetPath.replaceFirst('assets/', '')),
      );
      await _preview.onPlayerComplete.first;
      if (mounted && _playing == sound) setState(() => _playing = null);
    } catch (_) {
      if (mounted && _playing == sound) setState(() => _playing = null);
    }
  }

  @override
  void dispose() {
    _preview.stop();
    _preview.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Padding(
            padding: EdgeInsets.only(bottom: 8, top: 4),
            child: Text(
              'Athan sound',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
          ),
          RadioGroup<AthanSound>(
            groupValue: widget.current,
            onChanged: (value) => Navigator.of(context).pop(value),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                for (final v in AthanSound.values)
                  RadioListTile<AthanSound>(
                    value: v,
                    title: Text(v.displayName),
                    subtitle: Text(
                      v.attribution,
                      style: const TextStyle(fontSize: 11),
                    ),
                    secondary: IconButton(
                      tooltip: _playing == v ? 'Stop preview' : 'Preview',
                      icon: Icon(
                        _playing == v
                            ? Icons.stop_circle_outlined
                            : Icons.play_circle_outline,
                      ),
                      onPressed: () => _togglePreview(v),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}
