import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, sentry-trace, baggage",
  };
}

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

const VALID_TRAVELER_GROUPS = new Set([
  "solo", "couple", "friends", "family", "business",
  "solo traveler", "couple", "group of friends", "family with kids",
]);

const VALID_HELP_NEEDED = new Set([
  "transport", "hotels", "restaurants", "activities", "flights", "none",
]);

// Strip prompt-injection patterns from free-text user input
function sanitizeExtras(text: unknown): string {
  if (typeof text !== "string") return "";
  return text
    .slice(0, 400)
    .replace(/[<>]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/={3,}/g, "")
    .replace(/ignore.{0,30}(previous|above|instructions?)/gi, "")
    .replace(/\[INST\]|\[\/INST\]|<\|.*?\|>/g, "")  // LLM control tokens
    .trim();
}

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
  // Sanitize free-text field and whitelist-validate enum fields
  const extrasClean  = sanitizeExtras(answers.extras);
  const extras       = extrasClean ? `\nExtra context: ${extrasClean}` : "";

  // Whitelist travelerGroup — reject anything not in the known set
  const rawGroup: string = answers.travelerGroup || "";
  const travelerGroup: string = VALID_TRAVELER_GROUPS.has(rawGroup) ? rawGroup : "";

  // Whitelist each helpNeeded item individually
  const rawHelp: string[] = Array.isArray(answers.helpNeeded) ? answers.helpNeeded : [];
  const helpNeeded: string[] = rawHelp.filter(h => typeof h === "string" && VALID_HELP_NEEDED.has(h));

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
      }\n\nWhen an activity slot is a strong match for one of the above listings: set "experienceId" to its exact UUID. CRITICAL: NEVER invent or fabricate a UUID — if the activity does not exactly match a catalog entry, set experienceId to "". Do not set experienceId for restaurants, hotels, parks, or any place not in the catalog above. Only suggest "Book via Vtopia" for entries whose note says "Book in advance via Vtopia". For all others, use the booking note as the tip.`
    : "";

  return `You are a travel concierge. Create a ${days}-day itinerary for a ${answers.traveler || "traveler"} trip to ${city}. Budget: ${BUDGET_LABELS[answers.budget]} per person/day. Interests: ${answers.interests.join(", ")}. Hotel tier: ${BUDGET_HOTEL_TIER[answers.budget]}.${groupLine}${helpLine}${extras}${personalizationSection}${catalogSection}

Keep all descriptions to 1-2 sentences max. Respond ONLY with this JSON structure, no markdown:

{"headline":"6-8 word tagline","overview":"2 sentence overview","days":[{"day":1,"theme":"Day theme","morning":{"title":"","description":"","tip":"","cost":"","experienceId":""},"afternoon":{"title":"","description":"","tip":"","cost":"","experienceId":""},"evening":{"title":"","description":"","tip":"","cost":"","experienceId":""},"lunch":"Restaurant and why","dinner":"Restaurant and why","dailyTotal":"Est total"}],"hotelRecommendations":[{"name":"","reason":"","priceRange":"$/$$/$$$"}],"packingTips":["tip1","tip2","tip3"],"budgetBreakdown":{"accommodation":"","food":"","activities":"","transport":""}}`;
}

serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json", ...cors } });
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 503,
        headers: { "Content-Type": "application/json", ...cors },
      });
    }

    // Require a real user JWT — rejects the anon key and unauthenticated requests
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Sign in to generate an itinerary" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...cors },
      });
    }

    const { answers } = await req.json();
    if (!answers) {
      return new Response(JSON.stringify({ error: "Missing answers" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...cors },
      });
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
        stream: true,
        system: "You are a travel concierge. Respond ONLY with valid JSON. No markdown, no explanation.",
        messages: [{ role: "user", content: buildPrompt(answers, experiences) }],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Anthropic error ${anthropicRes.status}`);
    }

    // Transform Anthropic's SSE stream into a plain text stream of just the JSON content.
    // Each SSE event with type=content_block_delta contributes one text delta; we strip the
    // SSE framing so the client receives raw JSON characters as they arrive.
    let sseBuffer = "";
    const transformer = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        sseBuffer += new TextDecoder().decode(chunk);
        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() ?? ""; // keep incomplete last line for next chunk
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const event = JSON.parse(data);
            if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
              controller.enqueue(new TextEncoder().encode(event.delta.text));
            }
          } catch { /* ignore malformed SSE lines */ }
        }
      },
    });

    anthropicRes.body!.pipeTo(transformer.writable).catch(() => {
      // Stream aborted by client or network error — nothing to do
    });

    return new Response(transformer.readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        ...cors,
      },
    });
  } catch (err) {
    console.error("generate-itinerary error:", err);
    return new Response(JSON.stringify({ error: "Itinerary generation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...cors },
    });
  }
});
