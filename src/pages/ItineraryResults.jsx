import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ExperienceCard from "../components/cards/ExperienceCard";
import { useWeather } from "../hooks/useWeather";
import { bookingCityUrl, uberDeepLink, lyftDeepLink } from "../lib/affiliates.config";
import { CITY_LABELS, BUDGET_LABELS } from "../lib/cities";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cache key fields used to decide whether a stored itinerary matches the current quiz answers.
// Deliberately excludes interests/extras so minor wording changes don't force regeneration.
export function itineraryCacheKey(answers) {
  return `${answers?.city}|${answers?.startDate}|${answers?.endDate}|${answers?.budget}`;
}

const INTEREST_TAG_MAP = {
  food:      ["cuisine:american", "cuisine:burger", "cuisine:chicken", "cuisine:coffee_shop",
               "cuisine:ethiopian", "cuisine:irish", "cuisine:italian", "cuisine:mexican",
               "cuisine:sandwich", "cuisine:coffee_shop;pastry"],
  outdoors:  ["leisure:park", "leisure:disc_golf_course", "leisure:golf_course", "tourism:attraction"],
  nightlife: ["cuisine:irish"],
  arts:      ["tourism:museum", "tourism:attraction"],
  sports:    ["leisure:sports_centre", "sport:taekwondo", "sport:weightlifting;crossfit",
               "leisure:disc_golf_course", "leisure:golf_course", "leisure:amusement_arcade"],
  wellness:  ["leisure:sports_centre", "sport:taekwondo", "sport:weightlifting;crossfit"],
  shopping:  ["tourism:attraction"],
  music:     ["tourism:attraction"],
};

