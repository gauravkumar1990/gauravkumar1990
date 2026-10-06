# ZigUI Framework

Experimental cross-platform framework: JavaScript simplicity + Zig native runtime architecture.

## Install CLI locally
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
- ✅ JavaScript reactive UI API
- ✅ working web renderer/build/dev server
- ✅ hot reload for web
- ✅ Zig native core/protocol source
- ✅ Android Gradle/Kotlin native shell and widget factory
- ✅ ZigUI Studio visual UI builder
- ✅ realtime phone/tablet/web simulator
- ✅ drag/drop component tree
- ✅ click-to-select live inspector
- ✅ generated JavaScript write-back
- ✅ unit tests
- 🚧 QuickJS-NG embedding + JNI renderer bridge
- 🚧 installable Android APK generated from JS app
- 🚧 iOS adapter/signing

## ZigUI Studio

Run:

```bash
zui studio .
```

Studio provides a realtime device simulator, drag-and-drop components, tree re-parenting, click-to-select element editing, live property inspection, undo/redo, duplicate/delete controls, and generated `src/app.js` beside the canvas.

The Studio canvas is a fast browser-side device simulator. A true Android emulator/device bridge is the next native-runtime milestone and will use ADB plus the QuickJS/Zig runtime.
