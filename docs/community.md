# Brick Legends community setup

Accounts are built against Supabase and stay disconnected until these values exist. Do not create a paid Supabase add-on for this step. The free project is enough to start. This repository does not contain a project URL or key.

The publishable (anon) key may be present in the built site. The service-role key must not be committed, pasted into an issue, or added as `PUBLIC_SUPABASE_ANON_KEY`.

## What you create

1. In the [Supabase dashboard](https://supabase.com/), create a project. Note the project URL, which looks like `https://your-project.supabase.co`.
2. In Project Settings → API, copy the publishable anon key. Confirm the key’s JWT role is `anon`, or that it begins with `sb_publishable_`. If the role is `service_role`, stop.
3. In the SQL editor, run `supabase/migrations/202610110001_community.sql` once.
4. In Authentication → Providers, keep Email enabled. Turn on “Confirm email”.
5. Set the Site URL to `https://yegorcreative.github.io/legoArchive/brick-legends/account/`.
6. Add redirect URLs:
   - `https://yegorcreative.github.io/legoArchive/brick-legends/account/`
   - `http://localhost:4321/legoArchive/brick-legends/account/`
7. Leave Google and Apple disabled until you finish the provider setup below. The buttons are in the interface and will report that the provider is not enabled.
8. In the GitHub repository settings, add Actions secrets (not variables that hold the service-role key):
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
9. Re-run the Pages workflow. The next build inlines those two values. An empty secret leaves accounts disconnected, which is the safe default.

Local development can use a `.env` file copied from `.env.example`. `.env` is gitignored.

## Google

In Google Cloud, create an OAuth client of type Web application. The authorized redirect URI is the Supabase callback shown in Authentication → Google, typically `https://your-project.supabase.co/auth/v1/callback`. Paste the client id and secret into that Supabase provider and enable it. Do not commit them.

## Apple

Apple Developer requires a Services ID, a Sign in with Apple key, and the same Supabase callback as the return URL. Supabase’s Apple provider form asks for the Services ID, team id, key id, and private key. Enable the provider only after that form is complete. This site does not claim Apple sign-in works before that.

## What the database allows

- A signed-in person can insert and edit only their own profile and characters.
- New characters are forced to private drafts. Rarity is calculated with rule `bl-rarity-1`. Unchanged statistics keep the stored rarity and rule version.
- A user cannot set a card public or approved. `publication_open` defaults to false, so even “submitted” is rejected.
- There is no insert policy on votes, awards, published cards, seasons, entries, or commercial consents.
- Gallery reads `gallery_cards`, which only includes published cards. The view uses `security_invoker`, so row-level security still applies.
- Reports can be filed only against a published card, at most ten a day.
- An account may store 200 characters. Private drafts do not upload a PNG.
- Avatar upload and public artwork storage are closed (`avatar_url` and `artwork_path` must stay null).
- Deleting creator data removes the profile and cascaded rows. It does not delete the Supabase Auth user. Remove that user from the dashboard when a person asks for full deletion.

## What was not done

No Supabase project was created from this repository. Policies were not executed against two live users. Voting, publication, and the Annual Five are present as locked tables, not as live features. The privacy page and community guidelines are drafts, not a legal review.
