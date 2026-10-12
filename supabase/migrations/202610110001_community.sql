-- Brick Legends community schema.
-- Apply in the Supabase SQL editor or with the Supabase CLI.
-- The anon key may be public. Do not put the service-role key in this repository or in browser code.
-- Publication, voting, awards, and Annual Five writes stay closed for ordinary users.

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text not null,
  biography text not null default '',
  avatar_url text,
  minimum_age_confirmed boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$' and username !~ '--'),
  constraint profiles_username_reserved check (username not in ('archive-studio', 'admin', 'moderator', 'support', 'system', 'lego', 'api')),
  constraint profiles_display_name_len check (char_length(display_name) between 1 and 64),
  constraint profiles_biography_len check (char_length(biography) <= 600),
  constraint profiles_age_gate check (minimum_age_confirmed),
  constraint profiles_avatar_closed check (avatar_url is null)
);

create unique index profiles_username_key on public.profiles (username);

create table public.app_settings (
  id integer primary key default 1,
  publication_open boolean not null default false,
  voting_open boolean not null default false,
  annual_five_open boolean not null default false,
  constraint app_settings_singleton check (id = 1)
);

insert into public.app_settings (id) values (1);

create table public.moderators (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (user_id) on delete cascade,
  name text not null,
  biography text not null default '',
  appearance jsonb not null,
  abilities jsonb not null,
  statistics jsonb not null,
  overall integer not null,
  rarity text not null,
  rarity_rule_version text not null,
  card_year integer not null,
  local_id text,
  visibility text not null default 'private',
  moderation_status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint characters_name_len check (char_length(name) between 1 and 64),
  constraint characters_bio_len check (char_length(biography) <= 600),
  constraint characters_year check (card_year between 2026 and 2100),
  constraint characters_overall check (overall between 0 and 100),
  constraint characters_rarity check (rarity in ('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic')),
  constraint characters_visibility check (visibility in ('private', 'public')),
  constraint characters_moderation check (moderation_status in ('draft', 'submitted', 'approved', 'rejected', 'removed')),
  constraint characters_public_is_approved check (visibility <> 'public' or moderation_status = 'approved'),
  constraint characters_local_id check (local_id is null or local_id ~ '^BL-DRAFT-[a-z0-9-]{4,40}$')
);

create unique index characters_one_local_import on public.characters (creator_id, local_id) where local_id is not null;
create index characters_creator_created on public.characters (creator_id, created_at desc);

create table public.published_cards (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null unique references public.characters (id) on delete cascade,
  creator_id uuid not null references public.profiles (user_id) on delete cascade,
  artwork_path text,
  published_at timestamptz not null default now(),
  status text not null default 'published',
  constraint published_cards_status check (status in ('published', 'removed')),
  constraint published_cards_art_closed check (artwork_path is null)
);

create index published_cards_public on public.published_cards (status, published_at desc);

create table public.favorites (
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  character_id uuid not null references public.characters (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, character_id)
);

create table public.awards (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (user_id) on delete cascade,
  kind text not null,
  season_year integer,
  note text not null default '',
  created_at timestamptz not null default now(),
  constraint awards_kind check (kind in ('annual-five'))
);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  voter_id uuid not null references public.profiles (user_id) on delete cascade,
  character_id uuid not null references public.characters (id) on delete cascade,
  board text not null,
  period text not null,
  created_at timestamptz not null default now(),
  constraint votes_board check (board in ('most-creative', 'highest-rated', 'community-favorites', 'month', 'year', 'all-time')),
  constraint votes_period check (period ~ '^[0-9]{4}(-[0-9]{2})?$'),
  unique (voter_id, character_id, board, period)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (user_id) on delete cascade,
  character_id uuid references public.characters (id) on delete set null,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  constraint reports_reason_len check (char_length(reason) between 10 and 500),
  constraint reports_status check (status in ('open', 'reviewing', 'closed'))
);

create index reports_reporter_recent on public.reports (reporter_id, created_at desc);

create table public.annual_five_seasons (
  year integer primary key,
  status text not null default 'not-open',
  criteria text not null default '',
  constraint annual_year check (year between 2026 and 2100),
  constraint annual_status check (status in ('not-open', 'submissions', 'judging', 'announced', 'closed'))
);

