# Loomis Head

A small static web app that fills the phone screen with a touch-rotatable parametric Loomis head construction model.

The model is generated from code and includes a translucent cranium, side planes, brow line, center line, proportional thirds, a simplified jaw block, optional neck, view presets, proportion sliders, and JSON preset import/export.

## Local Preview

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Publishing Notes

Static assets are referenced with cache-busting query strings in `index.html`. Update the version on `styles.css` and `script.js` whenever either file changes before publishing.

This repo uses a tracked pre-commit hook in `.githooks/pre-commit` to run Gitleaks before commits. Enable it locally with:

```bash
git config core.hooksPath .githooks
```
