# Android status

The Android native shell and widget factory plus Zig core are scaffolded. The production-critical missing integration is QuickJS-NG embedding/JNI: load the JavaScript bundle, expose __ZIGUI_NATIVE__, batch tree mutations to Android Views, and dispatch native events back to JS.

Until that exists, zui build android intentionally fails rather than producing a misleading APK.

Required toolchain: Zig, JDK 21, Android SDK/NDK and Gradle. Android Studio is optional.
