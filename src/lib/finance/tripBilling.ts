import { money, validDate } from './receivables'

export function billingPeriod(start: string, end: string) {
  const from = validDate(start, 'Period start')
  const through = validDate(end, 'Period end')
  if (from > through) throw new Error('Period end must be on or after period start')
  return { gte: from, lt: new Date(through.getTime() + 86400000) }
}

export function summarizeTrips(trips: { weight: number; partyFreightAmount: number }[]) {
  return {
    totalTrips: trips.length,
    totalWeight: Math.round(trips.reduce((sum, trip) => sum + trip.weight, 0) * 1000000) / 1000000,
    billAmount: money(trips.reduce((sum, trip) => sum + trip.partyFreightAmount, 0)),
  }
}

export function validateTripSelection(ids: string[], eligibleIds: string[]) {
  if (!ids.length) throw new Error('Select at least one unbilled trip')
  if (new Set(ids).size !== ids.length) throw new Error('A trip cannot be selected twice')
  const available = new Set(eligibleIds)
  if (ids.some(id => !available.has(id))) throw new Error('Some trips are no longer available. Reload unbilled trips and try again.')
}
