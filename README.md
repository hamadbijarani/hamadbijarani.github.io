# Hamadullah Bijarani — Academic Portfolio

Plain HTML and CSS. No framework, no build tooling for the site itself, and no
JavaScript on the home page. Light/dark follows the visitor's system setting.

## Structure

```
index.html                 Home page (edit text directly)
peft-explorer.html         Standalone PEFT compute explorer (only page with JS)
styles.css                 All shared styles
assets/                    Profile photo and CV PDF (unchanged, keep as is)
projects/
  _template.html           Starter for a new project page (ignored by the build)
  sem-7/                   One folder per semester
    dsd8-processor.html    One page per project
tools/build_projects.py    Regenerates the "Semester projects" list
.github/workflows/         Runs the script automatically on push
```

## Adding a semester project

1. Copy `projects/_template.html` to `projects/sem-N/<name>.html`
   (or make `projects/sem-N/<name>/index.html` if the project has its own
   images or files). Create the `sem-N` folder if it is new.
2. Edit the page. Its `<title>` and `<meta name="description">` become the
   entry on the home page. Optional: `<meta name="course">` and
   `<meta name="tags">` (comma separated).
3. Commit and push. The GitHub Action updates `index.html` for you.

Without the Action, run `python3 tools/build_projects.py` before committing.
Custom pages (for example a Vite/React build) work as long as they have a
`<title>` and ideally a description. Files or folders starting with `_` are
skipped, so `_draft.html` stays off the site until you rename it.

The list on the home page sits between `projects:start` and `projects:end`
in `index.html`. Do not edit between those markers; the script overwrites it.

## Everything else

Education, experience, publications, skills, and the "Selected AI systems"
list are plain HTML in `index.html`. Edit them in place.

## Deploy to GitHub Pages

1. Create a repository (`<username>.github.io`, or any repo for a project page).
2. Copy this folder's contents into the repository root, keeping `assets/`.
3. Push to `main`, then **Settings → Pages → Deploy from a branch → main / (root)**.

All paths are relative, so project pages (`https://<username>.github.io/<repo>/`) work as-is.

## Notes

- Fonts (Newsreader, Plus Jakarta Sans, JetBrains Mono) load from Google Fonts,
  with system fonts as fallback.
- The PEFT explorer figures are illustrative planning estimates, not benchmarks.
- Add a back link to the home page on each project page, for example
  `<a href="../../index.html#projects">← All projects</a>`
  (use `../../../` for the folder style).
