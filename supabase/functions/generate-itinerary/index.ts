import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const BUDGET_HOTEL_TIER: Record<string, string> = {
  budget: "budget-friendly hostels and guesthouses",
  mid: "3-4 star hotels and boutique stays",
  premium: "boutique hotels and luxury properties",
};

const BUDGET_LABELS: Record<string, string> = {
  budget: "$100-200/day",
  mid: "$200-350/day",
  premium: "$350-500/day",
};

const CITY_LABELS: Record<string, string> = {
  nyc: "New York City",
  miami: "Miami",
  orlando: "Orlando",
  "las-vegas": "Las Vegas",
  "new-orleans": "New Orleans",
  austin: "Austin",
  "kansas-city": "Kansas City",
};

function buildPrompt(answers: any): string {
  const city = CITY_LABELS[answers.city] || answers.city;
  const nights = Math.round(
    (new Date(answers.endDate).getTime() - new Date(answers.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const days = nights + 1;
  const extras = answers.extras ? `\nExtra context: ${answers.extras}` : "";

  return `You are a travel concierge. Create a ${days}-day itinerary for a ${answers.traveler} trip to ${city}. Budget: ${BUDGET_LABELS[answers.budget]} per person/day. Interests: ${answers.interests.join(", ")}. Hotel tier: ${BUDGET_HOTEL_TIER[answers.budget]}.${extras}

Keep all descriptions to 1-2 sentences max. Respond ONLY with this JSON structure, no markdown:

{"headline":"6-8 word tagline","overview":"2 sentence overview","days":[{"day":1,"theme":"Day theme","morning":{"title":"","description":"","tip":"","cost":""},"afternoon":{"title":"","description":"","tip":"","cost":""},"evening":{"title":"","description":"","tip":"","cost":""},"lunch":"Restaurant and why","dinner":"Restaurant and why","dailyTotal":"Est total"}],"hotelRecommendations":[{"name":"","reason":"","priceRange":"$/$$/$$$"}],"packingTips":["tip1","tip2","tip3"],"budgetBreakdown":{"accommodation":"","food":"","activities":"","transport":""}}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const { answers } = await req.json();
    if (!answers) {
      return new Response(JSON.stringify({ error: "Missing answers" }), { status: 400 });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 8000,
        system: "You are a travel concierge. Respond ONLY with valid JSON. No markdown, no explanation.",
        messages: [{ role: "user", content: buildPrompt(answers) }],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Anthropic error ${anthropicRes.status}`);
    }

    const data = await anthropicRes.json();
    const text = data.content?.[0]?.text || "";
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const itinerary = JSON.parse(cleaned);

    return new Response(JSON.stringify({ itinerary }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("generate-itinerary error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
