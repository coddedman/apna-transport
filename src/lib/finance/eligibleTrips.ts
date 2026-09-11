import type { Prisma } from '@prisma/client'
import { billingPeriod } from './tripBilling'

export async function eligibleTrips(tx: Prisma.TransactionClient, transporterId: string, projectId?: string, period?: { start: string; end: string }) {
  const legacyBills = await tx.partyBill.findMany({
    where: { transporterId, tripLinked: false, billType: 'FREIGHT', ...(projectId ? { projectId } : {}) },
    select: { projectId: true, periodStart: true, periodEnd: true },
  })
  return tx.trip.findMany({
    where: {
      partyBillId: null,
      project: { transporterId },
      ...(projectId ? { projectId } : {}),
      ...(period ? { date: billingPeriod(period.start, period.end) } : {}),
      // Legacy invoices may already cover these trips. Hold them for reconciliation.
      NOT: legacyBills.map(bill => ({ projectId: bill.projectId, date: billingPeriod(bill.periodStart.toISOString().slice(0, 10), bill.periodEnd.toISOString().slice(0, 10)) })),
    },
    select: { id: true, date: true, weight: true, partyFreightAmount: true, invoiceNo: true, lrNo: true, projectId: true, project: { select: { projectName: true } }, vehicle: { select: { plateNo: true } } },
    orderBy: [{ date: 'asc' }, { id: 'asc' }],
  })
}
