-- ── Group Travel Tables ─────────────────────────────────────────────────────

-- Core trip object — the shared container for both solo and group trips
CREATE TABLE IF NOT EXISTS trips (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  destination     TEXT NOT NULL DEFAULT 'Kansas City',
  start_date      DATE,
  end_date        DATE,
  trip_type       TEXT DEFAULT 'solo'      CHECK (trip_type IN ('solo','group')),
  status          TEXT DEFAULT 'planning'  CHECK (status IN ('planning','confirmed','completed')),
  share_token     TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  total_budget_cents INTEGER DEFAULT 0,
  is_public       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trips_created_by_idx ON trips(created_by);
CREATE INDEX IF NOT EXISTS trips_share_token_idx ON trips(share_token);

-- ── Members ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trip_members (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id              UUID REFERENCES trips(id) ON DELETE CASCADE,
  user_id              UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email        TEXT,
  display_name         TEXT,
  avatar_color         TEXT DEFAULT '#3B82F6',
  role                 TEXT DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  contribution_cents   INTEGER DEFAULT 0,
  contribution_status  TEXT DEFAULT 'pending' CHECK (contribution_status IN ('pending','paid','committed')),
  joined_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (trip_id, user_id)
);

CREATE INDEX IF NOT EXISTS trip_members_trip_idx  ON trip_members(trip_id);
CREATE INDEX IF NOT EXISTS trip_members_user_idx  ON trip_members(user_id);

-- ── Experiences on a trip ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trip_experiences (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id               UUID REFERENCES trips(id) ON DELETE CASCADE,
  experience_id         UUID REFERENCES experiences(id) ON DELETE SET NULL,
  added_by              UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  day_number            INTEGER,
  time_slot             TEXT CHECK (time_slot IN ('morning','afternoon','evening','night')),
  start_time            TIME,
  status                TEXT DEFAULT 'suggested' CHECK (status IN ('suggested','approved','rejected','booked')),
  votes_up              INTEGER DEFAULT 0,
  votes_down            INTEGER DEFAULT 0,
  notes                 TEXT,
  custom_name           TEXT,
  custom_type           TEXT,
  custom_url            TEXT,
  estimated_cost_cents  INTEGER DEFAULT 0,
  booked_at             TIMESTAMPTZ,
  booking_id            UUID REFERENCES bookings(id) ON DELETE SET NULL,
  sort_order            INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trip_exp_trip_idx ON trip_experiences(trip_id);
CREATE INDEX IF NOT EXISTS trip_exp_exp_idx  ON trip_experiences(experience_id);

-- ── Votes ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trip_experience_votes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_experience_id  UUID REFERENCES trip_experiences(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote                INTEGER NOT NULL CHECK (vote IN (1,-1)),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (trip_experience_id, user_id)
);

CREATE INDEX IF NOT EXISTS vote_exp_idx  ON trip_experience_votes(trip_experience_id);
CREATE INDEX IF NOT EXISTS vote_user_idx ON trip_experience_votes(user_id);

-- ── Budget contributions ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trip_budget_contributions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id                  UUID REFERENCES trips(id) ON DELETE CASCADE,
  member_id                UUID REFERENCES trip_members(id) ON DELETE CASCADE,
  amount_cents             INTEGER NOT NULL,
  method                   TEXT DEFAULT 'pledge' CHECK (method IN ('pledge','stripe_payment','manual')),
  stripe_payment_intent_id TEXT,
  note                     TEXT,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ── Activity feed ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trip_activity (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id       UUID REFERENCES trips(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name  TEXT,
  activity_type TEXT NOT NULL,
  -- 'member_joined' | 'experience_added' | 'experience_voted' |
  -- 'experience_approved' | 'budget_contributed' | 'booking_made' |
  -- 'itinerary_generated' | 'dates_set' | 'note_added' | 'message'
  payload       JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activity_trip_idx ON trip_activity(trip_id);
CREATE INDEX IF NOT EXISTS activity_created_idx ON trip_activity(trip_id, created_at DESC);

-- ── updated_at trigger for trips ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_trip_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trips_updated_at ON trips;
CREATE TRIGGER trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_trip_timestamp();

-- ── Vote count denormalisation trigger ───────────────────────────────────────

CREATE OR REPLACE FUNCTION sync_trip_experience_votes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE trip_experiences
  SET
    votes_up   = (SELECT COUNT(*) FROM trip_experience_votes WHERE trip_experience_id = COALESCE(NEW.trip_experience_id, OLD.trip_experience_id) AND vote =  1),
    votes_down = (SELECT COUNT(*) FROM trip_experience_votes WHERE trip_experience_id = COALESCE(NEW.trip_experience_id, OLD.trip_experience_id) AND vote = -1)
  WHERE id = COALESCE(NEW.trip_experience_id, OLD.trip_experience_id);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_votes_on_insert ON trip_experience_votes;
CREATE TRIGGER sync_votes_on_insert
  AFTER INSERT OR UPDATE OR DELETE ON trip_experience_votes
  FOR EACH ROW EXECUTE FUNCTION sync_trip_experience_votes();

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE trips                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members               ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_experiences           ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_experience_votes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_budget_contributions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_activity              ENABLE ROW LEVEL SECURITY;

-- trips: readable by creator or members; writable by authenticated users
CREATE POLICY "trips_select" ON trips FOR SELECT USING (
  is_public = TRUE OR
  created_by = auth.uid() OR
  id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
);
CREATE POLICY "trips_insert" ON trips FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "trips_update" ON trips FOR UPDATE USING (
  created_by = auth.uid() OR
  id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid() AND role IN ('owner','admin'))
);
CREATE POLICY "trips_delete" ON trips FOR DELETE USING (created_by = auth.uid());

-- trip_members: members of the trip can read; authenticated can insert (join)
CREATE POLICY "trip_members_select" ON trip_members FOR SELECT USING (
  trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid() OR is_public = TRUE) OR
  user_id = auth.uid() OR
  trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
);
CREATE POLICY "trip_members_insert" ON trip_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "trip_members_update" ON trip_members FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "trip_members_delete" ON trip_members FOR DELETE USING (
  user_id = auth.uid() OR
  trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid() AND role IN ('owner','admin'))
);

-- trip_experiences: members of the trip can read and write
CREATE POLICY "trip_experiences_select" ON trip_experiences FOR SELECT USING (
  trip_id IN (
    SELECT id FROM trips WHERE created_by = auth.uid() OR is_public = TRUE
    UNION
    SELECT trip_id FROM trip_members WHERE user_id = auth.uid()
  )
);
CREATE POLICY "trip_experiences_insert" ON trip_experiences FOR INSERT WITH CHECK (
  trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
  OR trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
);
CREATE POLICY "trip_experiences_update" ON trip_experiences FOR UPDATE USING (
  trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
  OR trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
);
CREATE POLICY "trip_experiences_delete" ON trip_experiences FOR DELETE USING (
  added_by = auth.uid() OR
  trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid() AND role IN ('owner','admin'))
);

