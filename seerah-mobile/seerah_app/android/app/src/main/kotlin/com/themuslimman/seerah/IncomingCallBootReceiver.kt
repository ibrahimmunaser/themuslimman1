package com.themuslimman.seerah

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Re-arms any still-future direct-launch call alarm after a reboot or app
 * update, since raw [android.app.AlarmManager] alarms (unlike
 * flutter_local_notifications' own, which that plugin re-persists itself)
 * do not survive either. Without this, a reboot silently disables the
 * "force-launch while unlocked and backgrounded" path until the user next
 * opens the app — mirrors `guard.GuardBootReceiver`'s purpose for the App
 * Guard feature.
 */
class IncomingCallBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val now = System.currentTimeMillis()
        IncomingCallPrefs.pendingAlarms(context).forEach { alarm ->
            if (alarm.triggerAtMillis > now) {
                IncomingCallScheduling.schedule(
                    context,
                    alarm.id,
                    alarm.prayer,
                    alarm.triggerAtMillis,
                )
            } else {
                IncomingCallPrefs.removePendingAlarm(context, alarm.id)
            }
        }
    }
}
