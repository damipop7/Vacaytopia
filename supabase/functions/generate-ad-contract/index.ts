import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY   = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const SUPABASE_URL        = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY   = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_KEY         = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

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

// ── Tier definitions ────────────────────────────────────────────────────────
const TIERS = {
  starter: {
    label:         "Starter",
    monthly_value: 299,
    campaign_days: 30,
    fee_str:       "$299.00",
    location:      "vtopia.world — Experience Browse Page",
    section:       "Category Browse Page",
    position:      "Priority placement with 'Sponsored' badge — top of category feed",
    format:        "Enhanced listing card (300×250px sponsor badge, priority sort position)",
    deliverables:  `- "Sponsored" badge displayed on your listing card on vtopia.world
- Priority sort position at the top of your category page
- Up to 10,000 targeted impressions to World Cup 2026 visitors browsing Kansas City
- Monthly performance report (impressions, clicks, click-through rate)`,
  },
  featured: {
    label:         "Featured",
    monthly_value: 599,
    campaign_days: 60,
    fee_str:       "$599.00",
    location:      "vtopia.world — Homepage + Category Browse Page",
    section:       "Homepage 'Spotlight' section + Category top",
    position:      "Homepage spotlight callout + pinned #1 in category",
    format:        "Homepage spotlight card (600×300px) + Category pin badge",
    deliverables:  `- Featured spotlight card on the vtopia.world homepage visible to all visitors
- Pinned #1 position in your category with 'Featured' badge
- Up to 25,000 targeted impressions to World Cup 2026 visitors
- Bi-weekly performance report (impressions, clicks, bookings driven, click-through rate)
- Direct booking link prominently displayed`,
  },
  premium: {
    label:         "Premium",
    monthly_value: 999,
    campaign_days: 90,
    fee_str:       "$999.00",
    location:      "vtopia.world — Homepage hero + Category + Email newsletter + Social media",
    section:       "Homepage hero banner + Category top + Email newsletter + Instagram/LinkedIn post",
    position:      "Homepage hero rotation + Category #1 pin + Newsletter feature + Social mention",
    format:        "Full multi-channel placement package (hero banner, listing card, newsletter block, social graphic)",
    deliverables:  `- Homepage hero banner rotation (728×90px) seen by every visitor
- Pinned #1 position in category with 'Premium Partner' badge
- Featured mention in one Vtopia email newsletter blast (subscriber list)
- One dedicated social media post on Vtopia Instagram & LinkedIn
- Up to 60,000 targeted impressions across all channels
- Weekly performance reports (impressions, clicks, bookings driven, newsletter opens, social reach)
- Dedicated account contact for creative asset review`,
  },
} as const;

type Tier = keyof typeof TIERS;

