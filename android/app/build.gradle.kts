plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.iavision.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.iavision.app"
        minSdk = 24
        targetSdk = 35
        versionCode = 3
        versionName = "1.2.1"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
}

tasks.register("copyApkToRoot") {
    dependsOn("assembleDebug")
    doLast {
        val src = layout.buildDirectory.file("outputs/apk/debug/app-debug.apk").get().asFile
        val destLower = File(rootDir.parentFile, "IAVision.apk")
        val destUpper = File(rootDir.parentFile, "IAVision.APK")
        src.copyTo(destLower, overwrite = true)
        src.copyTo(destUpper, overwrite = true)
        println("APK copiado com sucesso para: ${destUpper.absolutePath}")
    }
}
