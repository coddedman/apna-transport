import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { BillSummary } from './actions/billing'

const fmt = (n: number) => `Rs.${Math.round(n).toLocaleString('en-IN')}`
const fmtD = (s: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

export type PdfMode = 'full' | 'trips' | 'expenses' | 'advances'

function addPageHeader(doc: jsPDF, bill: BillSummary, ownerName: string, subtitle: string) {
  const W = 210, margin = 14
  doc.setFillColor(11, 17, 32)
  doc.rect(0, 0, W, 36, 'F')
  doc.setTextColor(245, 158, 11); doc.setFontSize(16); doc.setFont('helvetica', 'bold')
  doc.text('HYVA TRANSPORT', margin, 13)
  doc.setFontSize(10); doc.setTextColor(241, 245, 249)
  doc.text(subtitle, margin, 21)
  doc.setFontSize(8); doc.setTextColor(148, 163, 184)
  doc.text(`Period: ${bill.period.label}`, margin, 28)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, margin, 34)

  // Owner chip
  doc.setFillColor(26, 35, 50)
  doc.roundedRect(margin, 40, W - margin * 2, 14, 2, 2, 'F')
  doc.setTextColor(245, 158, 11); doc.setFontSize(11); doc.setFont('helvetica', 'bold')
  doc.text(ownerName, margin + 4, 50)
  return 60 // return next Y
}

