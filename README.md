# uk.thechels.themes-for-nnw

A collection of themes for [NetNewsWire](https://netnewswire.com/) based on thechels.uk design.

## Themes

- **guro** — light mode only, clean and minimal
- **thechelsuk** — adapts to light and dark mode, based on the thechels.uk website design

## Install

1. Go to the [latest release](https://github.com/thechelsuk/uk.thechels.themes-for-nnw/releases/latest).
2. Download the `.zip` for your chosen theme, unzip it, and open the `.nnwtheme` file directly.

## Release a new version

1. Make changes inside the relevant `name.nnwtheme` folder (e.g. `guro.nnwtheme` or `thechelsuk.nnwtheme`).
2. Update the `Version` in `name.nnwtheme/Info.plist`.
3. Bump the version in `package.json`.
4. Commit and push to `main` — the release workflow runs automatically.

The workflow calls `scripts/build-release-artifacts.sh` to:

- Package each `*.nnwtheme` folder into its own `name.zip`
- Validate that each zip contains only the correct `name.nnwtheme` root
- Publish a GitHub Release with all zips attached

## Adding a new theme

1. Create a new `name.nnwtheme` folder in the repo root containing at minimum `Info.plist`, `stylesheet.css`, and `template.html`.
2. No workflow changes needed — it discovers all `*.nnwtheme` folders automatically.
