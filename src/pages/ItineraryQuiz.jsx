import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CITIES = [
  { id: "kansas-city", name: "Kansas City", emoji: "🥩", vibe: "BBQ & World Cup 2026", featured: true }, // TODO: re-enable post-World-Cup
  { id: "nyc", name: "New York City", emoji: "🗽", vibe: "Culture & Energy" },
  { id: "miami", name: "Miami", emoji: "🌴", vibe: "Beach & Nightlife" },
  { id: "orlando", name: "Orlando", emoji: "🎢", vibe: "Theme Parks & Fun" },
  { id: "las-vegas", name: "Las Vegas", emoji: "🎰", vibe: "Entertainment & Shows" },
  { id: "new-orleans", name: "New Orleans", emoji: "🎷", vibe: "Food & Music" },
  { id: "austin", name: "Austin", emoji: "🎸", vibe: "Music & Outdoors" },
];

const INTERESTS = [
  { id: "food", label: "Food & Drinks", emoji: "🍜" },
  { id: "outdoors", label: "Outdoors", emoji: "🏞️" },
  { id: "nightlife", label: "Nightlife", emoji: "🎉" },
  { id: "sports", label: "Sports", emoji: "⚽" },
  { id: "arts", label: "Arts & Culture", emoji: "🎨" },
  { id: "wellness", label: "Wellness & Spas", emoji: "🧘" },
];

const BUDGET_OPTIONS = [
  { id: "budget", label: "Budget", range: "$100–200/day", emoji: "💰", desc: "Hostels, street food, free attractions" },
  { id: "mid", label: "Mid-Range", range: "$200–350/day", emoji: "💳", desc: "Hotels, restaurants, paid experiences" },
  { id: "premium", label: "Premium", range: "$350–500/day", emoji: "✨", desc: "Boutique hotels, fine dining, VIP access" },
];

// Derived from travelerGroup so we don't need a separate step
const GROUP_TO_TRAVELER = { solo: "solo", couple: "couple", friends: "friends", "large-group": "friends", family: "family" };

const HELP_NEEDED_OPTIONS = [
  { id: "transport",    label: "Getting around",          emoji: "🚗", desc: "Uber / Lyft" },
  { id: "hotels",       label: "Where to stay",           emoji: "🏨", desc: "Hotels & rentals" },
  { id: "restaurants",  label: "Restaurant reservations", emoji: "🍽️", desc: "Reserve a table" },
  { id: "activities",   label: "Activity bookings",       emoji: "🎟️", desc: "Pre-book experiences" },
  { id: "flights",      label: "Flights",                 emoji: "✈️", desc: "Best airports & timing" },
  { id: "none",         label: "None — just the itinerary", emoji: "🧳", desc: "" },
];

const TRAVELER_GROUP_OPTIONS = [
  { id: "solo",        label: "Solo",               emoji: "🧍" },
  { id: "couple",      label: "Couple",             emoji: "👫" },
  { id: "friends",     label: "Friends (2–4)",      emoji: "👯" },
  { id: "family",      label: "Family with kids",   emoji: "👨‍👩‍👧" },
  { id: "large-group", label: "Large group (5+)",   emoji: "🎉" },
];

const STEPS = ["city", "dates", "budget", "vibe", "helpNeeded", "travelerGroup", "extras"];

