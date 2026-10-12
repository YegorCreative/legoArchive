# Data sources

## Rebrickable downloads

Primary catalog: [Rebrickable downloads](https://rebrickable.com/downloads/).

Reviewed before use:

- The downloads page offers daily CSV files for sets, themes, parts, and inventories.
- The API exists, requires a personal key, and is rate-limited. Bulk catalog data is supposed to come from the downloads, not from repeated API calls.
- Terms allow the CSV files to be downloaded automatically at most once a day.
- Terms allow the data to be used for any purpose, including commercial use, with attribution to Rebrickable.
- Scraping HTML pages is prohibited.
- Set images may be shown on an external site. The CDN URLs in `sets.csv` are used directly. They are not bulk-downloaded into this repository.
- Rebrickable’s terms also say its content may not be used to train AI models. This archive stores the catalog for display, not as a training set.

Fields used: set number, name, year, theme id, part count, and the image URL pattern. Theme name and parent id come from `themes.csv`.

Fields not in these files, and therefore unavailable in the interface: original retail price, currency, market value, retirement year, exact release date, age guidance, and minifigure count.

`num_parts` of 0 is common on books, offers, and other items without an inventoried build (8,337 rows in the imported snapshot). Those are shown as “piece count unavailable,” excluded from piece totals, and sorted after real piece counts.

## BrickLink

Not integrated. BrickLink does not offer this project an open bulk feed of historical sold prices, and scraping it would break its terms. Current market values stay empty until a permitted, dated source is recorded per set.

## Prices

`src/data/prices.json` is an empty array. A future observation needs:

- set id
- kind: `original-retail`, `market-new`, or `market-used`
- amount and currency
- market or country
- date, when known
- source
- verification: `verified` or `estimated`

Percentage change and inflation adjustment run only when the required inputs exist. For USD inflation, use a published index such as the U.S. Bureau of Labor Statistics CPI for the original market. Do not invent intermediate price-history points.

## Identity rules

- Canonical id is the Rebrickable set number, including the variant suffix (`7140-1`).
- Regional or reprint variants stay as separate records when the source file keeps them separate.
- Theme groups use the parent chain. A Town set is not refiled as City.
- The snapshot is not labeled as the complete history of LEGO.
