import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const SUPABASE_URL      = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY       = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY          = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildSystemPrompt(exp: Record<string, unknown>): string {
  const price = Number(exp.price_per_person) > 0
    ? `$${exp.price_per_person} per person`
    : "Free";

  const included = Array.isArray(exp.what_is_included) && exp.what_is_included.length > 0
    ? `\nWhat's included: ${(exp.what_is_included as string[]).join(", ")}`
    : "";

  const faq = exp.faq_text
    ? `\n\nFrequently asked questions from the operator:\n${exp.faq_text}`
    : "";

  const tags = Array.isArray(exp.tags) && exp.tags.length > 0
    ? `\nHighlights: ${(exp.tags as string[]).join(", ")}`
    : "";

  const hours = exp.hours ? `\nHours: ${JSON.stringify(exp.hours)}` : "";
  const tips  = exp.tips  ? `\nLocal tips: ${exp.tips}` : "";

  return `You are the friendly AI concierge for a travel experience listing on Vtopia, a platform for tourists visiting ${exp.city} for the 2026 FIFA World Cup.

You help visitors understand everything about this specific experience. Answer questions helpfully, concisely, and warmly. Never make up information — only use what is provided below. If something isn't in the listing, say you don't have that detail and suggest contacting the operator directly.

=== EXPERIENCE DETAILS ===
Name: ${exp.title}
City: ${exp.city}
Category: ${exp.category}
Price: ${price}
Duration: ${exp.duration_label || "Not specified"}
Max group size: ${exp.max_guests || "Not specified"}${tags}
Description: ${exp.description || "No description provided."}${included}${tips}${hours}${faq}
Cancellation policy: ${exp.cancellation_policy || "Contact operator for details."}
=========================

Keep answers under 100 words. Use a friendly, helpful tone. If asked about booking, direct the user to the booking options on the page.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Basic abuse prevention — require the anon key as the apikey header
  const apikey = req.headers.get("apikey");
  if (!ANON_KEY || apikey !== ANON_KEY) {
    return json({ error: "Unauthorized" }, 401);
  }

  let experience_id: string;
  let messages: Array<{ role: string; content: string }>;

  try {
    ({ experience_id, messages } = await req.json());
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!experience_id || !Array.isArray(messages) || messages.length === 0) {
    return json({ error: "experience_id and messages are required" }, 400);
  }

  // Cap conversation to last 8 turns (16 messages) to keep context bounded
  const trimmedMessages = messages.slice(-16);

  // Fetch experience from DB
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: exp, error: dbErr } = await admin
    .from("experiences")
    .select(
      "title, description, city, category, price_per_person, duration_label, max_guests, what_is_included, cancellation_policy, tips, faq_text, tags, hours, experience_type"
    )
    .eq("id", experience_id)
    .eq("is_active", true)
    .single();

  if (dbErr || !exp) {
    return json({ error: "Experience not found" }, 404);
  }

  const systemPrompt = buildSystemPrompt(exp as Record<string, unknown>);

  // Call Claude Haiku
  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key":         ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type":      "application/json",
    },
    body: JSON.stringify({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 350,
      system:     systemPrompt,
      messages:   trimmedMessages,
    }),
  });

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    console.error("Anthropic error:", errText);
    return json({ error: "AI service unavailable" }, 502);
  }

  const result = await anthropicRes.json();
  const content: string = result?.content?.[0]?.text ?? "";

  return json({ content });
});
