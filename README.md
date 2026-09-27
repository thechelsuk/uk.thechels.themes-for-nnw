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

- Package each `*.nnwtheme` folder into its own `name.zip`
- Validate that each zip contains only the correct `name.nnwtheme` root
- Publish a GitHub Release with all zips attached

## Adding a new theme

1. Create a new `name.nnwtheme` folder in the repo root containing at minimum `Info.plist`, `stylesheet.css`, and `template.html`.
2. No workflow changes needed — it discovers all `*.nnwtheme` folders automatically.

## Build and Pre-commit Process

There is a pre-commit hook that automatically injects JavaScript from `scripts/template-scripts/` into each `*.nnwtheme/template.html` file. This allows maintenance of a single source of truth for shared scripts. We cannot link to JS as NNW requires inline scripts, so we inject them during the build process.

### Directory Structure

```text
scripts/
├── template-scripts/          # Shared JS files (single source of truth)
│   ├── youtube-link-rewrite.js
│   └── linker.js
└── inject-template-scripts.sh # Script to inject JS into templates
```

### How It Works

1. **Source Files**: All JavaScript code lives in `scripts/template-scripts/`
2. **Injection Markers**: Each `*.nnwtheme/template.html` file contains markers:

   ```html
   <!-- INJECT_SCRIPTS_BEGIN -->
   <script src="youtube-link-rewrite.js"></script>
   <script src="linker.js"></script>
   <!-- INJECT_SCRIPTS_END -->
   ```

3. **Build Process**: Running `./scripts/inject-template-scripts.sh` replaces the marker content with inline `<script>` tags containing the actual JavaScript

## Usage

### Pre-Commit Hook

A Git pre-commit hook automatically injects scripts when you commit changes to:

- Any `*.nnwtheme/template.html` file
- Any file in `scripts/template-scripts/`

The hook runs `./scripts/inject-template-scripts.sh` and stages the updated templates automatically.

### During Development

**Edit the source files:**

```bash
# Edit the shared scripts
scripts/template-scripts/linker.js
scripts/template-scripts/youtube-link-rewrite.js
```

**Inject changes manually (optional):**

```bash
./scripts/inject-template-scripts.sh
```

## Test locally

Open any `test/*.html` file in a browser. Test files reference the source scripts directly, so no build step is needed for testing.

### Adding a New Script

1. Create your script in `scripts/template-scripts/yourscript.js`
2. Add a reference in each template's marker section:

   ```html
   <!-- INJECT_SCRIPTS_BEGIN -->
   <script src="youtube-link-rewrite.js"></script>
   <script src="linker.js"></script>
   <script src="yourscript.js"></script>
   <!-- INJECT_SCRIPTS_END -->
   ```

3. Run the injection script: `./scripts/inject-template-scripts.sh`

### Why This Approach?

- Easy Testing, as test files reference source scripts directly
- Avoids maintaining the same code in 5+ template files
- Automation, as Pre-commit hook keeps templates up-to-date

## Files

- `youtube-link-rewrite.js` - Embeds YouTube videos inline, plus an "Open in extension.app" link
- `linker.js` - Extracts URLs and creates reference-style citations
- `inject-template-scripts.sh` - Injection automation script

## Notes

- Pre-commit hook automatically injects scripts when committing
- The injection script is idempotent (safe to run multiple times)
- Test files (`test/*.html`) use relative paths to source scripts
- Template files (`*.nnwtheme/template.html`) have inline scripts

## YouTube embeds

YouTube rejects embeds that send no HTTP referrer (*Error 153*), and NetNewsWire sends none because articles load from a local base URL. The themes therefore embed videos via [embed.thechels.uk](https://github.com/thechelsuk/uk.thechels.embed), a static wrapper page that supplies the referrer.

If the wrapper does not report back within 10 seconds of the embed scrolling into view, the iframe is replaced with a thumbnail linking to the video on YouTube.