function LoadingScreen({ city, streamedHeadline, isRetrying }) {
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const stages = [
    { label: "Researching neighborhoods...", target: 15 },
    { label: "Finding hidden gems...", target: 35 },
    { label: "Curating restaurants and bars...", target: 55 },
    { label: "Building your day-by-day plan...", target: 72 },
    { label: "Optimizing for your budget...", target: 85 },
    { label: "Adding insider tips...", target: 94 },
    { label: "Almost ready...", target: 98 },
  ];
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const stage = stages[stageIndex] || stages[stages.length - 1];
        if (prev >= stage.target) setStageIndex((s) => Math.min(s + 1, stages.length - 1));
        const increment = prev < 60 ? 1.2 : prev < 85 ? 0.6 : 0.15;
        return Math.min(prev + increment, 98);
      });
    }, 200);
    return () => clearInterval(interval);
  }, [stageIndex]);
  const currentStage = stages[Math.min(stageIndex, stages.length - 1)];
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-8 px-4">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-2 border-blue-600/20 animate-ping" style={{ animationDuration: "2s" }} />
        <div className="absolute inset-2 rounded-full border-2 border-blue-500/40 animate-spin" style={{ animationDuration: "3s" }} />
        <div className="absolute inset-0 flex items-center justify-center text-4xl">✈️</div>
      </div>
      <div className="text-center">
        {streamedHeadline ? (
          <>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 animate-fade-in">{streamedHeadline}</h2>
            <p className="text-white/40 text-sm">Finishing up the details...</p>
          </>
        ) : (
          <>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              {isRetrying ? "Still working on it..." : "Building your perfect trip..."}
            </h2>
            <p className="text-white/40 text-sm">Personalized plan for {city}</p>
          </>
        )}
      </div>
      <div className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/50 text-xs animate-pulse">{currentStage.label}</span>
          <span className="text-blue-400 text-xs font-mono font-bold">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-600 to-amber-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="flex gap-8 text-center">
        {["Experiences", "Hotels", "Tips"].map((item, i) => (
          <div key={item} className="flex flex-col items-center gap-1">
            <div className={`w-2 h-2 rounded-full transition-all duration-500 ${progress > 30 + i * 20 ? "bg-blue-400" : "bg-white/20"}`} />
            <span className={`text-xs transition-all duration-500 ${progress > 30 + i * 20 ? "text-white/50" : "text-white/20"}`}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimeBlock({ period, data, icon }) {
  if (!data) return null;
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-base flex-shrink-0">{icon}</div>
        <div className="w-px flex-1 bg-white/10 mt-2" />
      </div>
      <div className="pb-6 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white/40 text-xs uppercase tracking-wider">{period}</span>
          {data.cost && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-mono">{data.cost}</span>}
        </div>
        <h4 className="font-bold text-base mb-1">{data.title}</h4>
        <p className="text-white/60 text-sm leading-relaxed">{data.description}</p>
        {data.tip && <div className="mt-2 text-xs text-blue-300 bg-blue-600/10 border border-blue-500/20 rounded-lg px-3 py-2">💡 {data.tip}</div>}
        {data.experienceId && (
          <Link
            to={`/experience/${data.experienceId}?from=itinerary`}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 transition"
            onClick={(e) => e.stopPropagation()}
          >
            🎫 Book on Vtopia →
          </Link>
        )}
      </div>
    </div>
  );
}

function MealBlock({ label, content }) {
  if (!content) return null;
  return (
    <div className="flex gap-3 items-start py-2 border-t border-white/5">
      <span className="text-sm mt-0.5">{label === "Lunch" ? "🥗" : "🍽️"}</span>
      <div>
        <span className="text-white/40 text-xs">{label}:</span>
        <p className="text-sm text-white/70">{content}</p>
      </div>
    </div>
  );
}

function DayCard({ day, index }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <button className="w-full flex items-center justify-between p-5 text-left" onClick={() => setOpen((o) => !o)}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400">{day.day}</div>
          <div>
            <div className="text-xs text-white/40 uppercase tracking-wider">Day {day.day}</div>
            <div className="font-semibold">{day.theme}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {day.dailyTotal && <span className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-white/50 font-mono hidden md:block">~{day.dailyTotal}</span>}
          <span className={`text-white/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▼</span>
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-white/5">
          <div className="mt-5">
            <TimeBlock period="Morning" data={day.morning} icon="🌅" />
            <TimeBlock period="Afternoon" data={day.afternoon} icon="☀️" />
            <TimeBlock period="Evening" data={day.evening} icon="🌙" />
          </div>
          <div className="mt-2 bg-white/[0.02] rounded-xl p-4">
            <MealBlock label="Lunch" content={day.lunch} />
            <MealBlock label="Dinner" content={day.dinner} />
          </div>
        </div>
      )}
    </div>
  );
}

function BookableExperiences({ cityKey, interests = [] }) {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const cityName = CITY_LABELS[cityKey];

  useEffect(() => {
    if (!cityName) { setLoading(false); return; }
    fetchExperiences();
  }, [cityKey]);

  async function fetchExperiences() {
    setLoading(true);
    try {
      const interestTags = interests.flatMap((i) => INTEREST_TAG_MAP[i] || []);
      if (interestTags.length > 0) {
        const { data: matched, error: matchErr } = await supabase
          .from("experiences")
          .select(`id, title, city, category, price_per_person, duration_label, rating, review_count, image_emoji, image_gradient, is_sponsored, tags, source, lat, lng, website, address`)
          .eq("city", cityName).eq("is_active", true)
          .overlaps("tags", interestTags)
          .order("is_featured", { ascending: false }).order("rating", { ascending: false }).limit(6);
        if (!matchErr && matched && matched.length >= 3) { setExperiences(matched); setLoading(false); return; }
      }
      const { data: fallback } = await supabase
        .from("experiences")
        .select(`id, title, city, category, price_per_person, duration_label, rating, review_count, image_emoji, image_gradient, is_sponsored, tags, source, lat, lng, website, address`)
        .eq("city", cityName).eq("is_active", true)
        .order("is_featured", { ascending: false }).order("rating", { ascending: false }).limit(6);
      setExperiences(fallback || []);
    } catch { setExperiences([]); }
    finally { setLoading(false); }
  }

  if (!loading && experiences.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-xs text-blue-400 uppercase tracking-widest font-semibold mb-1">Book directly through Vtopia</div>
          <h2 className="text-xl font-bold text-white">Experiences in {cityName}</h2>
          <p className="text-white/50 text-sm mt-1">Handpicked to match your itinerary — reserve your spot now</p>
        </div>
        <Link to={`/browse?city=${cityKey}`} className="hidden md:flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition flex-shrink-0">See all →</Link>
      </div>
      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-72 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {experiences.map((exp) => <ExperienceCard key={exp.id} experience={exp} />)}
        </div>
      )}
      <div className="mt-5 md:hidden text-center">
        <Link to={`/browse?city=${cityKey}`} className="text-sm text-blue-400 hover:text-blue-300 transition">See all experiences in {cityName} →</Link>
      </div>
    </div>
  );
}

/** 7-day weather strip — only renders when OpenWeatherMap key is set */
function WeatherStrip({ citySlug }) {
  const { weather, available } = useWeather(citySlug)
  if (!available || !weather) return null
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
      <p className="text-white/40 text-xs uppercase tracking-widest mb-3">7-Day Forecast</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {weather.map(day => {
          const date  = new Date(day.dt * 1000)
          const label = days[date.getDay()]
          return (
            <div key={day.dt} className="flex flex-col items-center gap-1 min-w-[52px]">
              <span className="text-white/40 text-[10px]">{label}</span>
              <img
                src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                alt={day.description}
                width={32}
                height={32}
                className="opacity-80"
              />
              {day.isRainy && <span className="text-[9px] text-blue-300 font-semibold">Rain</span>}
              <span className="text-xs font-bold text-white">{day.tempHigh}°</span>
              <span className="text-[10px] text-white/30">{day.tempLow}°</span>
            </div>
          )
        })}
      </div>
      <p className="text-white/30 text-[10px] mt-2">Weather shown in °F · Rainy days marked — outdoor activities may be re-ordered.</p>
    </div>
  )
}

/** Running cost total — sums cost strings from day slots */
function CostSummary({ days }) {
  const total = (days ?? []).reduce((sum, day) => {
    const slots = [day.morning, day.afternoon, day.evening]
    return slots.reduce((s, slot) => {
      if (!slot?.cost) return s
      const match = slot.cost.match(/\$?([\d,]+)/)
      return s + (match ? parseInt(match[1].replace(',', ''), 10) : 0)
    }, sum)
  }, 0)
  if (total === 0) return null
  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 flex items-center justify-between text-sm">
      <span className="text-white/60">Estimated experience cost</span>
      <span className="text-amber-400 font-bold font-mono">~${total.toLocaleString()}</span>
    </div>
  )
}

/** Uber + Lyft one-tap buttons for a destination */
function RideButtons({ destination, lat, lng }) {
  return (
    <div className="flex gap-2 mt-2">
      <a href={uberDeepLink(destination, lat, lng)} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white text-xs font-semibold hover:bg-gray-900 transition">
        <span>🚗</span> Uber
      </a>
      <a href={lyftDeepLink(destination, lat, lng)} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600 text-white text-xs font-semibold hover:bg-pink-500 transition">
        <span>🚗</span> Lyft
      </a>
    </div>
  )
}

function ShareButton({ itineraryId, headline }) {
  const [copied, setCopied] = useState(false);
  async function handleShare() {
    const url = `${window.location.origin}/itinerary/${itineraryId}`;
    if (navigator.share) {
      try { await navigator.share({ title: headline, text: `Check out my Vtopia trip plan! ${url}`, url }); return; } catch { /* user dismissed share sheet */ }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }
  if (!itineraryId) return null;
  return (
    <button onClick={handleShare} className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 hover:border-amber-400/60 hover:bg-amber-500/20 rounded-xl text-sm text-amber-400 font-semibold transition flex items-center gap-2">
      {copied ? "✅ Link copied!" : "🔗 Share plan"}
    </button>
  );
}

const STORAGE_KEY = "vtopia_active_itinerary";

/** Read and validate the sessionStorage cache against the provided answers.
 *  Returns the parsed cache object on a hit, or null on a miss/error. */
export function readCachedItinerary(answers) {
  if (!answers) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (c.itinerary?.days?.length > 0 && itineraryCacheKey(c.answers) === itineraryCacheKey(answers)) {
      return c;
    }
  } catch { /* corrupt storage */ }
  return null;
}

export default function ItineraryResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const answers = location.state?.answers;

  // Initialise synchronously from cache so back-navigation never flashes the loading screen.
  // `answers` is available here because useLocation() runs before useState().
  const [status, setStatus] = useState(() =>
    readCachedItinerary(answers) ? "success" : "idle"
  );
  const [itinerary, setItinerary] = useState(() =>
    readCachedItinerary(answers)?.itinerary ?? null
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState("itinerary");
  const [savedItineraryId, setSavedItineraryId] = useState(() =>
    readCachedItinerary(answers)?.itineraryId ?? null
  );
  const [streamedHeadline, setStreamedHeadline] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const hasFetched = useRef(false);
  const { weather } = useWeather(answers?.city);

  const nights = answers
    ? Math.round((new Date(answers.endDate) - new Date(answers.startDate)) / (1000 * 60 * 60 * 24))
    : 0;

  useEffect(() => {
    if (!answers) {
      navigate("/itinerary", { replace: true });
      return;
    }
    if (hasFetched.current) return;
    hasFetched.current = true;

    // Restore from cache first — skips the API call entirely if answers match
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (
          cached.itinerary?.days?.length > 0 &&
          itineraryCacheKey(cached.answers) === itineraryCacheKey(answers)
        ) {
          setItinerary(cached.itinerary);
          if (cached.itineraryId) setSavedItineraryId(cached.itineraryId);
          setStatus("success");
          return;
        }
      }
    } catch { /* corrupt cache — fall through to generation */ }

    generateItinerary(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  async function generateItinerary(isRetry) {
    // First attempt: 30s. Auto-retry gets 50s since the first already warmed up the edge function.
    const timeoutMs = isRetry ? 50_000 : 30_000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    let stallCheckId = null;

    try {
      setStatus("loading");
      setStreamedHeadline(null);

      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        navigate("/auth", {
          state: { from: "/itinerary/results", answers, message: "Sign in to generate your itinerary" },
        });
        return;
      }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/generate-itinerary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ answers }),
          signal: controller.signal,
        }
      );

      if (response.status === 401) {
        navigate("/auth", {
          state: { from: "/itinerary/results", answers, message: "Sign in to generate your itinerary" },
        });
        return;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error || `Server error ${response.status}`);
      }

      // Read the streaming plain-text response and accumulate the JSON
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let headlineExtracted = false;

      // Stall detection: if no bytes arrive for 15s, abort so the retry logic fires
      let lastByteAt = Date.now();
      stallCheckId = setInterval(() => {
        if (Date.now() - lastByteAt > 15_000) {
          clearInterval(stallCheckId);
          controller.abort();
        }
      }, 2_000);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        lastByteAt = Date.now();
        accumulated += decoder.decode(value, { stream: true });

        // Extract the headline as soon as it appears so the loading screen shows it
        if (!headlineExtracted) {
          const match = accumulated.match(/"headline"\s*:\s*"([^"]+)"/);
          if (match) {
            setStreamedHeadline(match[1]);
            headlineExtracted = true;
          }
        }
      }

      if (!accumulated.trim()) throw new Error("Empty response from server");

      const cleaned = accumulated.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      if (!parsed?.days?.length) throw new Error("Invalid itinerary — missing days");

      setItinerary(parsed);
      setStatus("success");

      // Write to cache
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          itinerary: parsed,
          answers,
          city: answers.city,
        }));
      } catch { /* storage unavailable */ }

      // Persist to DB (non-fatal)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: saved } = await supabase
          .from("itineraries")
          .insert({
            user_id: user?.id ?? null,
            city: answers.city,
            start_date: answers.startDate,
            end_date: answers.endDate,
            budget: answers.budget,
            interests: answers.interests,
            traveler_type: answers.traveler,
            extras: answers.extras,
            itinerary_data: parsed,
          })
          .select("id")
          .single();
        if (saved?.id) {
          setSavedItineraryId(saved.id);
          // Update cache with the DB id so Share works after a back-navigation
          try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (raw) {
              const data = JSON.parse(raw);
              data.itineraryId = saved.id;
              sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            }
          } catch { /* ignore */ }
        }
      } catch { /* non-fatal */ }
    } catch (err) {
      const timedOut     = err.name === "AbortError";
      // JSON truncation (max_tokens hit) or empty stream — worth retrying once
      const parseFailure = err instanceof SyntaxError
        || err.message === "Invalid itinerary — missing days"
        || err.message === "Empty response from server";

      // Auto-retry once on timeout or parse failure before surfacing the error
      if ((timedOut || parseFailure) && !isRetry) {
        setIsRetrying(true);
        generateItinerary(true);
        return;
      }

      setIsRetrying(false);
      setErrorMsg(
        timedOut
          ? "This is taking longer than usual. Please try again."
          : parseFailure
            ? "The itinerary response was incomplete. Please try again."
            : err.message || "Something went wrong."
      );
      setStatus("error");
    } finally {
      clearTimeout(timeoutId);
      if (stallCheckId !== null) clearInterval(stallCheckId);
    }
  }

  function handleRegenerate() {
    // Clear cache so the new generation is stored fresh
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    hasFetched.current = false;
    setIsRetrying(false);
    generateItinerary(false);
  }

  if (status === "idle" || status === "loading") {
    return (
      <LoadingScreen
        city={CITY_LABELS[answers?.city] || "your destination"}
        streamedHeadline={streamedHeadline}
        isRetrying={isRetrying}
      />
    );
  }

  if (status === "error") return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="text-5xl">😕</div>
      <h2 className="text-2xl font-bold">Could not generate itinerary</h2>
      <p className="text-white/50 text-sm max-w-sm">{errorMsg}</p>
      <div className="flex gap-3">
        <button onClick={handleRegenerate} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition">Try Again</button>
        <Link to="/itinerary" className="px-6 py-3 border border-white/20 rounded-xl font-semibold transition text-white/70">Edit Answers</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="relative bg-gradient-to-br from-blue-900/60 via-gray-950 to-gray-950 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
          <div className="flex items-center gap-2 mb-4">
            <Link to="/" className="text-white/40 hover:text-white text-sm transition">Vtopia</Link>
            <span className="text-white/20">/</span>
            <span className="text-white/40 text-sm">AI Itinerary</span>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-3">{itinerary.headline}</h1>
              <p className="text-white/60 text-base max-w-xl leading-relaxed">{itinerary.overview}</p>
            </div>
            <div className="flex flex-col gap-2 text-sm flex-shrink-0">
              <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                <div className="text-white/40">Destination</div>
                <div className="font-semibold">{CITY_LABELS[answers.city]}</div>
              </div>
              <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                <div className="text-white/40">Duration</div>
                <div className="font-semibold">{nights} night{nights !== 1 ? "s" : ""}</div>
              </div>
              <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                <div className="text-white/40">Budget</div>
                <div className="font-semibold capitalize">{answers.budget} — {BUDGET_LABELS[answers.budget]}</div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-8">
            <button onClick={() => window.print()} className="px-4 py-2 bg-white/5 border border-white/10 hover:border-white/30 rounded-xl text-sm transition">Print</button>
            <ShareButton itineraryId={savedItineraryId} headline={itinerary.headline} />
            <button
              onClick={handleRegenerate}
              className="px-4 py-2 bg-white/5 border border-white/10 hover:border-amber-500/40 hover:text-amber-300 rounded-xl text-sm transition"
            >
              Re-optimize plan
            </button>
            <Link to={"/browse?city=" + answers.city} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition">Browse Experiences</Link>
            <Link
              to="/trips/new"
              state={{ prefill: {
                title:     itinerary.headline ?? '',
                startDate: answers.startDate  ?? '',
                endDate:   answers.endDate    ?? '',
                budgetTier: answers.budget    ?? 'mid',
                travelers: { solo: 2, couple: 2, friends: 4, family: 4 }[answers.traveler] ?? 2,
              }}}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-xl text-sm font-semibold transition flex items-center gap-1.5"
            >
              👥 Plan with friends
            </Link>
            <Link to="/itinerary" className="px-4 py-2 bg-white/5 border border-white/10 hover:border-white/30 rounded-xl text-sm transition">New itinerary</Link>
          </div>
        </div>
      </div>

      <div className="border-b border-white/10 sticky top-0 bg-gray-950/90 backdrop-blur-md z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: "itinerary", label: "📅 Day by Day" },
              { id: "hotels", label: "🏨 Where to Stay" },
              { id: "budget", label: "💰 Budget" },
              { id: "packing", label: "🎒 Packing Tips" },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${activeTab === tab.id ? "border-blue-500 text-white" : "border-transparent text-white/40 hover:text-white/70"}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === "itinerary" && (
          <div className="flex flex-col gap-4">
            <WeatherStrip citySlug={answers.city} />
            <CostSummary days={itinerary.days} />
            {itinerary.days?.map((day, i) => <DayCard key={day.day} day={day} index={i} />)}

            {/* Solo → group upgrade CTA */}
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6 flex flex-col sm:flex-row items-center gap-5">
              <div className="text-4xl flex-shrink-0">👥</div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-bold text-white text-lg mb-1">Bring your crew</h3>
                <p className="text-white/50 text-sm">Turn this into a shared group trip — invite friends, vote on experiences, and track the budget together.</p>
              </div>
              <Link
                to="/trips/new"
                state={{ prefill: {
                  title:     itinerary.headline ?? '',
                  startDate: answers.startDate  ?? '',
                  endDate:   answers.endDate    ?? '',
                  budgetTier: answers.budget    ?? 'mid',
                  travelers: { solo: 2, couple: 2, friends: 4, family: 4 }[answers.traveler] ?? 2,
                }}}
                className="flex-shrink-0 px-5 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-semibold text-sm transition whitespace-nowrap"
              >
                Plan with friends →
              </Link>
            </div>

            <BookableExperiences cityKey={answers.city} interests={answers.interests || []} />
          </div>
        )}
        {activeTab === "hotels" && (
          <div>
            <h2 className="text-xl font-bold mb-2">Recommended Places to Stay</h2>
            <p className="text-white/50 text-sm mb-4">Curated for your budget in {CITY_LABELS[answers.city]}.</p>
            <a
              href={bookingCityUrl(CITY_LABELS[answers.city])}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between mb-6 p-4 rounded-2xl bg-blue-600/10 border border-blue-500/30 hover:border-blue-400/60 transition group"
            >
              <div>
                <div className="font-bold text-sm text-white">Browse all hotels in {CITY_LABELS[answers.city]}</div>
                <div className="text-white/50 text-xs mt-0.5">Best rates on Booking.com · Free cancellation on most</div>
              </div>
              <span className="text-blue-400 group-hover:text-blue-300 text-sm font-semibold flex-shrink-0 ml-4">View all →</span>
            </a>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {itinerary.hotelRecommendations?.map((hotel, i) => (
                <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold">{hotel.name}</h3>
                    <span className="text-amber-400 font-mono text-sm">{hotel.priceRange}</span>
                  </div>
                  <p className="text-white/60 text-sm">{hotel.reason}</p>
                  <div className="mt-4 flex gap-2">
                    <a href={bookingCityUrl(hotel.name + ' ' + CITY_LABELS[answers.city])}
                      target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-sm text-blue-400 hover:text-blue-300 hover:border-blue-400/60 transition font-semibold">
                      Book on Booking.com
                    </a>
                  </div>
                  <div className="mt-2">
                    <RideButtons destination={hotel.name + ', ' + CITY_LABELS[answers.city]} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === "budget" && (
          <div>
            <h2 className="text-xl font-bold mb-2">Daily Budget Breakdown</h2>
            <p className="text-white/50 text-sm mb-6">Estimated costs per person for your {answers.budget} trip.</p>
            {itinerary.budgetBreakdown && (
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(itinerary.budgetBreakdown).map(([key, value]) => (
                  <div key={key} className="p-5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-white/40 text-xs uppercase tracking-widest mb-1">
                      {key === "accommodation" ? "🏨 Accommodation" : key === "food" ? "🍜 Food & Drinks" : key === "activities" ? "🎡 Activities" : "🚇 Transport"}
                    </div>
                    <div className="text-2xl font-bold text-amber-400 font-mono">{value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === "packing" && (
          <div>
            <h2 className="text-xl font-bold mb-2">Packing Tips</h2>
            <p className="text-white/50 text-sm mb-6">What to bring for your {CITY_LABELS[answers.city]} trip.</p>
            <div className="flex flex-col gap-3">
              {itinerary.packingTips?.map((tip, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-sm font-bold flex-shrink-0">{i + 1}</div>
                  <p className="text-white/70 text-sm leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
