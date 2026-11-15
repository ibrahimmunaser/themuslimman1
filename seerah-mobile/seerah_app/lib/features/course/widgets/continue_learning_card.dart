import 'package:flutter/material.dart' hide Text;
import 'package:seerah_app/core/widgets/localized_text.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/data/parts_data.dart';
import '../../../core/models/part_model.dart';
import '../../../core/providers/progress_provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/ui_kit.dart';
import '../../../l10n/app_strings.dart';

/// Continue / up-next card used on Home and at the top of the Seerah tab.
class ContinueLearningCard extends StatelessWidget {
  final bool hasAccess;
  final AsyncValue<ProgressState> progressAsync;
  final String lang;
  const ContinueLearningCard({
    super.key,
    required this.hasAccess,
    required this.progressAsync,
    required this.lang,
  });

  @override
  Widget build(BuildContext context) {
    final lastPartNumber =
        progressAsync.valueOrNull?.lastPartNumber ??
        AppConstants.kFreePartNumber;
    final partNum = lastPartNumber.clamp(1, PARTS.length);
    final isFirstVisit = progressAsync.valueOrNull?.totalViewed == 0;
    final completed =
        progressAsync.valueOrNull?.completedParts ?? const <int>{};
    final nextPartNum =
        (!isFirstVisit &&
            hasAccess &&
            partNum < PARTS.length &&
            completed.contains(partNum))
        ? partNum + 1
        : partNum;
    final PartModel nextPart = PARTS.firstWhere(
      (p) => p.partNumber == nextPartNum,
      orElse: () => PARTS.first,
    );
    final nextEraColor = AppColors.forEra(nextPart.era);
    final locked = !hasAccess && nextPartNum != AppConstants.kFreePartNumber;

    final label = isFirstVisit
        ? (hasAccess ? t(lang, 'startHere') : t(lang, 'freeStartHere'))
        : locked
        ? t(lang, 'resumeUnlockContinue')
        : (nextPartNum == partNum
              ? t(lang, 'continueLabel')
              : t(lang, 'upNext'));

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => context.push('/part/$nextPartNum'),
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          padding: const EdgeInsets.all(16),
          decoration: AppDecorations.eraAccent(nextEraColor),
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: nextEraColor.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: nextEraColor.withValues(alpha: 0.4),
                  ),
                ),
                child: Center(
                  child: Text(
                    '$nextPartNum',
                    style: TextStyle(
                      color: nextEraColor,
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$label — ${_eraName(nextPart.era, lang)}',
                      style: TextStyle(
                        color: AppColors.gold,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      nextPart.localizedTitle(lang),
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      isFirstVisit &&
                              nextPart.partNumber ==
                                  AppConstants.kFreePartNumber
                          ? t(lang, 'freePartStartDescription')
                          : nextPart.localizedSubtitle(lang),
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                      ),
                      maxLines:
                          isFirstVisit &&
                              nextPart.partNumber ==
                                  AppConstants.kFreePartNumber
                          ? 3
                          : 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.gold.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.gold.withValues(alpha: 0.3),
                  ),
                ),
                child: Icon(
                  locked
                      ? Icons.lock_outline_rounded
                      : Icons.play_arrow_rounded,
                  color: AppColors.gold,
                  size: 20,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String _eraName(String eraId, String lang) {
  for (final era in ERAS) {
    if (era.id == eraId) return era.localizedName(lang);
  }
  return eraId;
}
