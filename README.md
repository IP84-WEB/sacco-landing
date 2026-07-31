# SACCO landing page

Static one-page website for SACCO.

## v6 changes

- The payoff is embedded directly inside `index.html` as vector SVG paths.
  It no longer depends on a separate payoff file, so the broken-image issue
  cannot recur if an asset is omitted during upload.
- All entrance animations are slower.
- The yellow line now draws more slowly from left to right.
- Added keyboard focus states, a skip link, semantic text for the vector payoff,
  reduced-motion support and an Accessibility link.
- Added `accessibility.html` with an accessibility statement.

## Upload

Replace the repository files with:

- `index.html`
- `accessibility.html`
- `style.css`
- `README.md`
- `assets/`

The file `assets/sacco-payoff.svg` may remain in the repository, but the home
page no longer depends on it.