export default function ItineraryQuiz() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    city: null,
    startDate: "",
    endDate: "",
    budget: null,
    interests: [],
    helpNeeded: [],
    travelerGroup: null,
    traveler: null,
    extras: "",
  });
  const [errors, setErrors] = useState({});

  const currentStep = STEPS[step];
  const progress = ((step) / (STEPS.length - 1)) * 100;

  function toggleInterest(id) {
    setAnswers((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((i) => i !== id)
        : [...prev.interests, id],
    }));
  }

  function toggleHelpNeeded(id) {
    setAnswers((prev) => {
      if (id === "none") return { ...prev, helpNeeded: ["none"] };
      const without = prev.helpNeeded.filter((i) => i !== "none");
      return {
        ...prev,
        helpNeeded: without.includes(id)
          ? without.filter((i) => i !== id)
          : [...without, id],
      };
    });
  }

  function validate() {
    const e = {};
    if (currentStep === "city" && !answers.city) e.city = "Pick a city";
    if (currentStep === "dates") {
      if (!answers.startDate) e.startDate = "Choose a start date";
      if (!answers.endDate) e.endDate = "Choose an end date";
      if (answers.startDate && answers.endDate && answers.startDate >= answers.endDate)
        e.endDate = "End date must be after start date";
    }
    if (currentStep === "budget" && !answers.budget) e.budget = "Pick a budget";
    if (currentStep === "vibe" && answers.interests.length === 0) e.interests = "Pick at least one";
    if (currentStep === "helpNeeded" && answers.helpNeeded.length === 0) e.helpNeeded = "Select at least one option";
    if (currentStep === "travelerGroup" && !answers.travelerGroup) e.travelerGroup = "Tell us who's coming";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (!validate()) return;
    if (step < STEPS.length - 1) {
      // Derive traveler from travelerGroup when leaving that step
      if (currentStep === "travelerGroup" && answers.travelerGroup) {
        setAnswers((p) => ({ ...p, traveler: GROUP_TO_TRAVELER[p.travelerGroup] ?? "solo" }));
      }
      setStep((s) => s + 1);
    } else {
      navigate("/itinerary/results", { state: { answers } });
    }
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
    else navigate(-1);
  }

  // Get number of nights
  const nights =
    answers.startDate && answers.endDate
      ? Math.max(
          0,
          Math.round(
            (new Date(answers.endDate) - new Date(answers.startDate)) / (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <button onClick={back} className="text-white/50 hover:text-white transition text-sm flex items-center gap-2">
          <span>←</span> Back
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">V</div>
          <span className="font-semibold text-sm tracking-wide">Vtopia</span>
        </div>
        <span className="text-white/40 text-sm">{step + 1} / {STEPS.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-amber-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Quiz content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">

          {/* STEP: City */}
          {currentStep === "city" && (
            <div className="animate-fadeIn">
              <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3">Step {step + 1}</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Where are you headed?</h2>
              <p className="text-white/50 mb-8">We'll find real places and build your day-by-day plan.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CITIES.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => setAnswers((p) => ({ ...p, city: city.id }))}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                      answers.city === city.id
                        ? "border-blue-500 bg-blue-600/20 shadow-lg shadow-blue-600/20"
                        : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-2xl mb-2">{city.emoji}</div>
                    <div className="font-semibold text-sm">{city.name}</div>
                    <div className="text-white/40 text-xs mt-0.5">{city.vibe}</div>
                  </button>
                ))}
              </div>
              {errors.city && <p className="text-red-400 text-sm mt-3">{errors.city}</p>}
            </div>
          )}

          {/* STEP: Dates */}
          {currentStep === "dates" && (
            <div className="animate-fadeIn">
              <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3">Step {step + 1}</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">When's the trip?</h2>
              <p className="text-white/50 mb-8">We'll tailor the itinerary to your exact schedule.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-sm block mb-2">Arrival date</label>
                  <input
                    type="date"
                    value={answers.startDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setAnswers((p) => ({ ...p, startDate: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                  />
                  {errors.startDate && <p className="text-red-400 text-xs mt-1">{errors.startDate}</p>}
                </div>
                <div>
                  <label className="text-white/60 text-sm block mb-2">Departure date</label>
                  <input
                    type="date"
                    value={answers.endDate}
                    min={answers.startDate || new Date().toISOString().split("T")[0]}
                    onChange={(e) => setAnswers((p) => ({ ...p, endDate: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                  />
                  {errors.endDate && <p className="text-red-400 text-xs mt-1">{errors.endDate}</p>}
                </div>
              </div>
              {nights > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-blue-600/10 border border-blue-500/30 text-center">
                  <span className="text-blue-300 font-semibold">{nights} night{nights !== 1 ? "s" : ""}</span>
                  <span className="text-white/50 text-sm"> — we'll plan {nights + 1} full day{nights !== 0 ? "s" : ""}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP: Budget */}
          {currentStep === "budget" && (
            <div className="animate-fadeIn">
              <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3">Step {step + 1}</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">What's your budget?</h2>
              <p className="text-white/50 mb-8">Per person, per day. We'll optimize every recommendation.</p>
              <div className="flex flex-col gap-3">
                {BUDGET_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setAnswers((p) => ({ ...p, budget: opt.id }))}
                    className={`p-5 rounded-xl border text-left flex items-center gap-4 transition-all duration-200 ${
                      answers.budget === opt.id
                        ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/30"
                    }`}
                  >
                    <span className="text-3xl">{opt.emoji}</span>
                    <div className="flex-1">
                      <div className="font-semibold">{opt.label}</div>
                      <div className="text-amber-400 text-sm font-mono">{opt.range}</div>
                      <div className="text-white/40 text-xs mt-0.5">{opt.desc}</div>
                    </div>
                    {answers.budget === opt.id && (
                      <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-xs text-black font-bold">✓</div>
                    )}
                  </button>
                ))}
              </div>
              {errors.budget && <p className="text-red-400 text-sm mt-3">{errors.budget}</p>}
            </div>
          )}

          {/* STEP: Interests/Vibe */}
          {currentStep === "vibe" && (
            <div className="animate-fadeIn">
              <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3">Step {step + 1}</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">What's your vibe?</h2>
              <p className="text-white/50 mb-8">Select everything that sounds like you. Mix and match freely.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    className={`p-4 rounded-xl border text-center transition-all duration-200 ${
                      answers.interests.includes(interest.id)
                        ? "border-blue-500 bg-blue-600/20 shadow-md shadow-blue-600/20"
                        : "border-white/10 bg-white/5 hover:border-white/30"
                    }`}
                  >
                    <div className="text-2xl mb-2">{interest.emoji}</div>
                    <div className="text-sm font-medium">{interest.label}</div>
                  </button>
                ))}
              </div>
              {errors.interests && <p className="text-red-400 text-sm mt-3">{errors.interests}</p>}
            </div>
          )}

          {/* STEP: Help needed */}
          {currentStep === "helpNeeded" && (
            <div className="animate-fadeIn">
              <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3">Step {step + 1}</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">What would you like us to sort out?</h2>
              <p className="text-white/50 mb-8">We'll add recommendations to your plan.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {HELP_NEEDED_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => toggleHelpNeeded(opt.id)}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                      answers.helpNeeded.includes(opt.id)
                        ? "border-blue-500 bg-blue-600/20 shadow-md shadow-blue-600/20"
                        : "border-white/10 bg-white/5 hover:border-white/30"
                    }`}
                  >
                    <div className="text-2xl mb-2">{opt.emoji}</div>
                    <div className="text-sm font-medium">{opt.label}</div>
                    {opt.desc && <div className="text-white/40 text-xs mt-0.5">{opt.desc}</div>}
                  </button>
                ))}
              </div>
              {errors.helpNeeded && <p className="text-red-400 text-sm mt-3">{errors.helpNeeded}</p>}
            </div>
          )}

          {/* STEP: Traveler group */}
          {currentStep === "travelerGroup" && (
            <div className="animate-fadeIn">
              <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3">Step {step + 1}</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Who's coming with you?</h2>
              <p className="text-white/50 mb-8">We'll tailor recommendations to your group.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {TRAVELER_GROUP_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setAnswers((p) => ({ ...p, travelerGroup: opt.id }))}
                    className={`p-6 rounded-xl border text-center transition-all duration-200 ${
                      answers.travelerGroup === opt.id
                        ? "border-blue-500 bg-blue-600/20"
                        : "border-white/10 bg-white/5 hover:border-white/30"
                    }`}
                  >
                    <div className="text-4xl mb-2">{opt.emoji}</div>
                    <div className="font-semibold text-sm">{opt.label}</div>
                  </button>
                ))}
              </div>
              {errors.travelerGroup && <p className="text-red-400 text-sm mt-3">{errors.travelerGroup}</p>}
            </div>
          )}

          {/* STEP: Extras */}
          {currentStep === "extras" && (
            <div className="animate-fadeIn">
              <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3">Step {step + 1}</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Anything specific?</h2>
              <p className="text-white/50 mb-8">Dietary needs, must-see places, celebrations, accessibility — anything helps.</p>
              <textarea
                value={answers.extras}
                onChange={(e) => setAnswers((p) => ({ ...p, extras: e.target.value }))}
                placeholder="e.g. It's my girlfriend's birthday, we love jazz, she's vegetarian, and we want at least one rooftop bar..."
                rows={5}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition resize-none"
              />

              {/* Summary card */}
              <div className="mt-6 p-5 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-3">Your trip summary</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-white/40">Destination</span><br /><span className="font-semibold">{CITIES.find((c) => c.id === answers.city)?.name}</span></div>
                  <div><span className="text-white/40">Dates</span><br /><span className="font-semibold">{nights} nights</span></div>
                  <div><span className="text-white/40">Budget</span><br /><span className="font-semibold capitalize">{answers.budget}</span></div>
                  <div><span className="text-white/40">Group</span><br /><span className="font-semibold">{TRAVELER_GROUP_OPTIONS.find((x) => x.id === answers.travelerGroup)?.label}</span></div>
                  <div className="col-span-2"><span className="text-white/40">Interests</span><br /><span className="font-semibold">{answers.interests.map((i) => INTERESTS.find((x) => x.id === i)?.label).join(", ")}</span></div>
                  {answers.helpNeeded.length > 0 && <div className="col-span-2"><span className="text-white/40">Help needed</span><br /><span className="font-semibold">{answers.helpNeeded.map((i) => HELP_NEEDED_OPTIONS.find((x) => x.id === i)?.label).join(", ")}</span></div>}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-10 flex gap-3">
            {step > 0 && (
              <button
                onClick={back}
                className="px-6 py-3 rounded-xl border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition text-sm font-medium"
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              className="flex-1 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-base transition-all duration-200 shadow-lg shadow-blue-600/30"
            >
              {step === STEPS.length - 1 ? "✨ Generate My Itinerary" : "Continue →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
