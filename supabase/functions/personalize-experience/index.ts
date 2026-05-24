import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

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

export function buildPersonalizePrompt(experience: Record<string, unknown>, answers: Record<string, unknown>): string {
  const interests = Array.isArray(answers.interests)
    ? (answers.interests as string[]).map((i) => INTEREST_LABELS[i] ?? i).join(", ")
    : "general sightseeing";

  const budget   = BUDGET_LABELS[(answers.budget as string) ?? "mid"] ?? "mid-range";
  const traveler = TRAVELER_LABELS[(answers.traveler as string) ?? "solo"] ?? "traveler";
  const extras   = answers.extras ? ` Additional context: ${answers.extras}.` : "";

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
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  let body: { experience?: Record<string, unknown>; answers?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const { experience, answers } = body;
  if (!experience?.id || !answers) {
    return new Response(JSON.stringify({ error: "experience and answers are required" }), {
      status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }), {
      status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
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
    const err = await anthropicRes.text();
    console.error("Anthropic error:", err);
    return new Response(JSON.stringify({ error: "AI generation failed" }), {
      status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const result = await anthropicRes.json();
  const blurb  = (result.content?.[0]?.text ?? "").trim();

  return new Response(JSON.stringify({ blurb }), {
    status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});
