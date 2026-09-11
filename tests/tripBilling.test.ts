import { test } from 'node:test'
import assert from 'node:assert/strict'
import { billingPeriod, summarizeTrips, validateTripSelection } from '../src/lib/finance/tripBilling'

test('invoice total preserves mixed trip rates instead of using an average rounded rate', () => {
  const result = summarizeTrips([{ weight: 10.123, partyFreightAmount: 1341.2975 }, { weight: 22.456, partyFreightAmount: 3098.928 }])
  assert.deepEqual(result, { totalTrips: 2, totalWeight: 32.579, billAmount: 4440.23 })
})
test('empty selection cannot create an invoice', () => {
  assert.throws(() => validateTripSelection([], ['t1']), /at least one/)
})
test('duplicate, already claimed, foreign-project and out-of-period IDs are rejected', () => {
  assert.throws(() => validateTripSelection(['t1', 't1'], ['t1']), /twice/)
  for (const unavailable of ['claimed', 'foreign-project', 'outside-period']) {
    assert.throws(() => validateTripSelection(['t1', unavailable], ['t1', 't2']), /no longer available/)
  }
  assert.doesNotThrow(() => validateTripSelection(['t2'], ['t1', 't2']))
})
test('billing periods include the entire final day and exclude the next day', () => {
  const range = billingPeriod('2026-09-01', '2026-09-11')
  assert.equal(range.gte.toISOString(), '2026-09-01T00:00:00.000Z')
  assert.equal(range.lt.toISOString(), '2026-09-12T00:00:00.000Z')
  assert.throws(() => billingPeriod('2026-09-12', '2026-09-11'), /on or after/)
  assert.throws(() => billingPeriod('2026-02-30', '2026-03-01'), /valid date/)
})
