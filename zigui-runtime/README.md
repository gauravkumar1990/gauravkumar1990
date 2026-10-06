# ZigUI Framework

Experimental cross-platform framework: JavaScript simplicity + Zig native runtime architecture.

## Install
```bash
npm install
npm link --workspace @zigui/cli
zui doctor
```

## Create an app
```bash
zui create my-app
cd my-app
npm install
npm run dev
```

## Current capability
- ✅ npm-installable monorepo and CLI
- ✅ reactive JavaScript UI protocol
- ✅ working web renderer/build/dev server + hot reload
- ✅ Zig native core/protocol source
- ✅ Android Gradle/Kotlin native shell and widget factory
- ✅ tests
- 🚧 QuickJS-NG embedding + JNI renderer bridge
- 🚧 native APK generated from JS app
- 🚧 iOS adapter/signing

The mobile build command intentionally fails until the real embedded-JS/JNI bridge exists, rather than returning a WebView/demo and calling it native.
