-- ── Fix: "database error saving new user" on email signup ────────────────────
--
-- Root cause: profiles has RLS enabled but no INSERT policy.
-- The on_auth_user_created trigger calls handle_new_user() which tries to
-- INSERT into profiles. In newer Supabase versions the trigger fires via
-- supabase_auth_admin (not the postgres superuser), so SECURITY DEFINER
-- alone does not bypass RLS — the INSERT is blocked and signup fails.
--
-- Fix 1: Add the missing INSERT policy so any service/trigger can create a
--         profile row during signup.
-- Fix 2: Recreate handle_new_user with SET search_path = public (Supabase
--         best-practice for SECURITY DEFINER functions).
--
-- Apply in Supabase Dashboard → SQL Editor.

-- ── 1. INSERT policy on profiles ─────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_insert_on_signup" ON public.profiles;

CREATE POLICY "profiles_insert_on_signup"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);

-- ── 2. Recreate trigger function with explicit search_path ────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$;
