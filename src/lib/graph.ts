/**
 * Weighted graph utilities for experience routing.
 *
 * Models Kansas City experiences as a graph where:
 *   - Nodes = experiences (with lat/lng, category, avg duration)
 *   - Edges = estimated travel time in minutes between each pair
 *   - Edge weights factor in transition cost (walk vs rideshare)
 *
 * The nearest-neighbor TSP heuristic produces a visit order that
 * minimizes total travel time — used as the backbone of the day sequencer.
 */

export interface GraphNode {
  id: string
  title: string
  lat: number
  lng: number
  category: string
  durationMinutes: number
  priceTier: number | null
  openAt?: string   // "09:00"
  closeAt?: string  // "21:00"
}

export type TransportMode = 'walk' | 'rideshare' | 'drive'

/** Haversine great-circle distance in kilometres. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Estimated travel time in minutes between two nodes. */
export function estimateTravelMinutes(
  a: GraphNode,
  b: GraphNode,
  mode: TransportMode = 'rideshare'
): number {
  const km = haversineKm(a.lat, a.lng, b.lat, b.lng)
  const speeds: Record<TransportMode, number> = {
    walk:      5,   // km/h
    rideshare: 30,
    drive:     35,
  }
  const travelMin = (km / speeds[mode]) * 60
  // Add fixed overhead: rideshare/drive has parking/pickup time
  const overhead = mode === 'walk' ? 2 : 8
  return Math.round(travelMin + overhead)
}

/** Build a full N×N adjacency matrix of travel times (minutes). */
export function buildAdjacencyMatrix(
  nodes: GraphNode[],
  mode: TransportMode = 'rideshare'
): number[][] {
  return nodes.map((a, i) =>
    nodes.map((b, j) => (i === j ? 0 : estimateTravelMinutes(a, b, mode)))
  )
}

/**
 * Nearest-Neighbor TSP heuristic.
 * Returns indices into `nodes` in the recommended visit order.
 * Start from the node closest to the geographic centroid of the set.
 */
export function nearestNeighborTSP(
  nodes: GraphNode[],
  matrix: number[][]
): number[] {
  if (nodes.length === 0) return []
  if (nodes.length === 1) return [0]

  // Find centroid
  const centLat = nodes.reduce((s, n) => s + n.lat, 0) / nodes.length
  const centLng = nodes.reduce((s, n) => s + n.lng, 0) / nodes.length
  const startIdx = nodes.reduce(
    (best, n, i) => {
      const d = haversineKm(centLat, centLng, n.lat, n.lng)
      return d < best.d ? { i, d } : best
    },
    { i: 0, d: Infinity }
  ).i

  const visited = new Set<number>()
  const tour: number[] = [startIdx]
  visited.add(startIdx)

  while (visited.size < nodes.length) {
    const last = tour[tour.length - 1]
    let nearest = -1
    let nearestDist = Infinity
    for (let j = 0; j < nodes.length; j++) {
      if (!visited.has(j) && matrix[last][j] < nearestDist) {
        nearestDist = matrix[last][j]
        nearest = j
      }
    }
    if (nearest === -1) break
    tour.push(nearest)
    visited.add(nearest)
  }

  return tour
}

/** High-level: given a list of nodes + transport mode, return ordered nodes. */
export function optimizeVisitOrder(
  nodes: GraphNode[],
  mode: TransportMode = 'rideshare'
): { orderedNodes: GraphNode[]; travelTimes: number[]; totalTravelMinutes: number } {
  if (nodes.length === 0) return { orderedNodes: [], travelTimes: [], totalTravelMinutes: 0 }
  const matrix = buildAdjacencyMatrix(nodes, mode)
  const order  = nearestNeighborTSP(nodes, matrix)
  const orderedNodes = order.map(i => nodes[i])
  const travelTimes: number[] = []
  let totalTravelMinutes = 0
  for (let i = 0; i < order.length - 1; i++) {
    const t = matrix[order[i]][order[i + 1]]
    travelTimes.push(t)
    totalTravelMinutes += t
  }
  return { orderedNodes, travelTimes, totalTravelMinutes }
}
