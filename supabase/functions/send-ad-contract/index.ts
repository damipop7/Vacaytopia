import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_KEY       = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_KEY        = Deno.env.get("RESEND_API_KEY") ?? "";

const ALLOWED_ORIGINS = new Set([
  "https://www.vtopia.world",
  "https://vtopia.world",
  "http://localhost:5173",
  "http://localhost:4173",
]);

function getCorsHeaders(req: Request) {
  const origin  = req.headers.get("Origin") ?? "";
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : "https://www.vtopia.world";
  return {
    "Access-Control-Allow-Origin":  allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  };
}

function json(body: unknown, status = 200, cors: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

const TIER_LABELS: Record<string, string> = {
  starter:  "Starter ($299/mo)",
  featured: "Featured ($599/mo)",
  premium:  "Premium ($999/mo)",
};

// Converts plain-text contract into readable HTML for email delivery
function contractToHtml(text: string, businessName: string, tierLabel: string): string {
  // Escape HTML entities
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Turn section headers (lines like "1. Purpose") into bold headings
  const withHeadings = escaped.replace(
    /^(\d+\.\s+[A-Z][A-Z &']+)$/gm,
    '<h3 style="margin:24px 0 8px;font-size:16px;color:#0D1B3E;">$1</h3>',
  );

  // Turn "SIGNATURES" and "AD PLACEMENT AGREEMENT" into big headings
  const withBigHeadings = withHeadings
    .replace(
      /^(AD PLACEMENT AGREEMENT)$/gm,
      '<h1 style="font-size:26px;font-weight:700;color:#0D1B3E;margin-bottom:24px;">$1</h1>',
    )
    .replace(
      /^(SIGNATURES)$/gm,
      '<h2 style="font-size:20px;font-weight:700;color:#0D1B3E;margin:32px 0 16px;border-top:2px solid #034694;padding-top:24px;">$1</h2>',
    );

  // Blank lines → paragraph breaks
  const withParagraphs = withBigHeadings
    .split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 12px;line-height:1.6;">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="680" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header bar -->
        <tr>
          <td style="background:#034694;padding:28px 40px;">
            <p style="margin:0;color:#F5A623;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">vtopia.world</p>
            <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;">Ad Placement Proposal — ${tierLabel}</h1>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:32px 40px 0;">
            <p style="margin:0 0 16px;font-size:15px;color:#0D1B3E;line-height:1.6;">
              Dear <strong>${businessName}</strong> team,
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;">
              Thank you for your interest in advertising with Vtopia. Please review the Ad Placement Agreement below.
              Once you're ready to proceed, simply reply to this email confirming your acceptance, and we'll send over
              a countersigned copy and next steps for payment and creative materials.
            </p>
            <p style="margin:0 0 32px;font-size:14px;color:#374151;line-height:1.6;">
              Questions? Reply to this email or reach us at <a href="mailto:hello@vtopia.world" style="color:#034694;">hello@vtopia.world</a>.
            </p>

            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 32px;">
          </td>
        </tr>

        <!-- Contract body -->
        <tr>
          <td style="padding:0 40px;font-size:14px;color:#1f2937;">
            ${withParagraphs}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:32px 40px;border-top:1px solid #e5e7eb;margin-top:32px;">
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
              Vtopia Inc. · Kansas City, Missouri · <a href="https://vtopia.world" style="color:#034694;">vtopia.world</a><br>
              This is a legally binding agreement. If you did not expect this email, please contact us at
              <a href="mailto:hello@vtopia.world" style="color:#034694;">hello@vtopia.world</a>.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Main handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST")   return json({ error: "Method not allowed" }, 405, cors);

  // Auth — admin only
  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!jwt) return json({ error: "Unauthorized" }, 401, cors);

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401, cors);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return json({ error: "Forbidden" }, 403, cors);

  // Parse body
  const body = await req.json().catch(() => null);
  const { contract_id } = body ?? {};
  if (!contract_id) return json({ error: "contract_id is required" }, 400, cors);

  // Fetch contract
  const { data: contract, error: cErr } = await admin
    .from("ad_contracts")
    .select("*, experiences(title, category)")
    .eq("id", contract_id)
    .single();

  if (cErr || !contract) return json({ error: "Contract not found" }, 404, cors);
  if (!contract.contract_text) return json({ error: "Contract has no generated text — generate it first" }, 400, cors);

  if (!RESEND_KEY) return json({ error: "Email delivery not configured" }, 503, cors);

  const tierLabel = TIER_LABELS[contract.contract_tier] ?? contract.contract_tier;
  const html      = contractToHtml(contract.contract_text, contract.business_name, tierLabel);

  const resendRes = await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from:    "Vtopia Partnerships <hello@vtopia.world>",
      to:      [contract.contact_email],
      subject: `Ad Placement Proposal for ${contract.business_name} — vtopia.world (${tierLabel})`,
      html,
      reply_to: "hello@vtopia.world",
    }),
  });

  if (!resendRes.ok) {
    const err = await resendRes.text();
    console.error("Resend error:", err);
    return json({ error: "Email delivery failed" }, 502, cors);
  }

  // Update status → sent
  await admin
    .from("ad_contracts")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", contract_id);

  return json({ ok: true, sentTo: contract.contact_email }, 200, cors);
});
