# Pricing

Prices are observations. A store MSRP, a launch retail price, a mail-order catalog price, a discounted retail price, a current LEGO shop price, a sealed-market estimate, a used-market estimate, an incomplete-set estimate, a single auction sale, and a purchasing-power adjustment are stored and displayed as different things.

## What is imported

`src/data/prices.json` holds 14 verified prices from the Fall 1999 United States LEGO Shop at Home catalog, preserved on the Internet Archive as `1999FallUSShopAtHome`. Each amount was read from the page image on 2026-10-12. Optical character recognition was not used as the source of a digit.

The customer-care page of that issue says: “Our Prices INCLUDE Shipping & Handling!” Express delivery is listed as an extra charge. Because regular shipping is inside the printed price, every record uses kind `mail-order`, class `mail-order`, and condition `not-applicable`. None of them is a store MSRP.

The observation date is `1999-11-30` because that is the gift-with-order deadline printed in the same issue. It is not a proven first day of sale. `publicationDate` is null because the issue is not dated to a single day on the page that was read.

| Set | Name | Catalog price |
| --- | --- | --- |
| 4561-1 | Railway Express | $139.00 |
| 4990-1 | Rock Raiders HQ | $88.00 |
| 7150-1 | TIE Fighter & Y-wing | $54.00 |
| 7140-1 | X-wing Fighter | $33.00 |
| 7151-1 | Sith Infiltrator | $33.00 |
| 4950-1 | Loader-Dozer | $22.00 |
| 7130-1 | Snowspeeder | $22.00 |
| 7141-1 | Naboo Fighter | $22.00 |
| 7131-1 | Anakin’s Podracer | $16.50 |
| 7121-1 | Naboo Swamp | $11.00 |
| 7128-1 | Speeder Bikes | $11.00 |
| 7101-1 | Lightsaber Duel | $6.75 |
| 7110-1 | Landspeeder | $6.75 |
| 7111-1 | Droid Fighter | $6.75 |

Currency is USD. Market is United States. Source URL is the Internet Archive leaf for the page that prints the price. Where the catalog’s piece sentence disagrees with the Rebrickable snapshot, the snapshot count is kept and the disagreement is written in the note. The catalog is not edited to match the price file.

### 7140-1 discrepancy

The Fall 1999 catalog page prints $33.00 for #7140 X-wing Fighter, shipping included. An archived starwars.com Cargo Bay item page has been cited elsewhere at an MSRP of $29.99. That $29.99 figure is not imported. It was not read from a LEGO price list for this release, and it is not averaged with $33.00. The set page note records the conflict. Store MSRP for 7140-1 stays unavailable.

### Not imported

- Current LEGO shop prices seen only in search snippets, including figures quoted for 75192-1. A snippet is not a page that was opened and checked.
- Secondary reports of a 2017 launch price for 75192-1.
- Fan-site prices that cite Brickset without the underlying LEGO page.
- Any digit that came only from OCR.

No current sealed, used, incomplete, or auction value is stored. Count of those observations: 0.

`src/data/cpi-u.json` holds annual means of BLS series `CUUR0000SA0` (CPI-U, all items, US city average, not seasonally adjusted), retrieved 2026-10-11 from the public BLS API. A year is stored only when all twelve months are numeric. 2025 is omitted because October 2025 is published as unavailable after a lapse in appropriations. 2026 is omitted because the pull only includes January through August. Those gaps are not filled. The latest complete comparison year is 2024. A 2024-dollar figure is not described as a 2026-dollar figure.

Purchasing power for a verified USD amount is `amount × (CPI in the comparison year ÷ CPI in the observation year)`. On a set page, the store-MSRP adjustment and the Shop at Home adjustment are separate sentences. Both measure what those dollars would buy. Neither is an estimate of what the set would sell for.

## Validation

`src/lib/pricing.ts` rejects a record that has a bad id, a set id that does not look like `7140-1`, a price class or condition that does not match its kind, a non-positive amount, a currency that is not three letters, a missing market, a date outside 1949-01-01 through the verification day, a bad verification status, a missing source, or a source URL that is not `https`. Duplicate ids and duplicate observation keys are rejected when the price file loads. Tests also require every `setId` to exist in the catalog. The catalog is not changed to admit a price.

A percentage is withheld when either amount is missing, the original is not positive, the currencies differ, or the markets differ. Appreciation is withheld unless the earlier observation is a verified store MSRP or launch price and the later one is a verified market or auction observation. A mail-order price never feeds that percentage. A mean uses only the verified amounts it is given. An empty list or mixed currencies return null. Missing prices are never filled with zero.

A market chart is withheld unless comparable dated market observations exist. One catalog price is not drawn as a history.

## BrickLink

Reviewed on 2026-10-11 from public pages, without an API call.

| Question | What the public pages support |
| --- | --- |
| Eligibility | [API Terms of Use](https://www.bricklink.com/help.asp?helpID=2216), updated Feb 2, 2023. Registered sellers may register for the API. The terms incorporate the site terms and can be ended by BrickLink. |
| Authentication | [Getting started](https://www.bricklink.com/v3/api.page). A consumer key and consumer secret identify the application. An access token and token secret are issued per registered IP address. The token has no published expiration. Credentials must stay off the client and out of git. |
| What the API is for | The [welcome page](https://www.bricklink.com/v2/api/welcome.page) describes the BrickLink Store API for managing a store. It is not an open bulk feed for an encyclopedia. |
| Price guide | The same welcome changelog describes a Get Price Guide call that can include or exclude VAT, filter by seller location, and return sales information. New and used are separate grades on BrickLink’s public guide. This project has not called the endpoint, so no min, max, or average is shown. |
| Asking versus sold | A guide can describe current stock or past sales. An asking price is not a completed sale, and a guide average is not a guaranteed price. Either kind would be stored under its own observation type, with the pull date. |
| Rate limits | The Feb 2, 2023 English terms page, as retrieved for this note, does not state a numeric cap. An older localized help page (`helpID=2436`) says users are allocated 5,000 calls per day by default and tells developers who expect to exceed it to write to apisupport@bricklink.com. That older number is not treated here as the current contract. |
| Storage | The terms do not grant this project the right to copy BrickLink’s price database into the repository. A later import, if the maintainer gets seller access and confirms permission, would store dated summaries for specific sets, not a mirror of the guide. |
| Display and attribution | Nothing from BrickLink is displayed. If a permitted summary is added later, the page must name BrickLink, the pull date, the market, and whether the figure is sold or asking. |
| Commercial use | The Feb 2, 2023 terms reserve the right to charge for API access. The older localized terms prohibit selling or sublicensing the API or other members’ content. This archive does not resell prices. |

No BrickLink credential is committed. No GitHub Action calls BrickLink. The existing Pages workflow is unchanged. To turn the integration on later, a maintainer would need:

1. A BrickLink seller account accepted for the Store API.
2. A consumer key, consumer secret, token, and token secret, plus the IP registration BrickLink requires.
3. A written decision that storing dated per-set summaries is allowed.
4. Those secrets in a private environment, never in browser JavaScript and never in a commit.
5. A review of the JSON before it is committed. The site must not claim market prices until that file exists.

Until then, sealed, used, incomplete, and auction values stay “Unavailable”.

## Rankings

Most valuable, greatest appreciation, and highest store MSRP render only from verified observations of that same kind. With zero market observations and zero store MSRP records, those boards stay unavailable. The price archive table of 14 Shop at Home prices states the coverage as a count out of 28,487 sets. It is a sample, not a global ranking. Decade rows are coverage counts. They are not a chart of retail prices across decades. Theme rows list only themes present in the sample. Town and City are not merged.