create table public.annual_five_entries (
  id uuid primary key default gen_random_uuid(),
  season_year integer not null references public.annual_five_seasons (year),
  character_id uuid not null references public.characters (id) on delete cascade,
  creator_id uuid not null references public.profiles (user_id) on delete cascade,
  selection_status text not null default 'none',
  edition_code text,
  production_status text not null default 'none',
  auction_status text not null default 'none',
  auction_house text,
  auction_url text,
  sale_currency text,
  sale_amount numeric,
  sale_observed_on date,
  created_at timestamptz not null default now(),
  constraint annual_entry_selection check (selection_status in ('none', 'submitted', 'shortlisted', 'winner', 'not-selected')),
  constraint annual_entry_production check (production_status in ('none', 'planned', 'printed', 'cancelled')),
  constraint annual_entry_auction check (auction_status in ('none', 'scheduled', 'closed')),
  constraint annual_entry_edition check (edition_code is null or edition_code ~ '^[0-9]{4}-00[1-5]$'),
  constraint annual_entry_sale check (
    (sale_amount is null and sale_currency is null and sale_observed_on is null)
    or (sale_amount >= 0 and sale_currency is not null and sale_observed_on is not null)
  ),
  unique (season_year, character_id),
  unique (edition_code)
);

create table public.legal_terms (
  version text primary key,
  kind text not null,
  body text not null,
  published boolean not null default false,
  constraint legal_terms_kind check (kind in ('commercial', 'privacy', 'community'))
);

create table public.commercial_consents (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (user_id) on delete cascade,
  character_id uuid not null references public.characters (id) on delete cascade,
  terms_version text not null references public.legal_terms (version),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (creator_id, character_id, terms_version)
);

create or replace function public.appearance_ok(value jsonb)
returns boolean
language sql
immutable
as $$
  select jsonb_typeof(value) = 'object'
    and value->>'finish' in ('porcelain', 'amber', 'clay', 'walnut', 'stone', 'ink')
    and value->>'head' in ('block', 'rounded', 'wide')
    and value->>'expression' in ('smile', 'focus', 'wink', 'surprise', 'calm')
    and value->>'hair' in ('none', 'crop', 'sweep', 'long', 'spikes')
    and value->>'hat' in ('none', 'cap', 'crown', 'brim')
    and value->>'helmet' in ('none', 'dome', 'knight', 'pilot')
    and value->>'torso' in ('tunic', 'jacket', 'armor', 'coat', 'vest')
    and value->>'torsoColor' in ('crimson', 'navy', 'forest', 'gold', 'plum', 'sand', 'coal', 'ivory')
    and value->>'arms' in ('plain', 'sleeves', 'guards')
    and value->>'armColor' in ('crimson', 'navy', 'forest', 'gold', 'plum', 'sand', 'coal', 'ivory')
    and value->>'legs' in ('straight', 'boots', 'wrapped')
    and value->>'legColor' in ('crimson', 'navy', 'forest', 'gold', 'plum', 'sand', 'coal', 'ivory')
    and value->>'accessory' in ('none', 'cape', 'shield', 'staff', 'satchel', 'lantern')
    and value->>'accent' in ('gold', 'copper', 'ice', 'signal')
    and value->>'background' in ('paper', 'night', 'desert', 'aurora', 'field', 'harbor');
$$;

create or replace function public.enforce_character_rules()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  power integer;
  creativity integer;
  defense integer;
  computed integer;
  item jsonb;
