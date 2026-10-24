# Hamadullah Bijarani — Academic Portfolio

A standalone, dependency-free build of the portfolio site: plain HTML, CSS, and
JavaScript. No build step, no frameworks, no server-side code.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The complete single-page site |
| `styles.css` | All styles (light + dark themes) |
| `script.js` | Theme toggle, tabs, filters, copy buttons, dialogs, PEFT calculator |
| `assets/` | Profile photo and CV PDF |

## Deploy to GitHub Pages

1. Create a repository named `<username>.github.io` (or any repo for a project page).
2. Copy all files in this folder into the repository root, keeping the `assets/` folder intact.
3. Commit and push to the `main` branch.
4. In the repository: **Settings → Pages → Source: Deploy from a branch → main / (root)**.
5. The site goes live at `https://<username>.github.io/` within a minute or two.

For a project page (`https://<username>.github.io/<repo>/`), the relative paths
in this build already work as-is.

## Notes

- The day/night preference is remembered in the visitor's browser (localStorage).
- The PEFT Compute Explorer figures are illustrative planning estimates, not
  measured benchmarks.
- Fonts (Newsreader, Plus Jakarta Sans, JetBrains Mono) load from Google Fonts;
  an internet connection is needed for the exact typefaces, with system fonts as fallback.
