import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const SUPABASE_URL      = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY       = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Restrict to known origins — wildcard CORS is too permissive for an AI cost endpoint
const ALLOWED_ORIGINS = new Set([
  "https://www.vtopia.world",
  "https://vtopia.world",
  "http://localhost:5173",
  "http://localhost:4173",
]);

function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : "https://www.vtopia.world";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  };
}

const BUDGET_LABELS: Record<string, string> = {
  budget: "budget-conscious",
  mid: "mid-range",
  premium: "premium",
};

const TRAVELER_LABELS: Record<string, string> = {
  solo: "solo traveler",
  couple: "couple",
  friends: "group of friends",
  family: "family with kids",
};

const INTEREST_LABELS: Record<string, string> = {
  food: "food & dining",
  outdoors: "outdoor activities",
  nightlife: "nightlife",
  arts: "arts & culture",
  sports: "sports",
  wellness: "wellness",
  shopping: "shopping",
  music: "live music",
};

// Strip characters that could break prompt structure or inject instructions
function sanitizeForPrompt(text: unknown, maxLen = 300): string {
  if (typeof text !== "string") return "";
  return text
    .slice(0, maxLen)
    .replace(/[<>]/g, "")                // remove HTML tags
    .replace(/\n{3,}/g, "\n\n")          // collapse excessive newlines
    .replace(/={3,}/g, "")               // remove horizontal rules used as section dividers
    .replace(/ignore.{0,30}(previous|above|instruction)/gi, "") // obvious injection attempts
    .trim();
}

export function buildPersonalizePrompt(experience: Record<string, unknown>, answers: Record<string, unknown>): string {
  const interests = Array.isArray(answers.interests)
    ? (answers.interests as string[]).map((i) => INTEREST_LABELS[i] ?? i).join(", ")
    : "general sightseeing";

  const budget   = BUDGET_LABELS[(answers.budget as string) ?? "mid"] ?? "mid-range";
  const traveler = TRAVELER_LABELS[(answers.traveler as string) ?? "solo"] ?? "traveler";
  // Sanitize free-text extras — limit length and strip injection patterns
  const extraRaw = sanitizeForPrompt(answers.extras, 200);
  const extras   = extraRaw ? ` Additional context: ${extraRaw}.` : "";

  const price = (experience.price_per_person as number) > 0
    ? `$${experience.price_per_person} per person`
    : "free";

  return `You are a Kansas City travel expert. Write a 2-sentence personalized recommendation for this experience tailored specifically to this traveler. Be warm, specific, and mention ONE concrete detail about why this fits their trip. Do not repeat the experience title or category. Output only the 2 sentences — no intro, no labels, no markdown.

Experience: ${experience.title}
Category: ${experience.category}
Price: ${price}
Description: ${experience.description ?? "A great KC experience."}

Traveler profile: ${traveler} with a ${budget} budget, interested in ${interests}.${extras}`;
}

serve(async (req) => {
  const cors = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Require a valid user JWT — rejects anon key and unauthenticated requests
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return new Response(JSON.stringify({ error: "Sign in to use personalized recommendations" }), {
      status: 401, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Sign in to use personalized recommendations" }), {
      status: 401, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  let body: { experience?: Record<string, unknown>; answers?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const { experience, answers } = body;
  if (!experience?.id || !answers) {
    return new Response(JSON.stringify({ error: "experience and answers are required" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "Service unavailable" }), {
      status: 503, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const prompt = buildPersonalizePrompt(experience, answers);

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 180,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!anthropicRes.ok) {
    console.error("Anthropic error:", anthropicRes.status);
    return new Response(JSON.stringify({ error: "AI generation failed" }), {
      status: 502, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const result = await anthropicRes.json();
  const blurb  = (result.content?.[0]?.text ?? "").trim();

  return new Response(JSON.stringify({ blurb }), {
    status: 200, headers: { ...cors, "Content-Type": "application/json" },
  });
});
