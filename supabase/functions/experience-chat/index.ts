import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const SUPABASE_URL      = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY       = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY          = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

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

function json(body: unknown, status = 200, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// Truncate and neutralize DB-sourced text before embedding in system prompts.
// Prevents an operator or DB admin from injecting LLM control sequences.
function sanitizeDbField(text: unknown, maxLen = 800): string {
  if (typeof text !== "string" || !text) return "";
  return text
    .slice(0, maxLen)
    .replace(/[<>]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/={3,}/g, "---")
    .replace(/ignore.{0,30}(previous|above|instructions?)/gi, "")
    .replace(/\[INST\]|\[\/INST\]|<\|.*?\|>/g, "")  // LLM control tokens
    .trim();
}

// Sanitize user message content — shorter limit, stricter
function sanitizeUserMessage(text: unknown): string {
  if (typeof text !== "string") return "";
  return text
    .slice(0, 600)
    .replace(/\[INST\]|\[\/INST\]|<\|.*?\|>/g, "")
    .trim();
}

function buildSystemPrompt(exp: Record<string, unknown>): string {
  const price = Number(exp.price_per_person) > 0
    ? `$${exp.price_per_person} per person`
    : "Free";

  const included = Array.isArray(exp.what_is_included) && exp.what_is_included.length > 0
    ? `\nWhat's included: ${(exp.what_is_included as string[]).map(s => sanitizeDbField(s, 100)).join(", ")}`
    : "";

  const faq = exp.faq_text
    ? `\n\nFrequently asked questions from the operator:\n${sanitizeDbField(exp.faq_text, 1000)}`
    : "";

  const tags = Array.isArray(exp.tags) && exp.tags.length > 0
    ? `\nHighlights: ${(exp.tags as string[]).map(s => sanitizeDbField(s, 50)).join(", ")}`
    : "";

  const hours = exp.hours ? `\nHours: ${JSON.stringify(exp.hours)}` : "";
  const tips  = exp.tips  ? `\nLocal tips: ${sanitizeDbField(exp.tips, 400)}` : "";

  return `You are the friendly AI concierge for a travel experience listing on Vtopia, a platform for tourists visiting ${sanitizeDbField(exp.city, 50)} for the 2026 FIFA World Cup.

You help visitors understand everything about this specific experience. Answer questions helpfully, concisely, and warmly. Never make up information — only use what is provided below. If something isn't in the listing, say you don't have that detail and suggest contacting the operator directly.

=== EXPERIENCE DETAILS ===
Name: ${sanitizeDbField(exp.title, 100)}
City: ${sanitizeDbField(exp.city, 50)}
Category: ${sanitizeDbField(exp.category, 50)}
Price: ${price}
Duration: ${sanitizeDbField(exp.duration_label, 50) || "Not specified"}
Max group size: ${exp.max_guests || "Not specified"}${tags}
Description: ${sanitizeDbField(exp.description, 500) || "No description provided."}${included}${tips}${hours}${faq}
Cancellation policy: ${sanitizeDbField(exp.cancellation_policy, 200) || "Contact operator for details."}
=========================

Keep answers under 100 words. Use a friendly, helpful tone. If asked about booking, direct the user to the booking options on the page.`;
}

serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  // Basic abuse prevention — require the anon key as the apikey header
  const apikey = req.headers.get("apikey");
  if (!ANON_KEY || apikey !== ANON_KEY) {
    return json({ error: "Unauthorized" }, 401, cors);
  }

  let experience_id: string;
  let messages: Array<{ role: string; content: string }>;

  try {
    ({ experience_id, messages } = await req.json());
  } catch {
    return json({ error: "Invalid JSON" }, 400, cors);
  }

  if (!experience_id || !Array.isArray(messages) || messages.length === 0) {
    return json({ error: "experience_id and messages are required" }, 400, cors);
  }

  // Validate experience_id is a UUID to prevent injection via DB query
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(experience_id)) {
    return json({ error: "Invalid experience_id" }, 400, cors);
  }

  // Cap conversation to last 8 turns (16 messages) to keep context bounded
  // Sanitize each user message to prevent prompt injection via conversation history
  const trimmedMessages = messages.slice(-16).map(m => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.role === "user" ? sanitizeUserMessage(m.content) : String(m.content).slice(0, 800),
  }));

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
    return json({ error: "Experience not found" }, 404, cors);
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
    console.error("Anthropic error:", anthropicRes.status);
    return json({ error: "AI service unavailable" }, 502, cors);
  }

  const result = await anthropicRes.json();
  const content: string = result?.content?.[0]?.text ?? "";

  return json({ content }, 200, cors);
});
