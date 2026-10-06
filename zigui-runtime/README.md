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
- ✅ unit tests
- 🚧 QuickJS-NG embedding + JNI renderer bridge
- 🚧 installable Android APK generated from JS app
- 🚧 iOS adapter/signing

This project deliberately reports incomplete mobile packaging instead of pretending a WebView/demo is a native Android runtime.

## ZigUI Studio — visual UI builder

Run:

```bash
zui studio .
```

Studio opens a local visual editor with realtime phone/tablet/web simulation, drag/drop components, click-to-select editing, property inspection, nesting/reorder, undo/redo, generated JavaScript and source write-back.

## ZigUI Studio v0.4 — Figma-style visual workflow

The Studio workspace now adds layers/frames, multi-select, alignment/distribution, absolute positioning, row/column auto-layout, device presets, zoom, design tokens, prototype actions, inspect/code panels, drag/drop components and source regeneration.

### Import designs

Use **Import** for `.json`, `.zip`, `.svg`, `.png`, `.jpg`, `.webp`, or `.html`. Use **Figma** for direct Figma URL + token import. The import pipeline recognizes Figma REST JSON, generic design JSON, Stitch-style JSON, ZIP bundles and web bundles. See `docs/IMPORTING.md`.

Direct Figma import preserves layer hierarchy, text/font properties, frame geometry, auto-layout hints, fills/strokes/shadows, components/styles metadata, and variables when the Figma account/API tier permits variable access.
