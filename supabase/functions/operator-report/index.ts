import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")              ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")         ?? "";
const SERVICE_KEY       = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_KEY        = Deno.env.get("RESEND_API_KEY");

const ALLOWED_ORIGINS = new Set([
  "https://www.vtopia.world",
  "https://vtopia.world",
  "http://localhost:5173",
  "http://localhost:4173",
]);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : "https://www.vtopia.world";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function fmtMonth(d = new Date()) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // ── Auth: verify caller is an admin ───────────────────────────────────
  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!jwt) return json({ error: "Unauthorized" }, 401);

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return json({ error: "Forbidden" }, 403);

  // ── Parse body ────────────────────────────────────────────────────────
  const { submissionId } = await req.json();
  if (!submissionId) return json({ error: "submissionId is required" }, 400);

  // ── Load submission ───────────────────────────────────────────────────
  const { data: sub, error: subErr } = await admin
    .from("operator_submissions")
    .select("*")
    .eq("id", submissionId)
    .single();

  if (subErr || !sub) return json({ error: "Submission not found" }, 404);
  if (!sub.operator_email) return json({ error: "No email on submission" }, 400);

  // ── Compile stats: find matching experience by title ──────────────────
  const { data: exps } = await admin
    .from("experiences")
    .select("id, title, rating, review_count")
    .ilike("title", `%${sub.title}%`)
    .eq("city", sub.city ?? "Kansas City");

  const exp = exps?.[0] ?? null;

  // Booking count for this experience (past 30 days)
  let bookingCount  = 0;
  let totalRevenue  = 0;
  if (exp) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: bookings } = await admin
      .from("bookings")
      .select("total_amount, status")
      .eq("experience_id", exp.id)
      .in("status", ["confirmed", "completed"])
      .gte("created_at", since);

    if (bookings) {
      bookingCount = bookings.length;
      totalRevenue = bookings.reduce((s, b) => s + (Number(b.total_amount) || 0), 0);
    }
  }

  const monthLabel  = fmtMonth();
  const ratingStr   = exp?.rating ? `${exp.rating} ★` : "No ratings yet";
  const reviewCount = exp?.review_count ?? 0;
  const daysLive    = sub.reviewed_at
    ? Math.floor((Date.now() - new Date(sub.reviewed_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // ── Build email HTML ──────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, sans-serif; color: #1a1a1a; background: #f9f9f9; margin: 0; padding: 0; }
  .wrap { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
  .header { background: #0346a0; padding: 28px 32px; }
  .header h1 { color: #fff; margin: 0; font-size: 20px; }
  .header p  { color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 13px; }
  .body { padding: 28px 32px; }
  .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 24px 0; }
  .stat  { background: #f4f8ff; border: 1px solid #dde8ff; border-radius: 8px; padding: 16px; text-align: center; }
  .stat .val { font-size: 28px; font-weight: 800; color: #0346a0; }
  .stat .lbl { font-size: 11px; color: #888; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.05em; }
  .tip { background: #fff8e6; border: 1px solid #f5d062; border-radius: 8px; padding: 14px 18px; font-size: 13px; color: #5c4200; margin-top: 20px; }
  .footer { border-top: 1px solid #eee; padding: 20px 32px; font-size: 12px; color: #aaa; }
</style></head>
<body>
<div class="wrap">
  <div class="header">
    <h1>Your Vtopia Monthly Report</h1>
    <p>${escHtml(monthLabel)} · ${escHtml(sub.title)}</p>
  </div>
  <div class="body">
    <p>Hi ${escHtml(sub.operator_name)},</p>
    <p>Here's how your listing <strong>"${escHtml(sub.title)}"</strong> performed this month on Vtopia.</p>

    <div class="stats">
      <div class="stat">
        <div class="val">${bookingCount}</div>
        <div class="lbl">Bookings (30d)</div>
      </div>
      <div class="stat">
        <div class="val">${totalRevenue > 0 ? `$${Math.round(totalRevenue).toLocaleString()}` : "—"}</div>
        <div class="lbl">Revenue (30d)</div>
      </div>
      <div class="stat">
        <div class="val">${ratingStr}</div>
        <div class="lbl">Avg rating</div>
      </div>
      <div class="stat">
        <div class="val">${reviewCount}</div>
        <div class="lbl">Total reviews</div>
      </div>
    </div>

    ${daysLive !== null ? `<p style="font-size:13px; color:#666;">Your listing has been live for <strong>${daysLive} days</strong>.</p>` : ""}

    <div class="tip">
      💡 <strong>Tip:</strong> Listings with a detailed description and FAQ answers get up to 3&times; more engagement. ${!sub.faq_text ? "Log into Vtopia to add FAQ answers to your listing." : "Your FAQ section looks great — keep it updated!"}
    </div>

    <p style="margin-top:24px; font-size:13px; color:#666;">Questions? Reply to this email or reach us at <a href="mailto:support@vtopia.world">support@vtopia.world</a>.</p>
  </div>
  <div class="footer">
    You're receiving this because your business is listed on Vtopia. &nbsp;·&nbsp;
    <a href="https://www.vtopia.world" style="color:#0346a0;">vtopia.world</a>
  </div>
</div>
</body>
</html>`;

  // ── Send via Resend ───────────────────────────────────────────────────
  if (!RESEND_KEY) {
    return json({
      ok: true,
      dryRun: true,
      stats: { bookingCount, totalRevenue, ratingStr, reviewCount },
    });
  }

  const resendRes = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from:    "Vtopia <hello@vtopia.world>",
      to:      sub.operator_email,
      subject: `Your Vtopia monthly report — ${monthLabel}`,
      html,
    }),
  });

  if (!resendRes.ok) {
    const err = await resendRes.text();
    console.error("Resend error:", err);
    return json({ error: "Email delivery failed" }, 502);
  }

  return json({ ok: true, sentTo: sub.operator_email });
});
