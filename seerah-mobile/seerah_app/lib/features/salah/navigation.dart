import 'package:flutter/material.dart';

/// Renamed (from `navigatorKey`) when this app was merged into Seerah, to
/// avoid any ambiguity with the host app's own navigation globals.
final GlobalKey<NavigatorState> salahNavigatorKey =
    GlobalKey<NavigatorState>();

/// Quran tab's own nested [Navigator] (surah/juz pages push onto this), so
/// a [NavigatorPopHandler] can forward the phone's back button to it —
/// see [QuranSection].
final GlobalKey<NavigatorState> quranNavigatorKey =
    GlobalKey<NavigatorState>();

/// The app's root navigator (passed as `GoRouter`'s own `navigatorKey` in
/// app_router.dart) — mounted for the entire process lifetime, regardless
/// of which bottom-nav tab is currently showing.
///
/// The "Allah is calling" incoming-call screen is pushed here instead of on
/// [salahNavigatorKey] so it can auto-present no matter which tab the user
/// is on (or which tab the app last restored into) when a prayer enters —
/// [salahNavigatorKey]'s `Navigator` only exists while the Salah tab's
/// subtree happens to be mounted (see `SalahSection`), which previously
/// meant the call screen silently failed to show whenever the user was on
/// Seerah/Quran/Account — including right after a cold start, since the
/// app always lands back on the Seerah tab, never Salah.
final GlobalKey<NavigatorState> rootNavigatorKey = GlobalKey<NavigatorState>();

/// Used by Settings (and other routes) to restore system UI when a pushed
/// immersive screen (e.g. Preview reminder) pops back. Renamed (from
/// `routeObserver`) for the same reason as [salahNavigatorKey].
final RouteObserver<ModalRoute<void>> salahRouteObserver =
    RouteObserver<ModalRoute<void>>();
