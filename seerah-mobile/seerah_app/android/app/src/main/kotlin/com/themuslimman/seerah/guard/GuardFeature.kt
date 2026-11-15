package com.themuslimman.seerah.guard

/**
 * Temporary kill switch (2026-11-15): Google Play's "Policy and programs →
 * Foreground services" declaration for the FOREGROUND_SERVICE_SPECIAL_USE
 * subtype App Guard uses is pending review (see AndroidManifest.xml, where
 * that permission and the AppGuardForegroundService <service> declaration
 * are commented out alongside this flag).
 *
 * This flag is the runtime half of that change: it stops
 * [GuardWindowAlarmReceiver] and [GuardScheduling] from ever trying to
 * start/schedule the now-undeclared service, which matters for users
 * upgrading from a version where App Guard was enabled — their
 * already-enabled [GuardPrefs] state (and any already-scheduled
 * AlarmManager alarm, which survives an app update) must not crash into a
 * service the manifest no longer declares.
 *
 * Flip back to true together with restoring the manifest entries once
 * Google approves the declaration. Nothing else needs to change: enabled
 * users' saved preferences are left untouched the whole time, so the
 * feature resumes working for them automatically.
 */
object GuardFeature {
    const val ENABLED = false
}