// ── Contract template ────────────────────────────────────────────────────────
// Faithfully follows the 17-section Ad Placement Agreement provided by Vtopia.
function buildContractPrompt(
  exp: Record<string, unknown>,
  tier: Tier,
  contactName: string,
  contactEmail: string,
  businessName: string,
  startDate: string,
  endDate: string,
  materialsDeadline: string,
): string {
  const t = TIERS[tier];

  return `You are a professional contracts attorney drafting a completed Ad Placement Agreement for a Kansas City business to advertise on vtopia.world, a World Cup 2026 travel and experiences platform.

Fill in every blank in the template below with specific, professional, and legally precise language. Do NOT leave any blanks. Do NOT add commentary. Return ONLY the completed contract text, formatted with clean section headers and proper spacing.

Use these exact details:
- Agreement date: ${startDate}
- Advertiser business name: ${businessName}
- Advertiser contact: ${contactName} <${contactEmail}>
- Advertiser website: ${exp.external_url || exp.website || "N/A"}
- Business category: ${exp.category} — ${exp.title}
- Publisher name: Vtopia Inc.
- Publisher website: vtopia.world
- Publisher address: Kansas City, Missouri
- Ad tier: ${t.label} — ${t.fee_str}/month (flat monthly fee)
- Ad location: ${t.location}
- Page / section: ${t.section}
- Ad position: ${t.position}
- Ad format: ${t.format}
- Campaign start: ${startDate}
- Campaign end: ${endDate}
- Campaign length: ${t.campaign_days} days
- Materials deadline: ${materialsDeadline}
- Advertising fee: ${t.fee_str} per month (flat monthly fee)
- Payment due date: 5 business days before campaign start
- Payment method: ACH bank transfer or major credit card
- Performance reports: Monthly (and at end of campaign)
- Cancellation notice: 14 days written notice
- Early cancellation refund: Pro-rated refund for unused full weeks remaining
- Governing law: State of Missouri
- Deliverables included:
${t.deliverables}

Write a personalized opening paragraph (after the header and party details) that connects ${businessName}'s specific business — a ${exp.category} experience in Kansas City — to the World Cup 2026 opportunity on vtopia.world. Keep it professional and compelling, 2–3 sentences.

Here is the contract template to complete:

---

AD PLACEMENT AGREEMENT

This Ad Placement Agreement is entered into as of ${startDate}, by and between:

Advertiser: [FILL IN]
Address: [FILL IN]

and

Publisher / Website Owner: [FILL IN]
Address: [FILL IN]

The parties agree as follows:

[Write 2-3 sentence personalized opening about why this partnership makes sense for the World Cup 2026 season.]

1. Purpose
[Fill in purpose paragraph using the template language, adapted to the specific advertising channels agreed.]

2. Advertising Location
Publisher agrees to place Advertiser's ad in the following location:

Website / Platform: [FILL IN]
Page or Section: [FILL IN]
Ad Position: [FILL IN]
Ad Size / Format: [FILL IN]

[Add 1 sentence describing what the ad format will look like in practice.]

3. Term of Agreement
The advertising period shall begin on [FILL IN] and end on [FILL IN], unless extended by written agreement of the parties.

4. Advertising Materials
Advertiser shall provide Publisher with all advertising copy, images, logos, links, videos, tracking codes, and other required materials by [FILL IN].

Publisher may reject or request changes to any advertising material that is misleading, unlawful, offensive, technically defective, or inconsistent with Publisher's standards.

5. Payment
Advertiser agrees to pay Publisher as follows:

Advertising Fee: [FILL IN]
Payment Due Date: [FILL IN]
Payment Method: [FILL IN]

The fee is based on: Flat monthly fee

Late payments may result in suspension or removal of the advertisement.

6. Performance Reporting
Publisher shall provide Advertiser with reasonable performance information including impressions, clicks, click-through rate, and other agreed measurements.

Reports shall be provided:
Weekly: [YES/NO]
Monthly: [YES/NO]
At the end of the campaign: [YES/NO]

7. No Guaranteed Results
Publisher does not guarantee any specific number of clicks, sales, leads, customers, or revenue unless expressly stated in writing. Advertiser understands that advertising results may vary.

8. Compliance with Laws
Advertiser represents that all advertising materials comply with applicable laws and regulations, including laws relating to truth in advertising, intellectual property, privacy, endorsements, and consumer protection. Advertiser is responsible for the content of the advertisement and any claims made in the advertisement.

9. Intellectual Property
Advertiser grants Publisher a limited license to use Advertiser's name, logo, trademarks, images, and advertising materials solely for the purpose of displaying the advertisement during the term of this Agreement. Advertiser retains ownership of all advertising materials provided by Advertiser.

10. Removal of Advertisement
Publisher may remove the advertisement if:
1. Advertiser fails to pay on time;
2. The advertisement violates this Agreement;
3. The advertisement creates legal, technical, or reputational concerns;
4. The advertised product or service becomes unavailable;
5. Publisher reasonably determines that removal is necessary.

11. Cancellation
Either party may cancel this Agreement by providing [FILL IN] days' written notice.

If Advertiser cancels early, the following refund policy applies: [FILL IN]

If Publisher cancels without cause, Publisher shall refund any prepaid amount for advertising not yet delivered.

12. Indemnification
Advertiser agrees to indemnify and hold Publisher harmless from any claims, damages, losses, costs, or expenses arising out of the advertisement, the advertised product or service, or Advertiser's breach of this Agreement.

13. Limitation of Liability
Publisher shall not be liable for indirect, incidental, special, consequential, or lost-profit damages. Publisher's total liability under this Agreement shall not exceed the amount paid by Advertiser under this Agreement.

14. Independent Contractors
The parties are independent contractors. Nothing in this Agreement creates a partnership, joint venture, employment relationship, or agency relationship.

15. Confidentiality
Any non-public business, pricing, customer, technical, or marketing information exchanged by the parties shall be treated as confidential and not disclosed to third parties except as required by law.

16. Governing Law
This Agreement shall be governed by the laws of the State of [FILL IN].

17. Entire Agreement
This Agreement contains the entire understanding between the parties and replaces all prior discussions or agreements concerning the advertising placement. Any changes must be in writing and signed by both parties.

SIGNATURES

Advertiser
Name: ${contactName}
Title: ___________________________
Signature: ___________________________
Date: ___________________________

Publisher / Website Owner
Name: Oluwadamilola Popoola
Title: Founder & CEO, Vtopia Inc.
Signature: ___________________________
Date: ___________________________

---

Return ONLY the completed contract. No preamble, no commentary, no markdown fences.`;
}

