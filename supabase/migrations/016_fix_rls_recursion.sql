-- ── Fix: infinite recursion in group-travel RLS policies ─────────────────────
--
-- Problem: trips_select queries trip_members, and trip_members_select queries
-- trips in return, causing PostgreSQL to throw "infinite recursion detected
-- in policy for relation trips/trip_members".
--
-- Fix: SECURITY DEFINER helper functions bypass RLS when checking membership
-- and ownership, so no cross-table policy cycle can form.

-- ── Helper functions (SECURITY DEFINER = bypass RLS) ─────────────────────────

CREATE OR REPLACE FUNCTION is_trip_member(check_trip_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_id = check_trip_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_trip_owner(check_trip_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM trips
    WHERE id = check_trip_id AND created_by = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_trip_admin(check_trip_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_id = check_trip_id AND user_id = auth.uid() AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION is_public_trip(check_trip_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM trips WHERE id = check_trip_id AND is_public = TRUE);
$$;

-- ── Recreate policies using helpers instead of cross-table subqueries ─────────

-- trips
DROP POLICY IF EXISTS "trips_select" ON trips;
CREATE POLICY "trips_select" ON trips FOR SELECT USING (
  is_public = TRUE OR
  created_by = auth.uid() OR
  is_trip_member(id)
);

-- trip_members
DROP POLICY IF EXISTS "trip_members_select" ON trip_members;
CREATE POLICY "trip_members_select" ON trip_members FOR SELECT USING (
  user_id = auth.uid() OR
  is_trip_member(trip_id) OR
  is_trip_owner(trip_id)
);

-- trip_experiences
DROP POLICY IF EXISTS "trip_experiences_select" ON trip_experiences;
CREATE POLICY "trip_experiences_select" ON trip_experiences FOR SELECT USING (
  is_trip_member(trip_id) OR is_trip_owner(trip_id)
);

DROP POLICY IF EXISTS "trip_experiences_insert" ON trip_experiences;
CREATE POLICY "trip_experiences_insert" ON trip_experiences FOR INSERT WITH CHECK (
  is_trip_member(trip_id) OR is_trip_owner(trip_id)
);

DROP POLICY IF EXISTS "trip_experiences_update" ON trip_experiences;
CREATE POLICY "trip_experiences_update" ON trip_experiences FOR UPDATE USING (
  is_trip_member(trip_id) OR is_trip_owner(trip_id)
);

DROP POLICY IF EXISTS "trip_experiences_delete" ON trip_experiences;
CREATE POLICY "trip_experiences_delete" ON trip_experiences FOR DELETE USING (
  added_by = auth.uid() OR is_trip_admin(trip_id)
);

-- votes
DROP POLICY IF EXISTS "votes_select" ON trip_experience_votes;
CREATE POLICY "votes_select" ON trip_experience_votes FOR SELECT USING (
  user_id = auth.uid() OR
  trip_experience_id IN (
    SELECT id FROM trip_experiences
    WHERE is_trip_member(trip_id) OR is_trip_owner(trip_id)
  )
);

-- budget contributions
DROP POLICY IF EXISTS "budget_select" ON trip_budget_contributions;
CREATE POLICY "budget_select" ON trip_budget_contributions FOR SELECT USING (
  is_trip_member(trip_id) OR is_trip_owner(trip_id)
);

-- activity feed
DROP POLICY IF EXISTS "activity_select" ON trip_activity;
CREATE POLICY "activity_select" ON trip_activity FOR SELECT USING (
  is_public_trip(trip_id) OR is_trip_member(trip_id) OR is_trip_owner(trip_id)
);
