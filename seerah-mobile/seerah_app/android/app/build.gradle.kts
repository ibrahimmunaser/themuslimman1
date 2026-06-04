import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
}

// ── Release build detection ───────────────────────────────────────────────────
// Checked at Gradle *configuration* time so we fail before any compilation
// starts.  Matches "bundleRelease", "assembleRelease", "packageRelease", etc.
val isReleaseBuild: Boolean =
    gradle.startParameter.taskNames.any { it.contains("release", ignoreCase = true) }

// ── Keystore loading + hard fail for release builds ──────────────────────────
val keystorePropertiesFile: File = rootProject.file("key.properties")
val keystoreProperties = Properties()

if (keystorePropertiesFile.exists()) {
    keystorePropertiesFile.inputStream().use { keystoreProperties.load(it) }
} else if (isReleaseBuild) {
    // Fail immediately with an actionable error before a single source file
    // is compiled — prevents accidentally shipping a debug-signed release AAB.
    throw GradleException(
        buildString {
            appendLine()
            appendLine("  ┌─────────────────────────────────────────────────────────────────┐")
            appendLine("  │  RELEASE BUILD BLOCKED — android/key.properties not found       │")
            appendLine("  ├─────────────────────────────────────────────────────────────────┤")
            appendLine("  │  Release builds require a production keystore.                  │")
            appendLine("  │                                                                 │")
            appendLine("  │  1. Generate a keystore (one-time):                             │")
            appendLine("  │       keytool -genkey -v                                        │")
            appendLine("  │         -keystore ~/keys/themuslimman.jks                       │")
            appendLine("  │         -keyalg RSA -keysize 2048 -validity 10000               │")
            appendLine("  │         -alias themuslimman                                     │")
            appendLine("  │                                                                 │")
            appendLine("  │  2. Create android/key.properties:                              │")
            appendLine("  │       cp android/key.properties.example android/key.properties  │")
            appendLine("  │       # then fill in storeFile, storePassword,                  │")
            appendLine("  │       # keyAlias, and keyPassword                               │")
            appendLine("  │                                                                 │")
            appendLine("  │  key.properties is gitignored — NEVER commit it.               │")
            appendLine("  │  See STORE_RELEASE_CHECKLIST.md Part 1 for full steps.         │")
            appendLine("  └─────────────────────────────────────────────────────────────────┘")
        }
    )
}

// Reads a required signing property and fails loudly if it is absent/blank.
// Only validates when key.properties exists (the file-absent case is already
// caught above).
fun requiredProp(key: String): String {
    val value = (keystoreProperties[key] as? String)?.trim()
    if (value.isNullOrEmpty() && isReleaseBuild) {
        throw GradleException(
            buildString {
                appendLine()
                appendLine("  RELEASE BUILD BLOCKED — '$key' is missing or blank in android/key.properties.")
                appendLine("  Required keys: storeFile, storePassword, keyAlias, keyPassword")
                appendLine("  See android/key.properties.example for the expected format.")
            }
        )
    }
    return value.orEmpty()
}

// ── Android configuration ─────────────────────────────────────────────────────

android {
    namespace  = "com.themuslimman.seerah"
    compileSdk = flutter.compileSdkVersion
    // Pinned to satisfy wakelock_plus and other NDK-dependent plugins.
    ndkVersion = "27.0.12077973"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    signingConfigs {
        // The "release" config is only created when key.properties is present.
        // For non-release builds without key.properties, this block is skipped
        // entirely and the release buildType falls back to "debug" below.
        if (keystorePropertiesFile.exists()) {
            create("release") {
                storeFile     = file(requiredProp("storeFile"))
                storePassword = requiredProp("storePassword")
                keyAlias      = requiredProp("keyAlias")
                keyPassword   = requiredProp("keyPassword")
            }
        }
    }

    defaultConfig {
        applicationId = "com.themuslimman.seerah"

        // flutter_secure_storage with encryptedSharedPreferences requires API 23+.
        minSdk    = 23
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        release {
            signingConfig = if (keystorePropertiesFile.exists()) {
                // Production signing — key.properties validated above.
                signingConfigs.getByName("release")
            } else {
                // Only reachable when isReleaseBuild == false (e.g. `flutter run`
                // evaluates all buildTypes at config time even though it only
                // assembles debug). The guard at the top already threw for any
                // actual release task, so this path is safe.
                signingConfigs.getByName("debug")
            }

            // Do not set isMinifyEnabled here — the Flutter Gradle plugin manages
            // code shrinking and resource shrinking for release builds.
            // If you later want ProGuard/R8, add:
            //   isMinifyEnabled = true
            //   isShrinkResources = true
            // and supply a proguard-rules.pro file.
        }
    }
}

flutter {
    source = "../.."
}
