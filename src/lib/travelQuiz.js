/** Shared interest quiz — keys must match `scoreExperience` in useRecommendations.js */

export const QUIZ_INTERESTS = [
  { id: 'food', label: 'Food & drink', emoji: '🍽️' },
  { id: 'outdoors', label: 'Outdoors & nature', emoji: '🌿' },
  { id: 'nightlife', label: 'Nightlife', emoji: '🌙' },
  { id: 'sports', label: 'Sports & games', emoji: '🏟️' },
  { id: 'arts', label: 'Arts & culture', emoji: '🎨' },
  { id: 'wellness', label: 'Wellness', emoji: '🧘' },
]

export const QUIZ_TRAVEL_STYLES = [
  { id: 'spontaneous', label: 'Spontaneous', hint: 'Go with the flow' },
  { id: 'planner', label: 'Planner', hint: 'Love an itinerary' },
  { id: 'solo', label: 'Solo', hint: 'Me time' },
  { id: 'social', label: 'Social', hint: 'The more the merrier' },
  { id: 'luxury', label: 'Elevated', hint: 'Premium when it counts' },
  { id: 'budget', label: 'Value', hint: 'Max fun per dollar' },
]

export const QUIZ_GROUP_TYPES = [
  { id: 'solo', label: 'Solo' },
  { id: 'couple', label: 'Partner' },
  { id: 'friends', label: 'Friends' },
  { id: 'family', label: 'Family' },
  { id: 'colleagues', label: 'Work / colleagues' },
]

export const QUIZ_CITIES = [
  { value: 'Kansas City', label: '🥩 Kansas City', featured: true },  // TODO: re-enable post-World-Cup
  { value: 'all', label: "I'm flexible — surprise me" },
  { value: 'Miami', label: 'Miami' },
  { value: 'New York City', label: 'New York City' },
  { value: 'Orlando', label: 'Orlando' },
  { value: 'Las Vegas', label: 'Las Vegas' },
  { value: 'New Orleans', label: 'New Orleans' },
]

export function labelInterests(ids) {
  if (!ids?.length) return 'Not set'
  const map = Object.fromEntries(QUIZ_INTERESTS.map(i => [i.id, i.label]))
  return ids.map(id => map[id] || id).join(', ')
}

export function labelStyle(id) {
  return QUIZ_TRAVEL_STYLES.find(s => s.id === id)?.label || id || 'Not set'
}

export function labelGroups(ids) {
  if (!ids?.length) return 'Not set'
  const map = Object.fromEntries(QUIZ_GROUP_TYPES.map(g => [g.id, g.label]))
  return ids.map(id => map[id] || id).join(', ')
}
