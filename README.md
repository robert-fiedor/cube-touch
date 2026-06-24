# Cube Touch

A small static web app that fills the phone screen with a touch-rotatable 3D cube.

## Local Preview

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Publishing Notes

This repo uses a tracked pre-commit hook in `.githooks/pre-commit` to run Gitleaks before commits. Enable it locally with:

```bash
git config core.hooksPath .githooks
```
