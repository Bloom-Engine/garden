plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.bloomengine.garden"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.bloomengine.garden"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"

        ndk {
            abiFilters += "arm64-v8a"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    sourceSets {
        getByName("main") {
            jniLibs.srcDirs("src/main/jniLibs")
            assets.srcDirs("src/main/assets")
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
}
