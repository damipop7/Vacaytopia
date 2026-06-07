-- ── Admin: full user view with sign-up method and last sign-in ───────────────
--
-- Problem: public.profiles has no provider (email vs Google) or last_sign_in_at.
-- That data lives in auth.users which the anon key cannot read.
--
-- Fix: SECURITY DEFINER RPC runs as postgres (bypasses auth schema restriction)
-- but first verifies the caller is an admin via their profile role.
--
-- Apply in Supabase Dashboard → SQL Editor.

CREATE OR REPLACE FUNCTION public.admin_get_users()
RETURNS TABLE (
  id                  uuid,
  email               text,
  first_name          text,
  last_name           text,
  role                text,
  is_verified         boolean,
  home_city           text,
  avatar_url          text,
  provider            text,      -- 'email' | 'google' | 'github' …
  email_confirmed     boolean,
  last_sign_in_at     timestamptz,
  created_at          timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins may call this
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied — admin only';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.role,
    p.is_verified,
    p.home_city,
    p.avatar_url,
    COALESCE(
      au.raw_app_meta_data->>'provider',
      au.raw_user_meta_data->>'iss',
      'email'
    )                                         AS provider,
    (au.email_confirmed_at IS NOT NULL)       AS email_confirmed,
    au.last_sign_in_at,
    p.created_at
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  ORDER BY p.created_at DESC
  LIMIT 500;
END;
$$;

-- Only authenticated users can call it (admin check is enforced inside the function)
GRANT EXECUTE ON FUNCTION public.admin_get_users() TO authenticated;