begin
  if auth.role() is distinct from 'service_role' then
    if auth.uid() is null then
      raise exception 'Sign in required';
    end if;
    if tg_op = 'INSERT' then
      new.creator_id := auth.uid();
      new.moderation_status := 'draft';
      new.visibility := 'private';
      new.created_at := now();
      if (select count(*) from public.characters where creator_id = auth.uid()) >= 200 then
        raise exception 'Character storage limit reached';
      end if;
    else
      if old.creator_id is distinct from auth.uid() then
        raise exception 'Not the owner';
      end if;
      new.creator_id := old.creator_id;
      new.created_at := old.created_at;
      new.visibility := old.visibility;
      if old.moderation_status = 'draft' and new.moderation_status = 'submitted' then
        if not coalesce((select publication_open from public.app_settings where id = 1), false) then
          raise exception 'Publication is closed';
        end if;
      else
        new.moderation_status := old.moderation_status;
      end if;
      if new.statistics = old.statistics then
        new.overall := old.overall;
        new.rarity := old.rarity;
        new.rarity_rule_version := old.rarity_rule_version;
      end if;
    end if;
  end if;

  if tg_op = 'UPDATE' and new.statistics = old.statistics then
    new.overall := old.overall;
    new.rarity := old.rarity;
    new.rarity_rule_version := old.rarity_rule_version;
  else
    if new.statistics->>'power' !~ '^([0-9]|[1-9][0-9]|100)$'
      or new.statistics->>'creativity' !~ '^([0-9]|[1-9][0-9]|100)$'
      or new.statistics->>'defense' !~ '^([0-9]|[1-9][0-9]|100)$' then
      raise exception 'Invalid statistics';
    end if;
    power := (new.statistics->>'power')::integer;
    creativity := (new.statistics->>'creativity')::integer;
    defense := (new.statistics->>'defense')::integer;
    computed := round(power * 0.34 + creativity * 0.40 + defense * 0.26);
    new.overall := computed;
    new.rarity := case
      when computed < 40 then 'Common'
      when computed < 55 then 'Uncommon'
      when computed < 70 then 'Rare'
      when computed < 83 then 'Epic'
      when computed < 94 then 'Legendary'
      else 'Mythic'
    end;
    new.rarity_rule_version := 'bl-rarity-1';
  end if;

  new.name := btrim(new.name);
  if not public.appearance_ok(new.appearance) then
    raise exception 'Invalid appearance';
  end if;
  if jsonb_typeof(new.abilities) <> 'array' or jsonb_array_length(new.abilities) > 3 then
    raise exception 'Invalid abilities';
  end if;
  for item in select value from jsonb_array_elements(new.abilities) loop
    if jsonb_typeof(item) <> 'object'
      or char_length(coalesce(item->>'name', '')) > 40
      or char_length(coalesce(item->>'text', '')) > 160 then
      raise exception 'Invalid abilities';
    end if;
  end loop;
  new.updated_at := now();
  return new;
end;
$$;

create trigger characters_enforce
  before insert or update on public.characters
  for each row execute function public.enforce_character_rules();

create or replace function public.touch_profile()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' then
    if tg_op = 'INSERT' then
      new.user_id := auth.uid();
    else
      new.user_id := old.user_id;
      new.created_at := old.created_at;
    end if;
    new.avatar_url := null;
  end if;
  new.username := lower(btrim(new.username));
  new.display_name := btrim(new.display_name);
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch
  before insert or update on public.profiles
  for each row execute function public.touch_profile();

create or replace function public.delete_my_creator_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in required';
  end if;
  delete from public.profiles where user_id = auth.uid();
end;
$$;

revoke all on function public.delete_my_creator_data() from public;
grant execute on function public.delete_my_creator_data() to authenticated;

