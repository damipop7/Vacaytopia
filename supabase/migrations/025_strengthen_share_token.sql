-- Increase share_token entropy from 48 bits (6 bytes) to 256 bits (32 bytes).
-- 48-bit tokens (12 hex chars) are brute-forceable given enough requests.
-- 32-byte tokens (64 hex chars) are computationally infeasible to enumerate.
--
-- Existing tokens are left as-is (already issued). New trips get the stronger default.
-- The UNIQUE constraint and index remain — 64-char tokens are still unique.

ALTER TABLE trips
  ALTER COLUMN share_token SET DEFAULT encode(gen_random_bytes(32), 'hex');
