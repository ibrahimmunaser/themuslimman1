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
    // Pinned to satisfy wakelock_plus and the Salah-feature plugins
    // (audioplayers, device_info_plus, flutter_compass,
    // flutter_local_notifications, geolocator, etc.), which all require
    // 28.2.13676358.
    ndkVersion = "28.2.13676358"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
        // Required by flutter_local_notifications (java.time / core library
        // desugaring on API < 26).
        isCoreLibraryDesugaringEnabled = true
    }

    // ``.gzdat`` isn't in AAPT's default no-compress list (unlike jpg/mp3/mp4/
    // zip/etc.), so the already gzip-compressed city database
    // (assets/geonames/cities.tsv.gzdat, ~3.7MB) was getting re-deflated into
    // the APK as a *compressed* zip entry. Android's AssetManager can fail to
    // open compressed asset entries over ~1MB on-device (a long-standing
    // platform limitation — see Flutter issue flutter/flutter#23644 and
    // AOSP's own 1MB mmap-compressed-asset ceiling), which surfaces at
    // runtime as rootBundle.load() throwing, 100% reproducibly, regardless
    // of device. Storing it uncompressed sidesteps the limitation entirely
    // (and costs nothing extra since the data was already gzip-compressed).
    //
    // IMPORTANT: this file must NOT use a ".gz" extension. Google Play's app
    // bundle serving pipeline silently strips ".gz" extensions and
    // decompresses/re-deflates any asset named that way before generating
    // the installable split APKs -- it assumes a ".gz"-named asset is meant
    // to be auto-decompressed, not an opaque blob to preserve byte-for-byte.
    // That broke rootBundle.load('assets/geonames/cities.tsv.gz') for every
    // Play Store install (file silently became "cities.tsv", no ".gz") while
    // directly-built/sideloaded APKs -- never touched by Play's pipeline --
    // kept working, which is why the bug only reproduced for Play installs.
    // Renamed to ".gzdat" so Play's special-casing no longer applies.
    androidResources {
        noCompress += "gzdat"
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
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        resourceConfigurations += listOf("en", "ar", "fr", "id", "in", "ms", "zh", "ru", "sw", "es", "de", "tr", "hi", "ur", "bn", "fa")
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

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}

dependencies {
    // Core library desugaring, required by flutter_local_notifications.
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")
}