-- votes: member can vote once per experience
CREATE POLICY "votes_select" ON trip_experience_votes FOR SELECT USING (
  trip_experience_id IN (
    SELECT id FROM trip_experiences WHERE trip_id IN (
      SELECT trip_id FROM trip_members WHERE user_id = auth.uid()
      UNION SELECT id FROM trips WHERE created_by = auth.uid()
    )
  )
);
CREATE POLICY "votes_insert" ON trip_experience_votes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "votes_update" ON trip_experience_votes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "votes_delete" ON trip_experience_votes FOR DELETE USING (user_id = auth.uid());

-- budget contributions
CREATE POLICY "budget_select" ON trip_budget_contributions FOR SELECT USING (
  trip_id IN (SELECT trip_id FROM trip_members WHERE user_id = auth.uid())
  OR trip_id IN (SELECT id FROM trips WHERE created_by = auth.uid())
);
CREATE POLICY "budget_insert" ON trip_budget_contributions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- activity feed
CREATE POLICY "activity_select" ON trip_activity FOR SELECT USING (
  trip_id IN (
    SELECT id FROM trips WHERE created_by = auth.uid() OR is_public = TRUE
    UNION SELECT trip_id FROM trip_members WHERE user_id = auth.uid()
  )
);
CREATE POLICY "activity_insert" ON trip_activity FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── Enable Realtime on collaborative tables ───────────────────────────────────
-- Run these manually in Supabase dashboard → Database → Replication, or:
-- ALTER PUBLICATION supabase_realtime ADD TABLE trip_experiences;
-- ALTER PUBLICATION supabase_realtime ADD TABLE trip_activity;
-- ALTER PUBLICATION supabase_realtime ADD TABLE trip_members;
-- ALTER PUBLICATION supabase_realtime ADD TABLE trips;
