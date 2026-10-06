# Design import

ZigUI Studio accepts drag/file imports through its Import button.

Supported now:
- Figma direct URL + personal access token (`file_content:read`; variables imported when permitted)
- Figma REST JSON exports
- Generic ZigUI/design JSON (`root`, `document`, `design`, `layers`, `children`, `items`)
- Google Stitch-style JSON (`design`, `screen`, `theme`, `tokens`)
- ZIP bundles containing design JSON or HTML/CSS/assets
- SVG, PNG, JPEG, WEBP, GIF, HTML

ZIP detection is content based. A Figma JSON inside a ZIP is preferred, then Stitch JSON, then generic JSON, then HTML/CSS. HTML/CSS bundles are preserved as `WebEmbed` nodes when semantic native conversion is not possible.

## Adapter contract
A new importer returns a Studio model:

```json
{
  "version": 2,
  "root": {"id":"screen","type":"Screen","props":{},"children":[]},
  "tokens": {},
  "components": {},
  "styles": {},
  "meta": {"source":"vendor-name"}
}
```

This keeps the editor independent from any one design vendor.
