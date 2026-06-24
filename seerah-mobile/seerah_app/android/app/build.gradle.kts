import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
}

// ── Release build detection ───────────────────────────────────────────────────
val isReleaseBuild: Boolean =
    gradle.startParameter.taskNames.any { it.contains("release", ignoreCase = true) }

// ── Signing source detection ──────────────────────────────────────────────────
// On Codemagic CI: CM_KEYSTORE_PATH is injected automatically when a keystore
// is linked in Code Signing Identities. CI=true is set by Codemagic.
// Locally: falls back to android/key.properties (gitignored).
val isCi: Boolean = System.getenv("CI")?.toBoolean() == true

val keystorePropertiesFile: File = rootProject.file("key.properties")
val keystoreProperties = Properties()

if (isCi) {
    // Codemagic injects CM_KEYSTORE_PATH, CM_KEYSTORE_PASSWORD, CM_KEY_ALIAS,
    // CM_KEY_PASSWORD — nothing to load from disk.
} else if (keystorePropertiesFile.exists()) {
    keystorePropertiesFile.inputStream().use { keystoreProperties.load(it) }
} else if (isReleaseBuild) {
    throw GradleException(
        buildString {
            appendLine()
            appendLine("  ┌─────────────────────────────────────────────────────────────────┐")
            appendLine("  │  RELEASE BUILD BLOCKED — android/key.properties not found       │")
            appendLine("  ├─────────────────────────────────────────────────────────────────┤")
            appendLine("  │  1. Generate a keystore (one-time):                             │")
            appendLine("  │       keytool -genkey -v                                        │")
            appendLine("  │         -keystore ~/keys/themuslimman.jks                       │")
            appendLine("  │         -keyalg RSA -keysize 2048 -validity 10000               │")
            appendLine("  │         -alias themuslimman                                     │")
            appendLine("  │  2. cp android/key.properties.example android/key.properties   │")
            appendLine("  │  key.properties is gitignored — NEVER commit it.               │")
            appendLine("  └─────────────────────────────────────────────────────────────────┘")
        }
    )
}

fun signingValue(ciEnvKey: String, localPropKey: String): String =
    if (isCi) System.getenv(ciEnvKey).orEmpty()
    else (keystoreProperties[localPropKey] as? String)?.trim().orEmpty()

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
        if (isCi || keystorePropertiesFile.exists()) {
            create("release") {
                storeFile     = file(signingValue("CM_KEYSTORE_PATH", "storeFile"))
                storePassword = signingValue("CM_KEYSTORE_PASSWORD", "storePassword")
                keyAlias      = signingValue("CM_KEY_ALIAS", "keyAlias")
                keyPassword   = signingValue("CM_KEY_PASSWORD", "keyPassword")
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
            signingConfig = if (isCi || keystorePropertiesFile.exists()) {
                signingConfigs.getByName("release")
            } else {
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
