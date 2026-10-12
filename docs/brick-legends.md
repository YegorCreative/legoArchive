# Brick Legends

Brick Legends is a section of LEGO Archive, not a second site. It does not replace the set encyclopedia.

## What the prototype does

- Original geometric characters, drawn as SVG. They are not LEGO minifigures and do not use the LEGO logo.
- A live card preview, a flip to the back, and PNG export at 1500×2100.
- Local drafts in `localStorage` under `lego-archive.brick-legends.drafts.v1`.
- Rarity rule `bl-rarity-1`: overall = round(power × 0.34 + creativity × 0.40 + defense × 0.26), then a published band. A saved draft stores the rule version and the resulting rarity.
- Rankings and the Annual Five use fictional demonstration characters. They are labeled as such. There are no vote totals and no auction results.

## What it deliberately does not do

GitHub Pages cannot safely host accounts, public galleries, votes, reports, or payments. Those features are not simulated with client-side counters.

Before a public launch, the project still needs creator terms, a commercial license for any selected design, eligibility and age rules, originality rules, moderation, a server-side vote with abuse controls, a privacy notice, and an intellectual-property review. Auctions of physical cards should go through an outside house. Platforms worth evaluating later: eBay, Heritage Auctions, Goldin, and Catawiki. None of them is a partner of this site.

A later backend could be a hosted Postgres database plus an authenticated API. Secrets must stay off the static site.
