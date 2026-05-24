# Group Travel + Itinerary Builder 2.0 — Sprint Summary

## New Routes

| Route | Component | Auth |
|-------|-----------|------|
| `/trips` | MyTripsPage | Protected |
| `/trips/new` | TripCreationWizard | Protected |
| `/trips/:tripId` | TripDashboard | Protected |
| `/trips/join/:shareToken` | JoinTripPage | Public (join invite) |

## New Database Tables (migration 015)

| Table | Purpose |
|-------|---------|
| `trips` | Core trip object — solo or group, with share_token, dates, budget |
| `trip_members` | Members of a trip (role: owner/admin/member, avatar_color, contribution_cents) |
| `trip_experiences` | Experiences on a trip (day, slot, status, votes) |
| `trip_experience_votes` | Per-user votes (1 up, -1 down) with denorm trigger |
| `trip_budget_contributions` | Pledge/payment log per member |
| `trip_activity` | Activity feed + group chat log |

All tables have RLS policies. Vote counts auto-denormalised by DB trigger.

Supabase Realtime must be enabled manually on `trips`, `trip_members`, `trip_experiences`, `trip_activity`:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE trip_experiences;
ALTER PUBLICATION supabase_realtime ADD TABLE trip_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE trip_members;
ALTER PUBLICATION supabase_realtime ADD TABLE trips;
```

## New Hooks

| Hook | Description |
|------|-------------|
| `useMyTrips()` | List all trips for current user |
| `useTrip(tripId)` | Single trip with members |
| `useTripByToken(shareToken)` | Resolve share token → trip (public) |
| `useCreateTrip()` | Create trip + auto-join creator as owner |
| `useJoinTrip()` | Join via share token, log activity |
| `useUpdateTrip(tripId)` | Update trip fields |
| `usePledgeBudget(tripId)` | Member pledges budget contribution |
| `useTripExperiences(tripId)` | All experiences for a trip |
| `useMyVotes(tripId)` | Current user's vote map per experience |
| `useAddTripExperience(tripId)` | Add Vtopia or custom experience to slot |
| `useVoteTripExperience(tripId)` | Vote up/down (toggle off if same direction) |
| `useApproveTripExperience(tripId)` | Owner approve/reject/book status |
| `useRemoveTripExperience(tripId)` | Remove an experience |
| `useUpdateTripExperienceOrder(tripId)` | Drag-drop day/slot/sort reorder |
| `useTripRealtime(tripId)` | Supabase Realtime subscriptions (experiences, activity, members, trip) |
| `useTripActivity(tripId)` | Activity feed (last 50 items) |
| `useSendTripMessage(tripId)` | Post message to activity feed |

## New Components

| Component | Description |
|-----------|-------------|
| `components/trips/TripCard` | Summary card for MyTrips grid |
| `components/trips/MemberAvatarStack` | Overlapping coloured avatar stack |
| `components/trips/VoteButton` | 👍👎 with scale animation on click |
| `components/trips/ExperienceSlotCard` | Experience in trip context (vote, approve, calendar export) |
| `components/trips/BudgetPanel` | Budget progress bars + pledge form |
| `components/trips/ActivityFeed` | Live activity log + group chat input |
| `components/trips/AddToCalendarButton` | Dropdown: Google Calendar deep-link + .ics download |

## New Utilities

`src/lib/tripCalendar.js`:
- `buildVEvent(exp, tripStart, tripId)` — single VEVENT block
- `generateICS(title, experiences, tripStart, tripId)` — full `.ics` string
- `downloadICS(content, filename)` — triggers browser download
- `googleCalendarUrl(exp, tripStart)` — Google Calendar deep-link with local-time dates

## Tests

23 new unit tests in `src/tests/group-travel.test.js` covering:
- `buildVEvent`: slot hours, day offsets, start_time override, custom name fallback, Vtopia deep-link
- `generateICS`: VCALENDAR structure, event count, empty list
- `googleCalendarUrl`: URL format, title encoding, address, date format
- `activityLabel`: all activity types, null display_name

## Environment Variables (no new ones needed)

Group travel uses existing Supabase and Stripe credentials. Budget contribution via Stripe uses a future edge function (`create-group-payment-intent`) which is not yet deployed.

## Known Limitations / Deferred

| Feature | Status | Notes |
|---------|--------|-------|
| Budget contribution via Stripe | Scaffolded | Pledge flow works; Stripe payment sheet deferred — needs `create-group-payment-intent` edge function |
| Drag-and-drop reordering | Hook ready (`useUpdateTripExperienceOrder`) | UI drag handle deferred — needs @dnd-kit wiring in DayColumn |
| Email notifications | Deferred | Needs edge function using existing Resend key |
| Calendar view (weekly/monthly) | Deferred | Timeline view shipped; calendar grid is Phase 2 |
| Map view | Deferred | Hook-ready; needs BrowseMap integration |
| Solo itinerary → group upgrade | Deferred | "Plan with friends" CTA can link to `/trips/new` with pre-filled itinerary data |
| Group booking (shared Stripe charge) | Deferred | Individual booking still works; group charge needs new edge function |
| Notifications bell | Deferred | ActivityFeed is real-time; bell icon + dropdown is Phase 2 |
