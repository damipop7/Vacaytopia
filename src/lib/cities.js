export const CITY_LABELS = {
  'kansas-city': 'Kansas City',
  nyc:           'New York City',
  miami:         'Miami',
  orlando:       'Orlando',
  'las-vegas':   'Las Vegas',
  'new-orleans': 'New Orleans',
  austin:        'Austin',
}

export const BUDGET_LABELS = {
  budget:  '$100-200/day',
  mid:     '$200-350/day',
  premium: '$350-500/day',
}

export const ACTIVE_CITIES = (import.meta.env?.VITE_ACTIVE_CITIES || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
