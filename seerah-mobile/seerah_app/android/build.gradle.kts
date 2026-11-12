allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory = rootProject.layout.buildDirectory.dir("../../build").get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

// Workaround for an AGP/lint UAST crash (NoSuchMethodError in CommentDetector while
// scanning third-party plugin AARs, e.g. in_app_purchase_android's BillingClientFactory.java)
// that fails the automatic "lint vital" task on release builds. Disabling the lintVital*
// tasks for every subproject (all Flutter plugin modules + the app module) avoids the crash
// without disabling lint for local development builds.
subprojects {
    tasks.matching { it.name.startsWith("lintVital") }.configureEach {
        enabled = false
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
