# Pricing

Prices are observations. Historical MSRP, a sealed-market estimate, a used-market estimate, a verified sale, and a purchasing-power adjustment are stored and displayed as different things.

## What is imported

`src/data/prices.json` is empty. No LEGO retail or resale figure is in the site.

`src/data/cpi-u.json` holds annual means of BLS series `CUUR0000SA0` (CPI-U, all items, US city average, not seasonally adjusted), retrieved 2026-10-11 from the public BLS API. A year is stored only when all twelve months are numeric. 2025 is omitted because October 2025 is published as unavailable after a lapse in appropriations. 2026 is omitted because the pull only includes January through August. Those gaps are not filled.

Purchasing power for a verified USD original price is `amount × (CPI in the comparison year ÷ CPI in the original year)`. The comparison year is the latest complete stored year. The result is what the original dollars would buy in that later year. It is not an estimate of what the set would sell for.

## Sources reviewed

| Need | Source | Decision |
| --- | --- | --- |
| Original retail | LEGO.com, catalogs, press material | No bulk license. Do not scrape. A later sample may be typed from a page a person opened, with URL, market, and the date it was read. A discounted retailer price is not MSRP. |
| Sealed and used market | BrickLink price guide API | Allowed only under the [API terms](https://www.bricklink.com/help.asp?helpID=2216) for a registered seller. The token stays in a server or Actions secret. Each pull records sold versus asking, market, and the date. The public guide is a recent window, not a full history. |
| Historical sales | BrickLink, auction houses | No open license to copy a sold-price database. Record a single verified result only when the house, date, lot, currency, and price are published. |
| Other datasets | Rebrickable downloads, Brickset, BrickEconomy | Rebrickable CSVs have no set prices. Brickset and BrickEconomy do not grant redistribution of their databases. |

## What you would need to provide for BrickLink

1. A BrickLink seller account approved for the API.
2. A consumer key and secret, plus a token, created in the BrickLink developer settings.
3. Permission to store dated summaries (not their entire database) in this repository or in a private backend.
4. Those secrets in GitHub Actions or the backend host, never in a commit.

Until that exists, sealed and used values stay “Unavailable”.

## Rankings

Most valuable, greatest appreciation, highest original retail, and theme or year boards render only when verified observations cover the sets being ranked. With an empty price file, the price archive states that the boards are withheld.
