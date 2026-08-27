# Build person-level/index.html — the person-level-only ratings explorer.
# Same source data as build.R, but restricted to the 8 person-level
# characteristics. Writes a self-contained site into person-level/.
suppressPackageStartupMessages({
  library(haven)
  library(dplyr)
  library(jsonlite)
  library(utils)
})

DATA_DIR <- "/Users/laila/Github/Social-signals-of-jobs/data/Ratings - Final/Main/Prepped Data"
DESC_CSV <- "/Users/laila/Github/Social-signals-of-jobs/dofiles/Ratings - Final/Characteristic Survey Build/FinalJobDescriptions.csv"

OUT_DIR <- "person-level"

person_keys <- c("Extroversion", "Compassion", "Intelligence", "Motivation",
                 "Creativity", "Organization", "Honesty", "Leadership")

# --- Ratings ----------------------------------------------------------------
ratings <- as.data.frame(read_dta(file.path(DATA_DIR, "Avg Ratings for All Occ.dta")))
ratings <- ratings %>% mutate(across(where(is.numeric), ~ round(.x, 2)))

ratings$Person_Avg <- round(rowMeans(ratings[, person_keys], na.rm = TRUE), 2)
ratings$Person_Avg[is.nan(ratings$Person_Avg)] <- NA

ratings <- ratings[, c("jobtitle", person_keys, "Person_Avg")]
ratings_json <- as.character(toJSON(ratings, na = "null", dataframe = "rows", auto_unbox = TRUE))

# --- Job descriptions -------------------------------------------------------
descs <- read.csv(DESC_CSV, stringsAsFactors = FALSE)
desc_map <- setNames(descs$description, descs$Title)

# Supplemental descriptions for out-of-labor-force categories (not in the CSV)
supp_descs <- c(
  "Stay-at-Home Parents" = "Not participating in the labor force and taking care of children in the household.",
  "Retired" = "No longer participating in the labor force due to age or personal choice.",
  "Voluntarily Unemployed" = "Choosing not to participate in the labor force.",
  "Involuntarily Unemployed and Searching for a Job" = "Involuntarily unemployed and actively seeking employment.",
  "Out of the Labor Force and Receiving Disability Benefits" = "Not participating in the labor force and receiving Social Security disability benefits."
)
desc_map <- c(desc_map, supp_descs)
descs_json <- as.character(toJSON(as.list(desc_map), auto_unbox = TRUE))

# --- Participant / rating counts (person-level ratings only) ----------------
long <- as.data.frame(read_dta(file.path(DATA_DIR, "Ratings Data - Long.dta")))
long_person <- long[long$charType == "person" & !is.na(long$rating), ]
n_participants <- length(unique(long_person$prolific_ID))
n_ratings <- nrow(long_person)
meta_json <- as.character(toJSON(list(
  n_participants = n_participants,
  n_ratings = n_ratings,
  n_occupations = nrow(ratings),
  build_date = format(Sys.Date(), "%B %e, %Y")
), auto_unbox = TRUE))

# --- Compose HTML -----------------------------------------------------------
# Styling is shared with the full site: copy app.css in so person-level/ is
# deployable on its own.
file.copy("app.css", file.path(OUT_DIR, "app.css"), overwrite = TRUE)

body <- paste(readLines(file.path(OUT_DIR, "body.html"), warn = FALSE), collapse = "\n")
cache_bust <- as.integer(Sys.time())
body <- sub('src="app.js"', sprintf('src="app.js?v=%d"', cache_bust), body, fixed = TRUE)
html_css_tag <- sprintf('<link rel="stylesheet" href="app.css?v=%d">', cache_bust)

html <- sprintf(
'<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Social Signals of Jobs &mdash; Person-Level Ratings</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%%22http://www.w3.org/2000/svg%%22 viewBox=%%220 0 16 16%%22><rect width=%%2216%%22 height=%%2216%%22 rx=%%223%%22 fill=%%22%%234f7fa8%%22/><text x=%%228%%22 y=%%2212%%22 font-size=%%2211%%22 text-anchor=%%22middle%%22 fill=%%22white%%22 font-family=%%22sans-serif%%22 font-weight=%%22bold%%22>P</text></svg>">
%s
<script src="https://cdn.plot.ly/plotly-2.35.2.min.js" charset="utf-8"></script>
</head>
<body>
<script id="ratings-data" type="application/json">%s</script>
<script id="descriptions-data" type="application/json">%s</script>
<script id="meta-data" type="application/json">%s</script>
%s
</body>
</html>
', html_css_tag, ratings_json, descs_json, meta_json, body)

writeLines(html, file.path(OUT_DIR, "index.html"))
message(sprintf("Wrote %s/index.html: %d occupations, %d participants, %d person-level ratings",
                OUT_DIR, nrow(ratings), n_participants, n_ratings))
