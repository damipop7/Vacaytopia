-- ── Fix: users who signed up during broken trigger period are invisible ────────
--
-- Root cause: before migration 020 added the profiles INSERT policy, the
-- on_auth_user_created trigger was blocked by RLS. Affected users landed in
-- auth.users but got no profiles row. admin_get_users() used an INNER JOIN so
-- those accounts were completely hidden from the admin dashboard.
--
-- Fix 1: Backfill a profiles row for every auth.users that has none.
-- Fix 2: Switch admin_get_users() to LEFT JOIN so future orphans are visible.
--
-- Apply in Supabase Dashboard → SQL Editor.

-- ── 1. Backfill missing profiles ──────────────────────────────────────────────
INSERT INTO public.profiles (id, email, first_name, last_name)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'first_name',
  au.raw_user_meta_data->>'last_name'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
);

-- ── 2. Rebuild admin_get_users with LEFT JOIN ─────────────────────────────────
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
  provider            text,
  email_confirmed     boolean,
  last_sign_in_at     timestamptz,
  created_at          timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied — admin only';
  END IF;

  RETURN QUERY
  SELECT
    au.id,
    COALESCE(p.email, au.email)                           AS email,
    p.first_name,
    p.last_name,
    COALESCE(p.role, 'user')                              AS role,
    COALESCE(p.is_verified, false)                        AS is_verified,
    p.home_city,
    p.avatar_url,
    COALESCE(
      au.raw_app_meta_data->>'provider',
      au.raw_user_meta_data->>'iss',
      'email'
    )                                                     AS provider,
    (au.email_confirmed_at IS NOT NULL)                   AS email_confirmed,
    au.last_sign_in_at,
    COALESCE(p.created_at, au.created_at)                 AS created_at
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  ORDER BY COALESCE(p.created_at, au.created_at) DESC
  LIMIT 500;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_users() TO authenticated;