// ── Date helpers ────────────────────────────────────────────────────────────
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function fmt(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
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
  const { data: profile } = await admin.from("profiles").select("role, id").eq("id", user.id).single();
  if (profile?.role !== "admin") return json({ error: "Forbidden" }, 403, cors);

  // Parse body
  const body = await req.json().catch(() => null);
  const { experience_id, contact_name, contact_email, business_name, tier } = body ?? {};

  if (!experience_id) return json({ error: "experience_id is required" }, 400, cors);
  if (!contact_email) return json({ error: "contact_email is required" }, 400, cors);
  if (!tier || !["starter", "featured", "premium"].includes(tier))
    return json({ error: "tier must be starter, featured, or premium" }, 400, cors);

  // Fetch experience
  const { data: exp, error: expErr } = await admin
    .from("experiences")
    .select("id, title, category, city, description, external_url, website, provider_email")
    .eq("id", experience_id)
    .single();

  if (expErr || !exp) return json({ error: "Experience not found" }, 404, cors);

  const t = TIERS[tier as Tier];
  const today           = new Date();
  const campaignStart   = addDays(today, 7);
  const campaignEnd     = addDays(campaignStart, t.campaign_days);
  const materialsDeadline = addDays(today, 5);

  const resolvedBusiness = business_name || exp.title;
  const resolvedContact  = contact_name  || "Business Owner";

  // Call Claude to generate the filled contract
  const prompt = buildContractPrompt(
    exp as Record<string, unknown>,
    tier as Tier,
    resolvedContact,
    contact_email,
    resolvedBusiness,
    fmt(campaignStart),
    fmt(campaignEnd),
    fmt(materialsDeadline),
  );

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type":    "application/json",
      "x-api-key":       ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages:   [{ role: "user", content: prompt }],
    }),
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `Anthropic error ${anthropicRes.status}`);
  }

  const aiBody       = await anthropicRes.json();
  const contractText = aiBody?.content?.[0]?.text ?? "";

  if (!contractText) return json({ error: "Contract generation failed — empty response" }, 502, cors);

  // Save to ad_contracts
  const { data: saved, error: saveErr } = await admin
    .from("ad_contracts")
    .insert({
      experience_id,
      business_name:  resolvedBusiness,
      contact_name:   resolvedContact,
      contact_email,
      contract_tier:  tier,
      monthly_value:  t.monthly_value,
      campaign_days:  t.campaign_days,
      contract_text:  contractText,
      status:         "draft",
      created_by:     profile.id,
    })
    .select()
    .single();

  if (saveErr) return json({ error: saveErr.message }, 500, cors);

  return json({ ok: true, contract: saved }, 200, cors);
});
