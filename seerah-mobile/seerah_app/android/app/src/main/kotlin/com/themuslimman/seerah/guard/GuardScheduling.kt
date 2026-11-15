package com.themuslimman.seerah.guard

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent

/**
 * Shared exact-alarm scheduling for guard windows, used by both
 * [AppGuardPlugin] (initial scheduling from Dart) and [GuardBootReceiver]
 * (re-arming after a reboot).
 */
object GuardScheduling {
    /** How long after a prayer enters guarded apps stay covered. */
    const val WINDOW_DURATION_MS = 15 * 60 * 1000L

    fun pendingIntentFor(context: Context, id: Int): PendingIntent {
        val intent = Intent(context, GuardWindowAlarmReceiver::class.java)
        return PendingIntent.getBroadcast(
            context,
            id,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    fun schedule(context: Context, id: Int, prayer: String, triggerAtMillis: Long) {
        // See GuardFeature — do not even arm an alarm while App Guard is
        // temporarily disabled (the alarm would just fire into a no-op
        // receiver, wasting the exact-alarm budget for nothing).
        if (!GuardFeature.ENABLED) return
        val intent = Intent(context, GuardWindowAlarmReceiver::class.java).apply {
            putExtra(AppGuardForegroundService.EXTRA_WINDOW_ID, id)
            putExtra(AppGuardForegroundService.EXTRA_PRAYER, prayer)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            id,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        try {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                triggerAtMillis,
                pendingIntent,
            )
        } catch (_: SecurityException) {
            // Exact-alarm permission revoked between scheduling calls; fall
            // back to an inexact alarm rather than silently dropping the
            // guard window (mirrors LocalNotificationService's own fallback).
            alarmManager.set(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent)
        }
        GuardPrefs.upsertPendingWindow(
            context,
            GuardPrefs.PendingWindow(id, triggerAtMillis, prayer),
        )
    }

    fun cancel(context: Context, id: Int) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarmManager.cancel(pendingIntentFor(context, id))
        GuardPrefs.removePendingWindow(context, id)
    }

    fun cancelAll(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        GuardPrefs.pendingWindows(context).forEach {
            alarmManager.cancel(pendingIntentFor(context, it.id))
        }
        GuardPrefs.clearAllPendingWindows(context)
    }
}
