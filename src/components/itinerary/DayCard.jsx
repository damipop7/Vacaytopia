import { useState } from "react";
import { Link } from "react-router-dom";
import { slotAction, dayLegs } from "../../lib/itineraryPlan";

const ACTION_CLS = "inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 transition";

function SlotAction({ action }) {
  if (!action) return null;
  if (action.kind === "external") {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <a href={action.href} target="_blank" rel="noopener noreferrer" className={ACTION_CLS} onClick={(e) => e.stopPropagation()}>
          {action.label}
        </a>
        <Link to={action.to} className="text-xs text-blue-400 hover:text-blue-300 transition" onClick={(e) => e.stopPropagation()}>
          Details
        </Link>
        <span className="text-white/30 text-xs">{action.note}</span>
      </div>
    );
  }
  return (
    <Link to={action.to} className={`mt-3 ${ACTION_CLS}`} onClick={(e) => e.stopPropagation()}>
      {action.kind === "book" ? `🎫 ${action.label}` : action.label}
    </Link>
  );
}

function TimeBlock({ period, data, icon, experience, leg }) {
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
        <SlotAction action={slotAction(data, experience)} />
        {leg && (
          <div className="mt-4 text-xs text-white/40">
            {leg.mode === "walk" ? "🚶" : "🚗"} About {leg.minutes} min {leg.mode === "walk" ? "walk" : "ride"} to your next stop
          </div>
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

const PERIODS = [
  { slot: "morning", period: "Morning", icon: "🌅" },
  { slot: "afternoon", period: "Afternoon", icon: "☀️" },
  { slot: "evening", period: "Evening", icon: "🌙" },
];

/** One collapsible day of an itinerary. `experiences` is the catalog lookup from useItineraryExperiences. */
export default function DayCard({ day, index, weatherDay = null, experiences = {} }) {
  const [open, setOpen] = useState(index === 0);
  const legs = dayLegs(day, experiences);
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
          {weatherDay && (
            <div className="hidden sm:flex items-center gap-1.5">
              <img src={`https://openweathermap.org/img/wn/${weatherDay.icon}.png`} alt={weatherDay.description} width={20} height={20} className="opacity-70" />
              <span className="text-xs text-white/50 font-mono">{weatherDay.tempHigh}°</span>
              {weatherDay.isRainy && <span className="text-[10px] text-blue-300 font-bold">Rain</span>}
            </div>
          )}
          {day.dailyTotal && <span className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-white/50 font-mono hidden md:block">~{day.dailyTotal}</span>}
          <span className={`text-white/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▼</span>
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-white/5">
          <div className="mt-5">
            {PERIODS.map(({ slot, period, icon }) => (
              <TimeBlock
                key={slot}
                period={period}
                icon={icon}
                data={day[slot]}
                experience={experiences[day[slot]?.experienceId]}
                leg={legs.find((l) => l.from === slot)}
              />
            ))}
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
