-- ═══════════════════════════════════════════════════════════════════
-- vtopia — Complete Database Schema
-- Paste this entire file into Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- ── Extensions ──────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Clean slate (safe to re-run) ────────────────────────────────────
drop table if exists sponsored_listings  cascade;
drop table if exists reviews             cascade;
drop table if exists wishlists           cascade;
drop table if exists bookings            cascade;
drop table if exists quiz_results        cascade;
drop table if exists experiences         cascade;
drop table if exists guides              cascade;
drop table if exists cities              cascade;
drop table if exists profiles            cascade;

-- ════════════════════════════════════════════════════════════════════
-- 1. PROFILES
--    Auto-created when a user signs up via Supabase Auth trigger
-- ════════════════════════════════════════════════════════════════════
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  first_name      text,
  last_name       text,
  avatar_url      text,
  bio             text,
  home_city       text,
  role            text not null default 'user'   -- 'user' | 'guide' | 'admin' | 'partner'
                  check (role in ('user','guide','admin','partner')),
  is_verified     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ════════════════════════════════════════════════════════════════════
-- 2. CITIES
-- ════════════════════════════════════════════════════════════════════
create table cities (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  slug        text not null unique,
  state       text not null,
  emoji       text,
  description text,
  image_url   text,
  is_active   boolean not null default true,
  sort_order  int     not null default 0,
  created_at  timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════
-- 3. GUIDES
-- ════════════════════════════════════════════════════════════════════
create table guides (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references profiles(id) on delete cascade,
  first_name     text not null,
  last_name      text not null,
  avatar_url     text,
  bio            text,
  city           text not null,
  languages      text[] default '{}',
  specialties    text[] default '{}',
  rating         numeric(3,2) default 0,
  review_count   int default 0,
  response_rate  int default 0,        -- percentage 0–100
  is_superhost   boolean default false,
  is_verified    boolean default false,
  is_active      boolean default true,
  created_at     timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════
-- 4. EXPERIENCES
-- ════════════════════════════════════════════════════════════════════
create table experiences (
  id                uuid primary key default uuid_generate_v4(),
  title             text not null,
  description       text,
  city              text not null,
  category          text not null
                    check (category in (
                      'Food & Drink','Outdoors','Nightlife',
                      'Sports','Arts & Culture','Wellness'
                    )),
  price_per_person  numeric(8,2) not null,
  duration_minutes  int,
  duration_label    text,            -- e.g. "2 hrs", "Fri–Sat"
  max_guests        int default 8,
  image_emoji       text,
  image_url         text,
  image_gradient    text,            -- CSS gradient class name
  rating            numeric(3,2) default 0,
  review_count      int default 0,
  guide_id          uuid references guides(id),
  is_active         boolean not null default true,
  is_sponsored      boolean not null default false,
  is_featured       boolean not null default false,
  tags              text[] default '{}',
  what_is_included  text[] default '{}',
  cancellation_policy text default 'Free cancellation up to 24 hours before the experience.',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════
-- 5. QUIZ RESULTS
-- ════════════════════════════════════════════════════════════════════
create table quiz_results (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references profiles(id) on delete cascade,
  interests        text[] not null default '{}',  -- ['food','outdoors',...]
  budget           int   not null default 100,     -- max spend per experience
  travel_style     text,                           -- 'spontaneous'|'planner'|...
  group_type       text[] default '{}',            -- ['couple','friends',...]
  destination_city text,
  arrive_date      date,
  depart_date      date,
  created_at       timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════
-- 6. BOOKINGS
-- ════════════════════════════════════════════════════════════════════
create table bookings (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references profiles(id),
  experience_id       uuid not null references experiences(id),
  booking_date        date not null,
  booking_time        text not null,
  guest_count         int  not null default 1,
  subtotal            numeric(10,2) not null,
  commission          numeric(10,2) not null,
  total_amount        numeric(10,2) not null,
  status              text not null default 'pending'
                      check (status in ('pending','confirmed','completed','cancelled','refunded')),
  stripe_payment_intent_id text,
  stripe_charge_id         text,
  contact_name        text,
  contact_email       text,
  contact_phone       text,
  special_requests    text,
  booking_reference   text unique default 'VT-' || floor(random()*90000+10000)::text,
  confirmed_at        timestamptz,
  cancelled_at        timestamptz,
  refunded_at         timestamptz,
  created_at          timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════
-- 7. WISHLISTS
-- ════════════════════════════════════════════════════════════════════
create table wishlists (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references profiles(id) on delete cascade,
  experience_id uuid not null references experiences(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique(user_id, experience_id)
);

-- ════════════════════════════════════════════════════════════════════
-- 8. REVIEWS
-- ════════════════════════════════════════════════════════════════════
create table reviews (
  id            uuid primary key default uuid_generate_v4(),
  booking_id    uuid references bookings(id),
  user_id       uuid not null references profiles(id),
  experience_id uuid not null references experiences(id) on delete cascade,
  rating        int  not null check (rating between 1 and 5),
  body          text,
  guide_response text,
  created_at    timestamptz not null default now()
);

-- Update experience rating when a review is inserted/updated
create or replace function update_experience_rating()
returns trigger language plpgsql as $$
begin
  update experiences set
    rating       = (select round(avg(rating)::numeric, 2) from reviews where experience_id = new.experience_id),
    review_count = (select count(*) from reviews where experience_id = new.experience_id)
  where id = new.experience_id;
  return new;
end;
$$;

create trigger on_review_upsert
  after insert or update on reviews
  for each row execute procedure update_experience_rating();

-- ════════════════════════════════════════════════════════════════════
-- 9. SPONSORED LISTINGS
-- ════════════════════════════════════════════════════════════════════
create table sponsored_listings (
  id            uuid primary key default uuid_generate_v4(),
  experience_id uuid references experiences(id) on delete cascade,
  partner_name  text,
  placement     text,           -- 'card_slot_1'|'card_slot_2'|'inline_banner'|'sidebar'
  city          text,
  budget_total  numeric(10,2),
  budget_spent  numeric(10,2) default 0,
  impressions   int default 0,
  clicks        int default 0,
  starts_at     date,
  ends_at       date,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════════

-- Enable RLS on every user-facing table
alter table profiles          enable row level security;
alter table quiz_results       enable row level security;
alter table bookings           enable row level security;
alter table wishlists          enable row level security;
alter table reviews            enable row level security;

-- Experiences and cities are public (anyone can read)
alter table experiences        enable row level security;
alter table cities             enable row level security;
alter table guides             enable row level security;
alter table sponsored_listings enable row level security;

-- ── profiles ──
create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- ── experiences ──
create policy "Experiences are public"
  on experiences for select using (is_active = true);

create policy "Admins can manage experiences"
  on experiences for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ── cities ──
create policy "Cities are public"
  on cities for select using (is_active = true);

-- ── guides ──
create policy "Guides are public"
  on guides for select using (is_active = true);

-- ── quiz_results ──
create policy "Users can manage their own quiz results"
  on quiz_results for all using (auth.uid() = user_id);

-- ── bookings ──
create policy "Users can view their own bookings"
  on bookings for select using (auth.uid() = user_id);

create policy "Users can create bookings"
  on bookings for insert with check (auth.uid() = user_id);

create policy "Admins can view all bookings"
  on bookings for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ── wishlists ──
create policy "Users can manage their own wishlists"
  on wishlists for all using (auth.uid() = user_id);

-- ── reviews ──
create policy "Reviews are public"
  on reviews for select using (true);

create policy "Authenticated users can create reviews"
  on reviews for insert with check (auth.uid() = user_id);

create policy "Users can update their own reviews"
  on reviews for update using (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════
-- SEED DATA — 5 Cities + 20 Experiences
-- ════════════════════════════════════════════════════════════════════

insert into cities (name, slug, state, emoji, description, sort_order) values
  ('New York City', 'new-york-city', 'NY', '🗽', 'The city that never sleeps. Art, food, sport and culture at every corner.', 1),
  ('Miami',         'miami',         'FL', '🌊', 'Sun, sand, Cuban food, art deco, and the best nightlife in the South.', 2),
  ('Orlando',       'orlando',       'FL', '🎢', 'Theme parks, family adventures, and hidden culinary gems.',              3),
  ('Las Vegas',     'las-vegas',     'NV', '🎰', 'The entertainment capital of the world. Shows, dining, and the Strip.',  4),
  ('New Orleans',   'new-orleans',   'LA', '🎷', 'Jazz, Creole food, festivals, and the most unique culture in America.', 5);

-- Sample guide
insert into guides (first_name, last_name, city, bio, languages, specialties, rating, review_count, response_rate, is_superhost, is_verified) values
  ('Marco', 'Castillo', 'Miami', 'Born and raised in Little Havana. 6 years guiding. 3,200+ guests hosted.',
   ARRAY['English','Spanish','Portuguese'],
   ARRAY['Water sports','Cuban food culture','Miami art','Wildlife tours'],
   4.97, 847, 98, true, true);

-- Store the guide id for use in experiences
do $$
declare
  guide_id uuid;
begin
  select id into guide_id from guides where first_name = 'Marco';

  insert into experiences (title, city, category, price_per_person, duration_label, max_guests, image_emoji, image_gradient, rating, review_count, guide_id, what_is_included, is_featured) values
    ('Sunset Kayak Tour',           'Miami',         'Outdoors',      45,  '2 hrs',   8,  '🌊', 'ci-mia', 4.9, 312, guide_id, ARRAY['All kayak equipment','Expert guide','Welcome drink','Dry bag'], true),
    ('Little Havana Food Walk',     'Miami',         'Food & Drink',  65,  '3 hrs',   10, '🍽️', 'ci-orl', 4.9, 441, guide_id, ARRAY['8+ tastings','Cuban coffee','Local guide','Transport not included'], true),
    ('Sound Bath & Meditation',     'Miami',         'Wellness',      35,  '75 min',  12, '🧘', 'ci-grn', 4.8, 119, guide_id, ARRAY['Crystal bowls','Guided meditation','Yoga mat provided'], false),
    ('Surf Lesson — South Beach',   'Miami',         'Outdoors',      80,  '90 min',  6,  '🏄', 'ci-mia', 4.7, 276, guide_id, ARRAY['Board & wetsuit','Certified instructor','Beginner friendly'], false),
    ('Wynwood Walls Art Tour',      'Miami',         'Arts & Culture',30,  '1.5 hrs', 15, '🎨', 'ci-lv',  4.8, 509, guide_id, ARRAY['Expert art guide','Free admission','Group max 15'], false),
    ('Rooftop Jazz & Cocktails',    'Miami',         'Nightlife',     40,  'Fri–Sat', 20, '🎵', 'ci-no',  4.8, 22,  guide_id, ARRAY['Welcome cocktail','Live jazz','Rooftop access'], false),

    ('Times Sq Food & History Tour','New York City', 'Food & Drink',  72,  '3 hrs',   12, '🗽', 'ci-nyc', 4.8, 623, null, ARRAY['8+ food stops','NYC history','English guide'], false),
    ('Central Park Bike Tour',      'New York City', 'Outdoors',      38,  '2 hrs',   10, '🚲', 'ci-grn', 4.9, 844, null, ARRAY['Bike & helmet','Scenic routes','Photo stops'], false),
    ('Broadway Show VIP Night',     'New York City', 'Arts & Culture',189, '3 hrs',   4,  '🎭', 'ci-nyc', 4.9, 290, null, ARRAY['Premium seat','Pre-show drink','Backstage access'], false),
    ('Brooklyn Speakeasy Crawl',    'New York City', 'Nightlife',     55,  'Evening', 10, '🍸', 'ci-lv',  4.6, 177, null, ARRAY['4 speakeasy stops','Welcome cocktail','History stories'], false),

    ('Universal Studios VIP',       'Orlando',       'Sports',        220, 'Full day',2,  '🎪', 'ci-orl', 4.8, 1102,null, ARRAY['VIP front-of-line','Express access','Guided experience'], false),
    ('Everglades Airboat Ride',     'Orlando',       'Outdoors',      55,  '1.5 hrs', 6,  '🌿', 'ci-grn', 4.7, 398, null, ARRAY['Airboat ride','Wildlife spotting','Certified captain'], false),
    ('Disney World Insider Tour',   'Orlando',       'Arts & Culture',95,  '4 hrs',   6,  '🏰', 'ci-orl', 4.9, 512, null, ARRAY['Skip-the-line','Disney history','Insider secrets'], false),
    ('Orlando Food & Theme Tour',   'Orlando',       'Food & Drink',  60,  '3 hrs',   8,  '🍕', 'ci-orl', 4.7, 241, null, ARRAY['6 restaurant stops','Theme park history','Local secrets'], false),

    ('High Roller Observation Wheel','Las Vegas',    'Sports',        35,  '30 min',  25, '🎡', 'ci-lv',  4.6, 2100,null, ARRAY['Premium cabin','Panoramic views','Open bar option'], false),
    ('Cirque du Soleil — Vegas',    'Las Vegas',     'Arts & Culture',105, '2 hrs',   2,  '🎪', 'ci-lv',  4.9, 771, null, ARRAY['Premium seating','Pre-show champagne','Meet & greet option'], false),
    ('Vegas Neon Lights Night Tour','Las Vegas',     'Nightlife',     65,  '3 hrs',   8,  '✨', 'ci-lv',  4.8, 334, null, ARRAY['Night photography','Neon museum access','Transport included'], false),
    ('Las Vegas Cooking Masterclass','Las Vegas',    'Food & Drink',  90,  '2.5 hrs', 8,  '👨‍🍳', 'ci-orl', 4.7, 189, null, ARRAY['Hands-on cooking','Celebrity chef techniques','Take recipe home'], false),

    ('Jazz Brunch — French Quarter','New Orleans',   'Food & Drink',  48,  '2 hrs',   12, '🎷', 'ci-no',  4.9, 531, null, ARRAY['Brunch included','Live jazz','Cocktail history tour'], false),
    ('Bourbon Street Ghost Tour',   'New Orleans',   'Nightlife',     35,  '2 hrs',   15, '👻', 'ci-no',  4.7, 288, null, ARRAY['Haunted history','Expert guide','Flashlight provided'], false);
end;
$$;

-- ════════════════════════════════════════════════════════════════════
-- RECOMMENDATION SCORING FUNCTION (SQL version)
-- Call this from Supabase Edge Functions for server-side scoring
-- ════════════════════════════════════════════════════════════════════

create or replace function get_recommendations(
  p_user_id   uuid,
  p_city      text    default null,
  p_category  text    default null,
  p_max_budget numeric default 500,
  p_limit     int     default 20
)
returns table (
  id                uuid,
  title             text,
  city              text,
  category          text,
  price_per_person  numeric,
  duration_label    text,
  image_emoji       text,
  rating            numeric,
  review_count      int,
  is_sponsored      boolean,
  score             int,
  is_saved          boolean
)
language plpgsql security definer as $$
declare
  v_interests     text[];
  v_budget        int;
  v_travel_style  text;
  v_dest_city     text;
  v_saved_ids     uuid[];
begin
  -- Fetch user quiz answers
  select
    interests, budget, travel_style, destination_city
  into
    v_interests, v_budget, v_travel_style, v_dest_city
  from quiz_results
  where user_id = p_user_id
  order by created_at desc
  limit 1;

  -- Fetch saved experience ids
  select array_agg(experience_id)
  into v_saved_ids
  from wishlists
  where user_id = p_user_id;

  v_saved_ids  := coalesce(v_saved_ids, '{}');
  v_interests  := coalesce(v_interests, '{}');
  v_budget     := coalesce(v_budget, 500);

  return query
  select
    e.id,
    e.title,
    e.city,
    e.category,
    e.price_per_person,
    e.duration_label,
    e.image_emoji,
    e.rating,
    e.review_count,
    e.is_sponsored,
    -- SCORING LOGIC
    (
      -- Category match (35 pts)
      case when array_length(v_interests,1) is null then 17
           when (
             (e.category = 'Food & Drink'  and 'food'      = any(v_interests)) or
             (e.category = 'Outdoors'       and 'outdoors'  = any(v_interests)) or
             (e.category = 'Nightlife'      and 'nightlife' = any(v_interests)) or
             (e.category = 'Sports'         and 'sports'    = any(v_interests)) or
             (e.category = 'Arts & Culture' and 'arts'      = any(v_interests)) or
             (e.category = 'Wellness'       and 'wellness'  = any(v_interests))
           ) then 35 else 0 end
      +
      -- Budget fit (25 pts)
      case when e.price_per_person <= v_budget
           then greatest(0, round(25 * (1 - e.price_per_person::numeric / greatest(v_budget,1) * 0.5)))
           else 0 end
      +
      -- City match (20 pts)
      case when v_dest_city is null then 10
           when e.city = v_dest_city then 20
           else 0 end
      +
      -- Travel style match (10 pts)
      case v_travel_style
        when 'spontaneous' then case when e.category in ('Nightlife','Outdoors') then 10 else 3 end
        when 'planner'     then case when e.category in ('Arts & Culture','Food & Drink') then 10 else 3 end
        when 'solo'        then case when e.category in ('Outdoors','Wellness','Arts & Culture') then 10 else 3 end
        when 'social'      then case when e.category in ('Food & Drink','Nightlife','Sports') then 10 else 3 end
        when 'luxury'      then case when e.category in ('Wellness','Arts & Culture','Food & Drink') then 10 else 3 end
        else 5
      end
      +
      -- Rating quality (5 pts)
      round((e.rating / 5.0) * 5)
      +
      -- Saved bonus (5 pts)
      case when e.id = any(v_saved_ids) then 5 else 0 end
    )::int as score,
    (e.id = any(v_saved_ids)) as is_saved
  from experiences e
  where
    e.is_active = true
    and (p_city     is null or e.city     = p_city)
    and (p_category is null or e.category = p_category)
    and (p_max_budget is null or e.price_per_person <= p_max_budget)
  order by score desc, e.rating desc
  limit p_limit;
end;
$$;

-- Done! Your database is ready.
-- Next: go to Supabase → Authentication → Providers → enable Google OAuth
