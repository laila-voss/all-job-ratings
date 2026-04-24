# Social Signals of Jobs — Average Ratings Explorer

Interactive explorer for average ratings of 105 occupations on 15 characteristics (8 person-level, 7 occupation-level), collected via Prolific.

The live site is served by GitHub Pages from `index.html` in this repo.

## Files

- `index.html` — the generated site (deployable as-is)
- `app.js`, `app.css` — all frontend logic and styling
- `body.html` — the tabbed HTML template
- `build.R` — rebuilds `index.html` from the source `.dta` files + `body.html`
- `index.Rmd` — thin wrapper that calls `build.R`

## Rebuild

```bash
Rscript build.R
```

This reads the latest ratings / descriptions / participant counts from the local
`Social-signals-of-jobs` data directory and regenerates `index.html`.
