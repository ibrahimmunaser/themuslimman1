package com.themuslimman.seerah

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

/**
 * SharedPreferences store backing [IncomingCallAlarmReceiver] /
 * [IncomingCallScheduling] / [IncomingCallBootReceiver]: the one pending
 * direct-launch prayer (consumed by Dart the moment the app is
 * foregrounded) and the full set of alarms currently scheduled — id,
 * trigger time and prayer, not just the bare id — so a reboot can re-arm
 * them via [IncomingCallBootReceiver] exactly like [IncomingCallScheduling]
 * did originally (mirrors `app_guard`'s `GuardPrefs.PendingWindow`).
 */
object IncomingCallPrefs {
    private const val PREFS_NAME = "incoming_call_prefs"
    private const val KEY_PENDING_PRAYER = "pending_prayer"
    private const val KEY_SCHEDULED = "scheduled_alarms"

    /** One scheduled-but-not-yet-fired direct-launch alarm. */
    data class PendingAlarm(val id: Int, val triggerAtMillis: Long, val prayer: String)

    private fun prefs(context: Context): SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun setPendingPrayer(context: Context, prayer: String) {
        prefs(context).edit().putString(KEY_PENDING_PRAYER, prayer).apply()
    }

    /** Reads and clears the pending prayer, if any. */
    fun consumePendingPrayer(context: Context): String? {
        val p = prefs(context)
        val value = p.getString(KEY_PENDING_PRAYER, null)
        if (value != null) p.edit().remove(KEY_PENDING_PRAYER).apply()
        return value
    }

    fun pendingAlarms(context: Context): List<PendingAlarm> {
        val raw = prefs(context).getString(KEY_SCHEDULED, null) ?: return emptyList()
        return try {
            val array = JSONArray(raw)
            (0 until array.length()).map { i ->
                val obj = array.getJSONObject(i)
                PendingAlarm(obj.getInt("id"), obj.getLong("trigger"), obj.getString("prayer"))
            }
        } catch (_: Exception) {
            emptyList()
        }
    }

    fun upsertPendingAlarm(context: Context, alarm: PendingAlarm) {
        val current = pendingAlarms(context).filter { it.id != alarm.id }
        saveAlarms(context, current + alarm)
    }

    fun removePendingAlarm(context: Context, id: Int) {
        saveAlarms(context, pendingAlarms(context).filter { it.id != id })
    }

    fun clearAllPendingAlarms(context: Context) {
        saveAlarms(context, emptyList())
    }

    private fun saveAlarms(context: Context, alarms: List<PendingAlarm>) {
        val array = JSONArray()
        alarms.forEach { a ->
            val obj = JSONObject()
            obj.put("id", a.id)
            obj.put("trigger", a.triggerAtMillis)
            obj.put("prayer", a.prayer)
            array.put(obj)
        }
        prefs(context).edit().putString(KEY_SCHEDULED, array.toString()).apply()
    }
}
