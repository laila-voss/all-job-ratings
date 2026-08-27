# Social Signals of Jobs — Average Ratings Explorer

Interactive explorer for average ratings of 105 occupations on 15 characteristics (8 person-level, 7 occupation-level), collected via Prolific.

The live site is served by GitHub Pages from `index.html` in this repo.

## Files

- `index.html` — the generated site (deployable as-is)
- `app.js`, `app.css` — all frontend logic and styling
- `body.html` — the tabbed HTML template
- `build.R` — rebuilds `index.html` from the source `.dta` files + `body.html`
- `index.Rmd` — thin wrapper that calls `build.R`
- `person-level/` — a person-level-only version of the same explorer (the 8
  person characteristics, no occupation-level ones), self-contained and
  deployable on its own at `/person-level/`
- `build_person.R` — rebuilds `person-level/index.html` (and copies `app.css` in)

## Rebuild

```bash
Rscript build.R
Rscript build_person.R
```

These read the latest ratings / descriptions / participant counts from the local
`Social-signals-of-jobs` data directory and regenerate `index.html` and
`person-level/index.html`.

### Person-level version

`person-level/` has the same five tabs, restricted to Extroversion, Compassion,
Intelligence, Motivation, Creativity, Organization, Honesty, and Leadership.
The all/person/occupation toggle on Full Ratings is gone (everything is
person-level), the occupation profile shows a single chart, and the footer
counts only person-level ratings (`charType == "person"`). It has its own
`body.html` and `app.js`; `app.css` is copied from the parent at build time, so
edit the parent copy and rebuild.
