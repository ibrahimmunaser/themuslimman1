package com.themuslimman.seerah

import com.themuslimman.seerah.guard.AppGuardPlugin
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine

class MainActivity : FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        // Salah features merged in from the standalone "Allah Is Calling" app.
        flutterEngine.plugins.add(AppGuardPlugin())
        flutterEngine.plugins.add(IncomingCallPlugin())
    }
}
