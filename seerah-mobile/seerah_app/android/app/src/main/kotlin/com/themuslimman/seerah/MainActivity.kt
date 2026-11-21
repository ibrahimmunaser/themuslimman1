package com.themuslimman.seerah

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import com.themuslimman.seerah.guard.AppGuardPlugin
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine

class MainActivity : FlutterActivity() {
    companion object {
        /** Set by [IncomingCallAlarmReceiver] on its direct launch. */
        const val EXTRA_INCOMING_CALL = "seerah_incoming_call"

        // Actions flutter_local_notifications puts on the intent behind a
        // notification tap / fullScreenIntent.
        private const val ACTION_SELECT_NOTIFICATION = "SELECT_NOTIFICATION"
        private const val ACTION_SELECT_FOREGROUND_NOTIFICATION =
            "SELECT_FOREGROUND_NOTIFICATION"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        applyLockScreenPolicy(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        applyLockScreenPolicy(intent)
    }

    override fun onStop() {
        // Never leave the app showing over the lock screen after the call
        // screen is gone: the next ordinary launch must respect the lock.
        setLockScreenVisibility(false)
        super.onStop()
    }

    /**
     * The app may only appear over the lock screen / wake the display when
     * it was started for the "Allah is calling" screen (the exact-time
     * alarm or the call notification's full-screen intent). A normal
     * launcher start must not bypass the keyguard visually, so these used to
     * be `showWhenLocked` / `turnScreenOn` on the whole activity in the
     * manifest and are now applied per launch.
     */
    private fun applyLockScreenPolicy(launchIntent: Intent?) {
        val action = launchIntent?.action
        val forCall =
            launchIntent?.getBooleanExtra(EXTRA_INCOMING_CALL, false) == true ||
                action == ACTION_SELECT_NOTIFICATION ||
                action == ACTION_SELECT_FOREGROUND_NOTIFICATION
        setLockScreenVisibility(forCall)
    }

    @Suppress("DEPRECATION")
    private fun setLockScreenVisibility(enabled: Boolean) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(enabled)
            setTurnScreenOn(enabled)
        } else {
            val flags = WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            if (enabled) window.addFlags(flags) else window.clearFlags(flags)
        }
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        // Salah features merged in from the standalone "Allah Is Calling" app.
        flutterEngine.plugins.add(AppGuardPlugin())
        flutterEngine.plugins.add(IncomingCallPlugin())
    }
}
