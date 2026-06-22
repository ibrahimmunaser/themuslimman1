import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:seerah_app/core/data/parts_data.dart';
import 'package:seerah_app/core/models/part_model.dart';
import 'package:seerah_app/core/theme/app_theme.dart';
import 'package:seerah_app/core/widgets/ui_kit.dart';
import 'package:seerah_app/features/course/widgets/part_card.dart';
import 'package:seerah_app/features/reference/data/reference_data.dart';
import 'package:seerah_app/features/shell/app_shell.dart';

Widget _wrapShell({Size size = const Size(390, 844), String location = '/dashboard'}) {
  final router = GoRouter(
    initialLocation: location,
    routes: [
      ShellRoute(
        builder: (_, __, child) => AppShell(child: child),
        routes: [
          GoRoute(path: '/dashboard', builder: (_, __) => const SizedBox(key: Key('dash'))),
          GoRoute(path: '/course', builder: (_, __) => const SizedBox(key: Key('course'))),
        ],
      ),
    ],
  );

  return MediaQuery(
    data: MediaQueryData(size: size),
    child: MaterialApp.router(theme: AppTheme.dark, routerConfig: router),
  );
}

Widget _wrap(Widget child, {Size size = const Size(390, 844)}) {
  return MediaQuery(
    data: MediaQueryData(size: size),
    child: MaterialApp(theme: AppTheme.dark, home: child),
  );
}

void main() {
  group('Reference data integrity', () {
    test('all reference sections have unique ids', () {
      final ids = kReferenceSections.map((s) => s.id).toList();
      expect(ids.toSet().length, ids.length);
    });

    test('timeline has 18 events', () {
      expect(kTimeline.length, 18);
    });

    test('key people search data is non-empty', () {
      expect(kKeyPeople.length, greaterThan(15));
      expect(kKeyPeople.every((p) => p.name.isNotEmpty), isTrue);
    });
  });

  group('PartCard stress', () {
    testWidgets('handles very long titles without overflow', (tester) async {
      const longPart = PartModel(
        partNumber: 99,
        title: 'An extraordinarily long part title that should wrap cleanly across multiple lines without breaking the layout on small Android phones',
        subtitle: 'Also a very long subtitle that tests ellipsis behavior in constrained widths',
        era: 'final-years',
        description: 'Test',
      );

      await tester.pumpWidget(_wrap(
        SizedBox(
          width: 320,
          child: PartCard(part: longPart, onTap: () {}, isLocked: false),
        ),
        size: const Size(320, 600),
      ));

      expect(tester.takeException(), isNull);
      expect(find.textContaining('extraordinarily long'), findsOneWidget);
    });

    testWidgets('locked state shows lock icon', (tester) async {
      await tester.pumpWidget(_wrap(
        PartCard(part: PARTS[1], onTap: () {}, isLocked: true),
      ));
      expect(find.byIcon(Icons.lock_rounded), findsOneWidget);
    });
  });

  group('UI kit', () {
    testWidgets('StatTile row fits narrow screens', (tester) async {
      await tester.pumpWidget(_wrap(
        const SizedBox(
          width: 320,
          child: Row(
            children: [
              StatTile(value: '100', label: 'Parts'),
              SizedBox(width: 8),
              StatTile(value: '8', label: 'Eras'),
            ],
          ),
        ),
        size: const Size(320, 600),
      ));
      expect(tester.takeException(), isNull);
    });

    testWidgets('EmptyState renders centered', (tester) async {
      await tester.pumpWidget(_wrap(
        const EmptyState(icon: Icons.search_off_rounded, title: 'Nothing here'),
      ));
      expect(find.text('Nothing here'), findsOneWidget);
    });

    testWidgets('PageIntroCard survives large text scale', (tester) async {
      await tester.pumpWidget(
        MediaQuery(
          data: const MediaQueryData(size: Size(390, 844), textScaler: TextScaler.linear(1.4)),
          child: MaterialApp(
            theme: AppTheme.dark,
            home: const Scaffold(
              body: PageIntroCard(
                eyebrow: 'Test',
                title: 'Large text scale header',
                description: 'Description should remain readable at 1.4x text scale.',
              ),
            ),
          ),
        ),
      );
      expect(tester.takeException(), isNull);
    });
  });

  group('AppShell navigation', () {
    testWidgets('renders 5 navigation destinations', (tester) async {
      await tester.pumpWidget(_wrapShell());
      await tester.pumpAndSettle();
      expect(find.byType(NavigationBar), findsOneWidget);
      // Dashboard is selected — home shows the filled variant.
      expect(find.byIcon(Icons.home_rounded), findsOneWidget);
      expect(find.byIcon(Icons.menu_book_outlined), findsOneWidget);
      expect(find.byIcon(Icons.folder_outlined), findsOneWidget);
      expect(find.byIcon(Icons.library_books_outlined), findsOneWidget);
      expect(find.byIcon(Icons.insights_outlined), findsOneWidget);
    });
  });
}
