# Theme Bundle for NetNewsWire

A collection of themes for [NetNewsWire](https://netnewswire.com/).

## Themes

- Fresh, a light theme, based on thechels.uk 'morning' theme
- Guro; a light mode only, clean and minimal.
- Thechelsuk; adaptive to device light/dark mode and is based on the thechels.uk website design
- Retro; dark-only theme, red text.
- Magda; dark-only theme, with gray text and custom fonts, for easy reading.
- Claudio; dark-only theme, warm charcoal with cream text and a clay accent, using system fonts.

## Install

1. Go to the [latest release](https://github.com/thechelsuk/uk.thechels.themes-for-nnw/releases/latest).
2. Download the `.zip` for your chosen theme, unzip it, and open the `.nnwtheme` file directly.

## Release a new version

1. Make changes inside the relevant `name.nnwtheme` folder (e.g. `guro.nnwtheme` or `thechelsuk.nnwtheme`).
2. Update the `Version` in `name.nnwtheme/Info.plist`.
3. Bump the version in `package.json`.
4. Commit and push to `main` — the release workflow runs automatically.

The workflow calls `scripts/build-release-artifacts.sh` to:

- Inline the shared scripts into each template (see below)
- Package each `*.nnwtheme` folder into its own `name.zip`
- Validate that each zip contains only the correct `name.nnwtheme` root
- Publish a GitHub Release with all zips attached

Themes are only built in CI. Install themes from a release, not from the repository folders.

## Adding a new theme

1. Create a new `name.nnwtheme` folder in the repo root containing at minimum `Info.plist`, `stylesheet.css`, and `template.html`.
2. Add the script markers to `template.html` (see below).
3. Add a `test/name.html` page that links the theme's stylesheet and the source scripts.
4. No workflow changes needed — it discovers all `*.nnwtheme` folders automatically.

## Shared scripts

NetNewsWire themes cannot load external JavaScript, so shared scripts live once in `scripts/template-scripts/` and are inlined into every template at release time.

```text
scripts/
├── template-scripts/              # Shared JS (single source of truth)
│   ├── youtube-link-rewrite.js    # Inline YouTube embeds + "Open in extension.app" link
│   └── linker.js                  # Reference-style citations and a References list
├── inject-template-scripts.sh     # Inlines the scripts between the markers
└── build-release-artifacts.sh     # CI: inject, zip, write release notes
```

Committed templates only reference the scripts between markers:

```html
<!-- INJECT_SCRIPTS_BEGIN -->
<script src="youtube-link-rewrite.js"></script>
<script src="linker.js"></script>
<!-- INJECT_SCRIPTS_END -->
```

During the release, `inject-template-scripts.sh` replaces each `<script src>` with the file's contents. Nothing is inlined in the repository, so templates never go stale.

To add a shared script, create it in `scripts/template-scripts/` and add a `<script src="yourscript.js"></script>` line inside the markers of each template that needs it.

A theme-specific script (such as Claudio's reading time and progress bar) can be written inline in that theme's `template.html`, outside the markers.

## Test locally

Open any `test/*.html` file in a browser. Test pages link the theme stylesheet and the source scripts directly, so no build is needed.

- `test/bluesky.html` mirrors a Bluesky RSS post: a plain-text body with scheme-less and repeated YouTube links.
- `test/youtube-url-cases.html` runs the YouTube script against a list of URL forms and edge cases and prints PASS or FAIL for each. Serve the repo root over http (e.g. `python3 -m http.server`) to open it, as it fetches the source script.

## YouTube embeds

YouTube rejects embeds that send no HTTP referrer (*Error 153*), and NetNewsWire sends none because articles load from a local base URL. The themes therefore embed videos via [embed.thechels.uk](https://github.com/thechelsuk/uk.thechels.embed), a static wrapper page that supplies the referrer.

If the wrapper does not report back within 10 seconds of the embed scrolling into view, the iframe is replaced with a thumbnail linking to the video on YouTube.