create or replace function public.file_report(target uuid, reason text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in required';
  end if;
  if char_length(btrim(reason)) < 10 or char_length(btrim(reason)) > 500 then
    raise exception 'Describe the report in 10 to 500 characters';
  end if;
  if not exists (
    select 1 from public.published_cards
    where character_id = target and status = 'published'
  ) then
    raise exception 'Only a published card can be reported';
  end if;
  if (
    select count(*) from public.reports
    where reporter_id = auth.uid() and created_at > now() - interval '1 day'
  ) >= 10 then
    raise exception 'Report limit reached';
  end if;
  insert into public.reports (reporter_id, character_id, reason, status)
  values (auth.uid(), target, btrim(reason), 'open')
  returning id into created;
  return created;
end;
$$;

revoke all on function public.file_report(uuid, text) from public;
grant execute on function public.file_report(uuid, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.moderators enable row level security;
alter table public.characters enable row level security;
alter table public.published_cards enable row level security;
alter table public.favorites enable row level security;
alter table public.awards enable row level security;
alter table public.votes enable row level security;
alter table public.reports enable row level security;
alter table public.annual_five_seasons enable row level security;
alter table public.annual_five_entries enable row level security;
alter table public.legal_terms enable row level security;
alter table public.commercial_consents enable row level security;

create policy profiles_select on public.profiles for select using (true);
create policy profiles_insert_own on public.profiles for insert with check (user_id = auth.uid());
create policy profiles_update_own on public.profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy profiles_delete_own on public.profiles for delete using (user_id = auth.uid());

create policy settings_read on public.app_settings for select using (true);

create policy characters_select on public.characters for select using (
  creator_id = auth.uid()
  or (visibility = 'public' and moderation_status = 'approved')
);
create policy characters_insert_own on public.characters for insert with check (creator_id = auth.uid());
create policy characters_update_own on public.characters for update using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy characters_delete_own on public.characters for delete using (creator_id = auth.uid());

create policy published_select on public.published_cards for select using (status = 'published');

create policy favorites_select_own on public.favorites for select using (user_id = auth.uid());
create policy favorites_insert_own on public.favorites for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.published_cards
    where character_id = favorites.character_id and status = 'published'
  )
);
create policy favorites_delete_own on public.favorites for delete using (user_id = auth.uid());

create policy awards_select on public.awards for select using (true);

create policy votes_select_own on public.votes for select using (voter_id = auth.uid());

create policy reports_select_own on public.reports for select using (reporter_id = auth.uid());

create policy seasons_select_announced on public.annual_five_seasons for select using (status = 'announced');
create policy entries_select_winners on public.annual_five_entries for select using (
  selection_status = 'winner'
  and exists (
    select 1 from public.annual_five_seasons
    where year = annual_five_entries.season_year and status = 'announced'
  )
);

create policy consents_select_own on public.commercial_consents for select using (creator_id = auth.uid());

create view public.gallery_cards with (security_invoker = true) as
select
  published_cards.id as card_id,
  published_cards.published_at,
  characters.id as character_id,
  characters.name,
  characters.appearance,
  characters.overall,
  characters.rarity,
  characters.rarity_rule_version,
  profiles.username,
  profiles.display_name
from public.published_cards
join public.characters on characters.id = published_cards.character_id
join public.profiles on profiles.user_id = published_cards.creator_id
where published_cards.status = 'published';

grant select on public.gallery_cards to anon, authenticated;
grant select on public.profiles, public.app_settings, public.characters, public.published_cards, public.awards, public.annual_five_seasons, public.annual_five_entries to anon, authenticated;
grant select, insert, update, delete on public.characters to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select on public.votes, public.reports, public.commercial_consents to authenticated;
grant insert, update on public.profiles to authenticated;
grant delete on public.profiles to authenticated;

-- No insert policy exists for votes, awards, published_cards, moderators, seasons, entries, or consents.
-- approve_character is intentionally absent until a moderator process and legal review exist.

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant insert, update, delete on table public.profiles to authenticated;

revoke all on table public.app_settings from anon, authenticated;
grant select on table public.app_settings to anon, authenticated;

revoke all on table public.moderators from anon, authenticated;

revoke all on table public.characters from anon, authenticated;
grant select on table public.characters to anon, authenticated;
grant insert, update, delete on table public.characters to authenticated;

revoke all on table public.published_cards from anon, authenticated;
grant select on table public.published_cards to anon, authenticated;

revoke all on table public.favorites from anon, authenticated;
grant select, insert, delete on table public.favorites to authenticated;

revoke all on table public.awards from anon, authenticated;
grant select on table public.awards to anon, authenticated;

revoke all on table public.votes from anon, authenticated;
grant select on table public.votes to authenticated;

revoke all on table public.reports from anon, authenticated;
grant select on table public.reports to authenticated;

revoke all on table public.annual_five_seasons from anon, authenticated;
grant select on table public.annual_five_seasons to anon, authenticated;

revoke all on table public.annual_five_entries from anon, authenticated;
grant select on table public.annual_five_entries to anon, authenticated;

revoke all on table public.legal_terms from anon, authenticated;

revoke all on table public.commercial_consents from anon, authenticated;
grant select on table public.commercial_consents to authenticated;
