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

`src/data/prices.json` is an empty array. No retail or market sample is imported in this phase, because none of the bulk feeds below grants this project a license to copy a price database.

Each future observation needs all of the following:

- set id matching a catalog record, such as `7140-1`
- kind: `original-retail`, `market-new`, or `market-used`
- amount in major currency units
- currency (ISO 4217)
- market or country
- observation date (`YYYY-MM-DD`)
- source name, and a source URL in the note when one exists
- verification: `verified` or `estimated`

Missing amounts stay null. They are never stored or charted as zero. A percentage is withheld when either amount is missing, the original is not positive, or the two currencies differ. A history line is withheld until the same set has two dated observations. Inflation stays uncalculated until a published index series is stored beside the original price. For a US-dollar retail price, the intended series is the U.S. Bureau of Labor Statistics CPI-U, series `CUUR0000SA0`, using the annual average for the observation year. The series values themselves have to be copied from BLS with the series id and retrieval date. They are not in the repository yet.

### Providers, in priority order

1. Original retail. The authoritative figure is the LEGO Group’s own shop, catalog, or press material for a stated market and date. No public bulk license for those prices was found. Do not scrape LEGO.com. A later sample may be typed in by hand from a page the maintainer opened, with the URL, market, and the date it was read. One hand-checked price is not a history.
2. Current sealed market. BrickLink’s price guide is the practical source for recent sold prices. The [BrickLink API terms](https://www.bricklink.com/help.asp?helpID=2216) (updated Feb 2, 2023) limit API use to registered sellers, fold in the site terms, and reserve the right to charge. The key would live only in a server or Actions secret, never in client JavaScript. Each import must record whether the figure is a sold average or an asking price, the market, and the date of the pull. The public guide is a rolling recent window, not a complete auction archive.
3. Current used market. Same BrickLink (or another licensed marketplace) feed, stored as `market-used`, separate from sealed prices.
4. Historical observations. No open, licensed, dated sold-price archive was found. BrickLink’s visible history is not a license to reconstruct every past sale. BrickEconomy and similar products sell access and do not grant redistribution into this repository. Brickset’s API requires a key and does not allow republishing its database.

Rebrickable’s CSV downloads, which this archive already uses, do not include set retail or market prices. The Rebrickable API is allowed for catalog use with attribution and still is not a retail-price dump. Part price estimates on Rebrickable are 24-hour store averages for new parts, not set MSRP, and they are not imported.

Until a permitted feed or a hand-checked official price is added, every price field on the site says unavailable.

## Identity rules

- Canonical id is the Rebrickable set number, including the variant suffix (`7140-1`).
- Regional or reprint variants stay as separate records when the source file keeps them separate.
- Theme groups use the parent chain. A Town set is not refiled as City.
- The snapshot is not labeled as the complete history of LEGO.