export function generateBillPdf(bill: BillSummary, ownerName?: string, mode: PdfMode = 'full') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, margin = 14

  const modeLabel: Record<PdfMode, string> = {
    full: 'Full Settlement Invoice',
    trips: 'Trip Earnings Statement',
    expenses: 'Operational Expenses Statement',
    advances: 'Advance Payment Statement',
  }

  const owners = ownerName
    ? bill.ownerSummaries.filter(o => o.ownerName === ownerName)
    : bill.ownerSummaries

  owners.forEach((owner, oi) => {
    if (oi > 0) doc.addPage()
    let y = addPageHeader(doc, bill, owner.ownerName, modeLabel[mode])

    // ── TRIPS ──
    if (mode === 'trips' || mode === 'full') {
      const allTrips = owner.vehicles.flatMap(v => v.trips.map(t => ({ ...t, plateNo: v.plateNo, rate: v.effectiveOwnerRate })))
      const totalGross = owner.vehicles.reduce((a, v) => a + v.grossPayout, 0)
      const totalWeight = owner.vehicles.reduce((a, v) => a + v.totalWeight, 0)

      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(16, 185, 129)
      doc.text('TRIP EARNINGS', margin, y); y += 4

      autoTable(doc, {
        startY: y,
        head: [['Date', 'Vehicle', 'Inv/LR', 'Weight (MT)', 'Rate', 'Payout']],
        body: allTrips.map(t => [fmtD(t.date), t.plateNo, t.invoiceNo || t.lrNo || '—', t.weight.toFixed(2), fmt(t.rate), fmt(t.ownerPayout)]),
        foot: [['', '', '', `${totalWeight.toFixed(2)} MT`, 'GROSS TOTAL', fmt(totalGross)]],
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 2.5, textColor: [100, 116, 139] },
        headStyles: { fillColor: [15, 23, 42], textColor: [71, 85, 105], fontSize: 7, fontStyle: 'bold' },
        footStyles: { fillColor: [15, 23, 42], textColor: [245, 158, 11], fontStyle: 'bold' },
        columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right', textColor: [245, 158, 11] } },
        margin: { left: margin, right: margin },
      })
      y = (doc as any).lastAutoTable.finalY + 8
    }

    // ── EXPENSES ──
    if (mode === 'expenses' || mode === 'full') {
      const allExpItems = owner.vehicles.flatMap(v => v.deductions.items.map(d => ({ ...d, plateNo: v.plateNo })))
      const totalDed = owner.vehicles.reduce((a, v) => a + v.deductions.total, 0)

      if (allExpItems.length > 0) {
        if (y > 230) { doc.addPage(); y = 14 }
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(239, 68, 68)
        doc.text('OPERATIONAL EXPENSES / DEDUCTIONS', margin, y); y += 4

        autoTable(doc, {
          startY: y,
          head: [['Date', 'Vehicle', 'Category', 'Note', 'Amount']],
          body: allExpItems.map(d => [fmtD(d.date), d.plateNo, d.label, d.note || '—', `-${fmt(d.amount)}`]),
          foot: [['', '', '', 'TOTAL DEDUCTIONS', `-${fmt(totalDed)}`]],
          theme: 'plain',
          styles: { fontSize: 8, cellPadding: 2.5, textColor: [100, 116, 139] },
          headStyles: { fillColor: [30, 10, 10], textColor: [71, 85, 105], fontSize: 7, fontStyle: 'bold' },
          footStyles: { fillColor: [30, 10, 10], textColor: [239, 68, 68], fontStyle: 'bold' },
          columnStyles: { 4: { halign: 'right', textColor: [239, 68, 68] } },
          margin: { left: margin, right: margin },
        })
        y = (doc as any).lastAutoTable.finalY + 8
      } else if (mode === 'expenses') {
        doc.setFontSize(9); doc.setTextColor(100, 116, 139)
        doc.text('No operational expenses recorded for this period.', margin, y + 10)
      }
    }

    // ── ADVANCES (owner-level, cumulative) ──
    if (mode === 'advances' || mode === 'full') {
      if (owner.ownerAdvanceItems.length > 0) {
        if (y > 230) { doc.addPage(); y = 14 }
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(249, 115, 22)
        doc.text('ADVANCES PAID TO OWNER (ALL TIME)', margin, y); y += 4

        autoTable(doc, {
          startY: y,
          head: [['Date', 'Type', 'Note', 'Amount']],
          body: owner.ownerAdvanceItems.map(p => [fmtD(p.date), p.label, p.note || '—', `-${fmt(p.amount)}`]),
          foot: [['', '', 'TOTAL ADVANCES', `-${fmt(owner.ownerAdvanceTotal)}`]],
          theme: 'plain',
          styles: { fontSize: 8, cellPadding: 2.5, textColor: [100, 116, 139] },
          headStyles: { fillColor: [30, 18, 5], textColor: [71, 85, 105], fontSize: 7, fontStyle: 'bold' },
          footStyles: { fillColor: [30, 18, 5], textColor: [249, 115, 22], fontStyle: 'bold' },
          columnStyles: { 3: { halign: 'right', textColor: [249, 115, 22] } },
          margin: { left: margin, right: margin },
        })
        y = (doc as any).lastAutoTable.finalY + 8
      } else if (mode === 'advances') {
        doc.setFontSize(9); doc.setTextColor(100, 116, 139)
        doc.text('No advances recorded for this owner.', margin, y + 10)
      }
    }

    // ── SUMMARY (full mode only) ──
    if (mode === 'full') {
      if (y > 220) { doc.addPage(); y = 14 }
      const gross = owner.totalGross, ded = owner.totalDeductions, net = owner.totalNet, paid = owner.ownerAdvanceTotal, due = owner.totalBalanceDue
      doc.setFillColor(11, 17, 32)
      doc.roundedRect(margin, y, W - margin * 2, 32, 3, 3, 'F')
      doc.setDrawColor(245, 158, 11); doc.setLineWidth(0.4)
      doc.roundedRect(margin, y, W - margin * 2, 32, 3, 3, 'S')

      doc.setFontSize(8); doc.setFont('helvetica', 'bold')
      const cols = [
        { label: 'Gross Payout', val: fmt(gross), color: [245, 158, 11] as [number,number,number] },
        { label: 'Deductions', val: `-${fmt(ded)}`, color: [239, 68, 68] as [number,number,number] },
        { label: 'Net Settlement', val: fmt(net), color: [16, 185, 129] as [number,number,number] },
        { label: 'Advances Paid', val: `-${fmt(paid)}`, color: [249, 115, 22] as [number,number,number] },
        { label: 'BALANCE DUE', val: fmt(due), color: due < 0 ? [239, 68, 68] as [number,number,number] : [34, 211, 238] as [number,number,number] },
      ]
      cols.forEach((c, i) => {
        const x = margin + 5 + i * 36
        doc.setTextColor(100, 116, 139); doc.text(c.label, x, y + 11)
        doc.setTextColor(...c.color); doc.setFontSize(9); doc.text(c.val, x, y + 20)
        doc.setFontSize(8)
      })
    }
  })

  const suffix = mode === 'full' ? 'settlement' : mode === 'trips' ? 'trips' : mode === 'expenses' ? 'expenses' : 'advances'
  const name = ownerName?.replace(/\s+/g, '_') ?? 'all'
  doc.save(`${name}_${suffix}_${bill.period.end || 'bill'}.pdf`)
}
