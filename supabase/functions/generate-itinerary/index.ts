import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

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

interface Experience {
  id: string;
  title: string;
  category: string;
  experience_type: string | null;
  price_per_person: number;
  price_tier: number | null;
  duration_label: string;
}

function buildPrompt(answers: any, experiences: Experience[]): string {
  const city = CITY_LABELS[answers.city] || answers.city;
  const nights = Math.round(
    (new Date(answers.endDate).getTime() - new Date(answers.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const days = nights + 1;
  const extras = answers.extras ? `\nExtra context: ${answers.extras}` : "";

  // New quiz fields (backwards-compatible: may be absent in old requests)
  const travelerGroup: string = answers.travelerGroup || "";
  const helpNeeded: string[] = Array.isArray(answers.helpNeeded) ? answers.helpNeeded : [];

  const groupLine = travelerGroup
    ? `\nGroup type: ${travelerGroup}`
    : "";

  const helpLine = helpNeeded.length > 0 && !helpNeeded.includes("none")
    ? `\nNeeds help with: ${helpNeeded.join(", ")}`
    : "";

  const helpInstructions = [
    helpNeeded.includes("transport")    && "- Include Uber/Lyft cost estimates and pickup tips for key locations.",
    helpNeeded.includes("hotels")       && "- Give detailed hotel recommendations: specific neighborhoods, proximity to attractions, and what makes each stand out for this group type.",
    helpNeeded.includes("restaurants")  && "- Flag which restaurants in the plan require advance reservations and how far ahead to book.",
    helpNeeded.includes("activities")   && "- Flag which activities need to be pre-booked, how far in advance, and where to book them.",
    helpNeeded.includes("flights")      && "- Add a brief note on the best airports to fly into and ideal arrival/departure timing for this destination.",
  ].filter(Boolean).join("\n");

  const groupInstructions = travelerGroup
    ? `- Tailor pace, activity intensity, and logistics to a ${travelerGroup} group.`
    : "";

  const personalizationSection = (helpInstructions || groupInstructions)
    ? `\n\nPersonalization instructions:\n${[groupInstructions, helpInstructions].filter(Boolean).join("\n")}`
    : "";

  const priceTierLabel = (tier: number | null, price: number): string => {
    if (tier === null || tier === undefined) return price > 0 ? `$${price}/person` : "Free";
    return ["$", "$$", "$$$", "$$$$"][tier - 1] || "$";
  };

  const bookingNote = (type: string | null): string => {
    switch (type) {
      case "reservable":           return "Book in advance via Vtopia";
      case "restaurant_reserve":   return "Reservation recommended — book on OpenTable or restaurant site";
      case "food_walkup":
      case "food_delivery":        return "Walk in — no reservation needed";
      case "outdoor_free":
      case "free_no_booking":      return "Free — just show up";
      case "outdoor_paid":         return "Entry fee required — buy tickets at the venue or online";
      case "cultural_free":        return "Free admission";
      case "cultural_paid":        return "Entry fee required — check venue website for tickets";
      case "nightlife_walkin":
      case "nightlife":            return "Walk in — check for cover charge on weekends";
      case "nightlife_ticketed":   return "Tickets required — buy in advance";
      case "ticketed":             return "Tickets required — check ticket_url or venue website";
      case "sports_event":         return "Tickets required — check team website or Ticketmaster";
      case "transport":            return "No booking needed — see routes at provider website";
      default:                     return "";
    }
  };

  const catalogSection = experiences.length > 0
    ? `\n\nExperiences available in ${city} via Vtopia:\n${
        experiences
          .map((e) => {
            const note = bookingNote(e.experience_type);
            const price = priceTierLabel(e.price_tier, e.price_per_person);
            return `[${e.id}] ${e.title} | ${e.category} | ${price} | ${e.duration_label}${note ? ` | ${note}` : ""}`;
          })
          .join("\n")
      }\n\nWhen an activity slot matches one of the above: set "experienceId" to its UUID and "cost" to its price display (e.g. "$$" or "Free"). IMPORTANT: only suggest "Book via Vtopia" for experiences whose note says "Book in advance via Vtopia". For all other types, use the booking note as the tip — never suggest internal Vtopia booking for restaurants, parks, nightlife, or ticketed events.`
    : "";

  return `You are a travel concierge. Create a ${days}-day itinerary for a ${answers.traveler || "traveler"} trip to ${city}. Budget: ${BUDGET_LABELS[answers.budget]} per person/day. Interests: ${answers.interests.join(", ")}. Hotel tier: ${BUDGET_HOTEL_TIER[answers.budget]}.${groupLine}${helpLine}${extras}${personalizationSection}${catalogSection}

Keep all descriptions to 1-2 sentences max. Respond ONLY with this JSON structure, no markdown:

{"headline":"6-8 word tagline","overview":"2 sentence overview","days":[{"day":1,"theme":"Day theme","morning":{"title":"","description":"","tip":"","cost":"","experienceId":""},"afternoon":{"title":"","description":"","tip":"","cost":"","experienceId":""},"evening":{"title":"","description":"","tip":"","cost":"","experienceId":""},"lunch":"Restaurant and why","dinner":"Restaurant and why","dailyTotal":"Est total"}],"hotelRecommendations":[{"name":"","reason":"","priceRange":"$/$$/$$$"}],"packingTips":["tip1","tip2","tip3"],"budgetBreakdown":{"accommodation":"","food":"","activities":"","transport":""}}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, sentry-trace, baggage",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const { answers } = await req.json();
    if (!answers) {
      return new Response(JSON.stringify({ error: "Missing answers" }), { status: 400 });
    }

    // Fetch real experiences for the city so Claude uses accurate prices and IDs
    const cityName = CITY_LABELS[answers.city];
    let experiences: Experience[] = [];
    if (cityName) {
      try {
        const { data } = await supabase
          .from("experiences")
          .select("id,title,category,experience_type,price_per_person,price_tier,duration_label")
          .eq("city", cityName)
          .eq("is_active", true)
          .order("rating", { ascending: false })
          .limit(30);
        if (data) experiences = data;
      } catch (_) {
        // Non-fatal: fall back to catalog-free generation
      }
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
        max_tokens: 4096,
        system: "You are a travel concierge. Respond ONLY with valid JSON. No markdown, no explanation.",
        messages: [{ role: "user", content: buildPrompt(answers, experiences) }],
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
