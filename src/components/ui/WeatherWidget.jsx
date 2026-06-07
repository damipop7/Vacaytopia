import { useWeather } from '../../hooks/useWeather'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Reusable weather component.
 * variant: 'inline' | 'strip' | 'badge'
 * theme:   'light'  | 'dark'
 * days:    number of days shown in strip (default 7)
 * dayIndex: which forecast day to show in badge variant (0 = today)
 */
export default function WeatherWidget({
  citySlug  = 'kansas-city',
  variant   = 'inline',
  theme     = 'light',
  days      = 7,
  dayIndex  = 0,
  className = '',
}) {
  const { weather, available } = useWeather(citySlug)
  if (!available || !weather?.length) return null

  // ── Inline — single row: icon + temp + condition ─────────────────────────
  if (variant === 'inline') {
    const today = weather[0]
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <img
          src={`https://openweathermap.org/img/wn/${today.icon}.png`}
          alt={today.description}
          width={24} height={24}
          className={theme === 'dark' ? 'opacity-80' : ''}
        />
        <span className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-[#0D1B3E]'}`}>
          {today.tempHigh}°
        </span>
        <span className={`text-xs capitalize ${theme === 'dark' ? 'text-white/50' : 'text-gray-400'}`}>
          {today.description}
        </span>
        {today.isRainy && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            theme === 'dark'
              ? 'bg-blue-400/20 text-blue-300'
              : 'bg-blue-50 text-blue-600 border border-blue-100'
          }`}>Rain</span>
        )}
        {today.isHot && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            theme === 'dark'
              ? 'bg-orange-400/20 text-orange-300'
              : 'bg-orange-50 text-orange-600 border border-orange-100'
          }`}>Hot</span>
        )}
      </div>
    )
  }

  // ── Badge — compact single day ────────────────────────────────────────────
  if (variant === 'badge') {
    const day = weather[dayIndex] ?? weather[0]
    return (
      <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl ${
        theme === 'dark'
          ? 'bg-white/5 border border-white/10'
          : 'bg-blue-50 border border-blue-100'
      } ${className}`}>
        <img
          src={`https://openweathermap.org/img/wn/${day.icon}.png`}
          alt={day.description}
          width={28} height={28}
        />
        <div>
          <div className={`text-xs font-bold leading-none ${theme === 'dark' ? 'text-white' : 'text-[#0D1B3E]'}`}>
            {day.tempHigh}° / {day.tempLow}°
          </div>
          <div className={`text-[10px] capitalize mt-0.5 ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>
            {day.isRainy ? '🌧 Rain likely' : day.description}
          </div>
        </div>
      </div>
    )
  }

  // ── Strip — scrollable multi-day forecast ─────────────────────────────────
  const stripDays = weather.slice(0, Math.min(days, weather.length))
  return (
    <div className={`rounded-2xl p-4 ${
      theme === 'dark'
        ? 'bg-white/5 border border-white/10'
        : 'bg-white border border-blue-brand/10 shadow-sm'
    } ${className}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${
        theme === 'dark' ? 'text-white/40' : 'text-gray-400'
      }`}>
        {days}-Day Forecast · Kansas City
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {stripDays.map((day, i) => {
          const date  = new Date(day.dt * 1000)
          const label = i === 0 ? 'Today' : WEEKDAYS[date.getDay()]
          return (
            <div key={day.dt} className="flex flex-col items-center gap-1 min-w-[52px]">
              <span className={`text-[10px] font-semibold ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>
                {label}
              </span>
              <img
                src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                alt={day.description}
                width={32} height={32}
                className={theme === 'dark' ? 'opacity-80' : ''}
              />
              {day.isRainy && (
                <span className={`text-[9px] font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-500'}`}>
                  Rain
                </span>
              )}
              <span className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-[#0D1B3E]'}`}>
                {day.tempHigh}°
              </span>
              <span className={`text-[10px] ${theme === 'dark' ? 'text-white/30' : 'text-gray-300'}`}>
                {day.tempLow}°
              </span>
            </div>
          )
        })}
      </div>
      {theme === 'dark' && (
        <p className="text-white/25 text-[10px] mt-2">°F · Rainy days marked — outdoor activities may need adjusting.</p>
      )}
    </div>
  )
}
