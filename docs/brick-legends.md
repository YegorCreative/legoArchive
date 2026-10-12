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

## Backend recommendation

GitHub Pages stays the public site. Accounts, card files, votes, and moderation need a separate service. Nothing below is provisioned.

| Option | Fit | Cost note |
| --- | --- | --- |
| Supabase | Auth, Postgres, and file storage in one project. The static site calls it with a public anon key. Row-level security has to deny anonymous writes except where a policy explicitly allows them. | Free tier is enough for a prototype. It has database size, storage, and monthly active-user caps that change. Confirm the current limits before relying on them. |
| Firebase | Similar auth, database, and storage. | Free Spark tier exists. A Google-account project and security rules are required. |
| Cloudflare Workers, D1, and R2 | Workers sit in front of the API. D1 holds rows. R2 holds PNG cards. Turnstile can slow bots. | Free allocations exist. The site would still be built by GitHub Actions and would call the worker URL. More pieces to operate than Supabase. |

Recommendation: Supabase, after you approve creating a project. The anon key may be public. The service role key must not be. Unlimited digital characters means no per-character fee. Storage still needs a cap, a publish limit, and abuse controls. Do not promise unlimited cloud storage.

Suggested tables, not created yet: `profiles`, `characters` (id, owner id, created at, published at, attributes, art path, rarity, rule version, moderation status, visibility), `votes` (one row per voter, character, and period), `reports`, and `consents` for a later physical-card license. Publishing a character does not insert a commercial consent.

## Ranking methodology

This method is not in force. No public vote exists. When a board opens, the same text will be on the policies page before results appear, and a published result will not be changed in private.

- Algorithmic: fictional overall from rarity rule `bl-rarity-1`. It stays on the card and does not set community rank.
- Voters: Most Creative, Highest Rated, Community Favorites, Best of the Month, and Best of the Year. One authenticated vote per account, character, and published period, with a published vote limit and rate limit.
- Judges, labeled as judges: Annual Five notes may cover originality, design quality, and storytelling. Those notes are shown with the selection.
- All-Time Legends would sum published vote totals from closed periods, with no extra hidden weight.

## 3D viewer

A rotating viewer is feasible later with Three.js, loading one original model on the creator page only. It should stay off the 28,000 set pages. The current SVG studio remains the creator. A WebGL view needs a reduced-motion still frame and a working non-WebGL preview. Three.js is not a dependency of this release because the set-page build should not carry a 3D library it never uses.
