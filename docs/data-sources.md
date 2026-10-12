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

Fields not in these files: original retail price, currency, market value, retirement year, exact release date, age guidance, and minifigure count. Retirement year, exact release date, age, and minifigure count stay unavailable in the interface. A separate hand-checked file, described below, holds a small Shop at Home sample. It is not part of the Rebrickable download.

`num_parts` of 0 is common on books, offers, and other items without an inventoried build (8,337 rows in the imported snapshot). Those are shown as “piece count unavailable,” excluded from piece totals, and sorted after real piece counts.

## BrickLink

Not integrated, and not called. The Store API is for registered sellers under the [API Terms of Use](https://www.bricklink.com/help.asp?helpID=2216) (updated Feb 2, 2023). Scraping the website is not allowed. Current sealed and used values stay empty until a permitted, dated observation is recorded for a specific set. The setup requirements are in [docs/pricing.md](pricing.md). No credential is stored in this repository.

## Prices

`src/data/prices.json` holds 14 mail-order prices read from the Fall 1999 US LEGO Shop at Home catalog on the Internet Archive. They include regular shipping and handling. They are not store MSRP, and they are not market values. The set list, the 7140-1 discrepancy, and the BrickLink decision are in [docs/pricing.md](pricing.md).

Each observation needs all of the following:

- id, a lowercase slug
- set id matching a catalog record, such as `7140-1`
- kind and a matching price class: `original-retail` (`msrp` or `launch-retail`), `mail-order`, `discounted-retail`, `current-shop`, `market-new`, `market-used`, `market-incomplete`, or `auction-sale`
- condition matching that kind
- amount in major currency units, greater than zero
- currency (three-letter ISO code)
- market or country
- observation date (`YYYY-MM-DD`)
- source name and an `https` source URL
- publication date, or null when the source is not dated to a day
- `verifiedAt`
- verification: `verified` or `estimated`
- note, or null

Missing amounts stay null. They are never stored or charted as zero. A percentage is withheld when either amount is missing, the original is not positive, the currencies differ, or the markets differ. Appreciation also requires a verified store price on one side and a verified market observation on the other. A history chart is withheld until comparable dated market observations exist. One catalog price is not a chart.

US purchasing power uses BLS CPI-U series `CUUR0000SA0` in `src/data/cpi-u.json`, retrieved 2026-10-11. The latest complete year in that file is 2024. Incomplete years are omitted rather than estimated. See [docs/pricing.md](pricing.md).

### Providers, in priority order

1. Original retail. The authoritative figure is the LEGO Group’s own shop, catalog, or press material for a stated market and date. No public bulk license for those prices was found. Do not scrape LEGO.com. The Fall 1999 Shop at Home sample was typed from page images a person opened. A mail-order price that includes shipping is labeled `mail-order`, not MSRP. One catalog is not a history.
2. Current sealed market. BrickLink’s price guide is a practical source for recent sold prices, only after a seller account and permission to store summaries. The key would live only in a server or Actions secret, never in client JavaScript. Each import must record whether the figure is a sold average or an asking price, the market, and the date of the pull. No such import has been run.
3. Current used market. Same rule, stored as `market-used`, separate from sealed prices. Incomplete sets use `market-incomplete`.
4. A single auction sale. Record it only when the house, date, lot, currency, condition, and price are published. Do not copy an auction database.
5. Other datasets. Rebrickable CSVs have no set prices. Part price estimates on Rebrickable are 24-hour store averages for new parts, not set MSRP, and they are not imported. Brickset and BrickEconomy do not grant redistribution of their databases.

## Identity rules

- Canonical id is the Rebrickable set number, including the variant suffix (`7140-1`).
- Regional or reprint variants stay as separate records when the source file keeps them separate.
- Theme groups use the parent chain. A Town set is not refiled as City.
- The snapshot is not labeled as the complete history of LEGO.
