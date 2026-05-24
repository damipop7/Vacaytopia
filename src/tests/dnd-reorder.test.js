import { describe, it, expect } from 'vitest'
import { arrayMove } from '@dnd-kit/sortable'

// Pure reorder logic extracted from handleReorder in TripDashboard
function computeReorder(slotExps, activeId, overId) {
  if (!overId || activeId === overId) return null
  const oldIndex = slotExps.findIndex(e => e.id === activeId)
  const newIndex  = slotExps.findIndex(e => e.id === overId)
  if (oldIndex === -1 || newIndex === -1) return null
  const reordered = arrayMove(slotExps, oldIndex, newIndex)
  return reordered.map((exp, i) => ({ id: exp.id, sortOrder: i }))
}

function makeExps(ids) {
  return ids.map((id, i) => ({ id, sort_order: i, time_slot: 'morning', day_number: 1 }))
}

describe('computeReorder', () => {
  it('returns null when active and over are the same', () => {
    const exps = makeExps(['a', 'b', 'c'])
    expect(computeReorder(exps, 'a', 'a')).toBeNull()
  })

  it('returns null when over is null/undefined', () => {
    const exps = makeExps(['a', 'b', 'c'])
    expect(computeReorder(exps, 'a', null)).toBeNull()
    expect(computeReorder(exps, 'a', undefined)).toBeNull()
  })

  it('returns null when activeId is not in the list', () => {
    const exps = makeExps(['a', 'b'])
    expect(computeReorder(exps, 'z', 'a')).toBeNull()
  })

  it('moves first item to last position', () => {
    const exps = makeExps(['a', 'b', 'c'])
    const updates = computeReorder(exps, 'a', 'c')
    expect(updates).toEqual([
      { id: 'b', sortOrder: 0 },
      { id: 'c', sortOrder: 1 },
      { id: 'a', sortOrder: 2 },
    ])
  })

  it('moves last item to first position', () => {
    const exps = makeExps(['a', 'b', 'c'])
    const updates = computeReorder(exps, 'c', 'a')
    expect(updates).toEqual([
      { id: 'c', sortOrder: 0 },
      { id: 'a', sortOrder: 1 },
      { id: 'b', sortOrder: 2 },
    ])
  })

  it('swaps two adjacent items', () => {
    const exps = makeExps(['a', 'b', 'c'])
    const updates = computeReorder(exps, 'b', 'c')
    expect(updates).toEqual([
      { id: 'a', sortOrder: 0 },
      { id: 'c', sortOrder: 1 },
      { id: 'b', sortOrder: 2 },
    ])
  })

  it('returns consecutive sort_orders starting from 0', () => {
    const exps = makeExps(['x', 'y', 'z', 'w'])
    const updates = computeReorder(exps, 'z', 'x')
    const sortOrders = updates.map(u => u.sortOrder)
    expect(sortOrders).toEqual([0, 1, 2, 3])
  })

  it('update list covers all items in the slot', () => {
    const exps = makeExps(['a', 'b', 'c', 'd'])
    const updates = computeReorder(exps, 'a', 'd')
    expect(updates).toHaveLength(4)
    expect(updates.map(u => u.id).sort()).toEqual(['a', 'b', 'c', 'd'])
  })
})
