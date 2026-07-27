import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { BillSummary } from './actions/billing'

const fmt = (n: number) => `Rs.${Math.round(n).toLocaleString('en-IN')}`
const fmtD = (s: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
// jsPDF's Helvetica font can't render emojis — strip them for clean PDF output
const strip = (s: string) => s.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|[\u200D\uFE0F]/gu, '').trim()

export type PdfMode = 'full' | 'trips' | 'expenses' | 'advances'

const DARK = [11, 17, 32] as const
const DARK2 = [15, 23, 42] as const
const AMBER = [245, 158, 11] as const
const RED = [239, 68, 68] as const
const GREEN = [16, 185, 129] as const
const ORANGE = [249, 115, 22] as const
const CYAN = [34, 211, 238] as const
const GRAY = [100, 116, 139] as const
const LIGHTGRAY = [148, 163, 184] as const
const WHITE = [241, 245, 249] as const

function drawRoundedRect(doc: jsPDF, x: number, y: number, w: number, h: number, fill: readonly [number, number, number], stroke?: readonly [number, number, number]) {
  doc.setFillColor(fill[0], fill[1], fill[2])
  doc.roundedRect(x, y, w, h, 3, 3, 'F')
  if (stroke) {
    doc.setDrawColor(stroke[0], stroke[1], stroke[2])
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, w, h, 3, 3, 'S')
  }
}

function addPageHeader(doc: jsPDF, bill: BillSummary, ownerName: string, subtitle: string) {
  const W = 210, margin = 14

  // Dark header bar
  doc.setFillColor(...DARK)
  doc.rect(0, 0, W, 40, 'F')

  // Gold accent line
  doc.setFillColor(...AMBER)
  doc.rect(0, 40, W, 1.5, 'F')

  // Company name
  doc.setTextColor(...AMBER); doc.setFontSize(18); doc.setFont('helvetica', 'bold')
  doc.text('MAA BHAVANI TRANSPORT', margin, 14)

  // Subtitle
  doc.setFontSize(10); doc.setTextColor(...WHITE)
  doc.text(subtitle, margin, 22)

  // Period & date
  doc.setFontSize(8); doc.setTextColor(...LIGHTGRAY)
  doc.text(`Period: ${bill.period.label}`, margin, 30)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, margin, 36)

  // Owner chip
  let y = 48
  drawRoundedRect(doc, margin, y, W - margin * 2, 16, DARK2, AMBER)
  doc.setTextColor(...AMBER); doc.setFontSize(12); doc.setFont('helvetica', 'bold')
  doc.text(ownerName, margin + 6, y + 11)

  return y + 22
}

function addSummaryBox(doc: jsPDF, owner: any, y: number, margin: number, W: number): number {
  const allAdvTotal = owner.ownerAdvanceItems.reduce((s: number, a: any) => s + a.amount, 0)
  const cf = owner.carryForwardBalance || 0
  const tripCount = owner.vehicles.reduce((a: number, v: any) => a + v.totalTrips, 0)

  // Section title
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...AMBER)
  doc.text('SETTLEMENT SUMMARY', margin, y)
  y += 6

  // Box height depends on carry forward
  const boxH = cf !== 0 ? 82 : 72
  drawRoundedRect(doc, margin, y, W - margin * 2, boxH, DARK2, [40, 50, 70])

  const innerX = margin + 6
  const valX = W - margin - 6
  let ly = y + 10

  // Helper for rows
  const row = (label: string, value: string, labelColor: readonly [number, number, number], valueColor: readonly [number, number, number], bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(bold ? 10 : 9)
    doc.setTextColor(labelColor[0], labelColor[1], labelColor[2])
    doc.text(label, innerX, ly)
    doc.setTextColor(valueColor[0], valueColor[1], valueColor[2])
    doc.setFont('helvetica', 'bold')
    doc.text(value, valX, ly, { align: 'right' })
    ly += bold ? 10 : 8
  }

  row(`[A]  Gross Payout (${tripCount} trips)`, fmt(owner.totalGross), LIGHTGRAY, AMBER)
  row('[B]  Deductions (Fuel, Toll, Maint, etc.)', `-${fmt(owner.totalDeductions)}`, LIGHTGRAY, RED)

  // Separator line
  doc.setDrawColor(60, 70, 90); doc.setLineWidth(0.2)
  doc.line(innerX, ly - 4, valX, ly - 4)

  row('[C]  Net Settlement (A - B)', fmt(owner.totalNet), WHITE, GREEN, true)
  row(`[D]  Advances Paid to Owner`, `-${fmt(owner.ownerAdvanceTotal)}`, LIGHTGRAY, ORANGE)

  if (allAdvTotal !== owner.ownerAdvanceTotal) {
    doc.setFontSize(7); doc.setTextColor(...GRAY); doc.setFont('helvetica', 'normal')
    doc.text(`(Total given: ${fmt(allAdvTotal)}, recovered in prior bills: ${fmt(allAdvTotal - owner.ownerAdvanceTotal)})`, innerX + 18, ly - 4)
  }

  if (cf !== 0) {
    const cfLabel = cf < 0 ? '[E]  Prior Debt Carried Forward' : '[E]  Prior Credit Carried Forward'
    const cfVal = cf < 0 ? `-${fmt(Math.abs(cf))}` : `+${fmt(cf)}`
    row(cfLabel, cfVal, LIGHTGRAY, cf < 0 ? RED : CYAN)
  }

  // Separator — thicker
  doc.setDrawColor(...CYAN); doc.setLineWidth(0.5)
  doc.line(innerX, ly - 4, valX, ly - 4)

  const formulaLabel = cf !== 0 ? 'BALANCE DUE (C - D + E)' : 'BALANCE DUE (C - D)'
  const dueColor = owner.totalBalanceDue < 0 ? RED : CYAN
  row(formulaLabel, fmt(owner.totalBalanceDue), dueColor, dueColor, true)

  return y + boxH + 8
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

    // ── SUMMARY BOX (full mode — at the top) ──
    if (mode === 'full') {
      y = addSummaryBox(doc, owner as any, y, margin, W)
    }

    // ── TRIPS ──
    if (mode === 'trips' || mode === 'full') {
      const allTrips = owner.vehicles.flatMap(v => v.trips.map(t => ({ ...t, plateNo: v.plateNo, rate: v.effectiveOwnerRate })))
      const totalGross = owner.vehicles.reduce((a, v) => a + v.grossPayout, 0)
      const totalWeight = owner.vehicles.reduce((a, v) => a + v.totalWeight, 0)
      const totalTripCount = owner.vehicles.reduce((a, v) => a + v.totalTrips, 0)

      if (y > 230) { doc.addPage(); y = 14 }
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GREEN)
      doc.text('TRIP EARNINGS', margin, y); y += 4

      autoTable(doc, {
        startY: y,
        head: [['#', 'Date', 'Vehicle', 'Inv/LR', 'Weight (MT)', 'Rate', 'Payout']],
        body: allTrips.map((t, i) => [String(i + 1), fmtD(t.date), t.plateNo, t.invoiceNo || t.lrNo || '—', t.weight.toFixed(2), fmt(t.rate), fmt(t.ownerPayout)]),
        foot: [[`Total: ${totalTripCount} trips`, '', '', '', `${totalWeight.toFixed(2)} MT`, 'GROSS', fmt(totalGross)]],
        theme: 'striped',
        styles: { fontSize: 7.5, cellPadding: 2, textColor: [...LIGHTGRAY], lineColor: [30, 40, 55], lineWidth: 0.1 },
        headStyles: { fillColor: [...DARK], textColor: [...GRAY], fontSize: 7, fontStyle: 'bold', halign: 'left' },
        footStyles: { fillColor: [...DARK], textColor: [...AMBER], fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [18, 26, 44] },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center', textColor: [...GRAY] },
          4: { halign: 'right' },
          5: { halign: 'right', textColor: [...GRAY] },
          6: { halign: 'right', textColor: [...AMBER], fontStyle: 'bold' },
        },
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
        doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...RED)
        doc.text('OPERATIONAL EXPENSES / DEDUCTIONS', margin, y); y += 4

        autoTable(doc, {
          startY: y,
          head: [['#', 'Date', 'Vehicle', 'Category', 'Note', 'Amount']],
          body: allExpItems.map((d, i) => [String(i + 1), fmtD(d.date), d.plateNo, strip(d.label), d.note || '—', `-${fmt(d.amount)}`]),
          foot: [['', '', '', '', 'TOTAL DEDUCTIONS', `-${fmt(totalDed)}`]],
          theme: 'striped',
          styles: { fontSize: 7.5, cellPadding: 2, textColor: [...LIGHTGRAY], lineColor: [30, 40, 55], lineWidth: 0.1 },
          headStyles: { fillColor: [35, 15, 15], textColor: [...GRAY], fontSize: 7, fontStyle: 'bold' },
          footStyles: { fillColor: [35, 15, 15], textColor: [...RED], fontStyle: 'bold', fontSize: 8 },
          alternateRowStyles: { fillColor: [25, 15, 18] },
          columnStyles: {
            0: { cellWidth: 8, halign: 'center', textColor: [...GRAY] },
            5: { halign: 'right', textColor: [...RED], fontStyle: 'bold' },
          },
          margin: { left: margin, right: margin },
        })
        y = (doc as any).lastAutoTable.finalY + 8
      } else if (mode === 'expenses') {
        doc.setFontSize(9); doc.setTextColor(...GRAY)
        doc.text('No operational expenses recorded for this period.', margin, y + 10)
      }
    }

    // ── ADVANCES (owner-level, cumulative) ──
    if (mode === 'advances' || mode === 'full') {
      if (owner.ownerAdvanceItems.length > 0) {
        if (y > 230) { doc.addPage(); y = 14 }
        doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ORANGE)
        doc.text('ADVANCES PAID TO OWNER', margin, y); y += 4

        autoTable(doc, {
          startY: y,
          head: [['#', 'Date', 'Type', 'Note', 'Amount']],
          body: owner.ownerAdvanceItems.map((p, i) => [String(i + 1), fmtD(p.date), strip(p.label), p.note || '—', fmt(p.amount)]),
          foot: [['', '', '', 'TOTAL ADVANCES', fmt(owner.ownerAdvanceItems.reduce((s, a) => s + a.amount, 0))]],
          theme: 'striped',
          styles: { fontSize: 7.5, cellPadding: 2, textColor: [...LIGHTGRAY], lineColor: [30, 40, 55], lineWidth: 0.1 },
          headStyles: { fillColor: [35, 22, 8], textColor: [...GRAY], fontSize: 7, fontStyle: 'bold' },
          footStyles: { fillColor: [35, 22, 8], textColor: [...ORANGE], fontStyle: 'bold', fontSize: 8 },
          alternateRowStyles: { fillColor: [28, 20, 10] },
          columnStyles: {
            0: { cellWidth: 8, halign: 'center', textColor: [...GRAY] },
            4: { halign: 'right', textColor: [...ORANGE], fontStyle: 'bold' },
          },
          margin: { left: margin, right: margin },
        })
        y = (doc as any).lastAutoTable.finalY + 8

        // Note about unrecovered vs total
        const allAdvTotal = owner.ownerAdvanceItems.reduce((s, a) => s + a.amount, 0)
        if (allAdvTotal !== owner.ownerAdvanceTotal) {
          doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY)
          doc.text(`Note: Total advances given: ${fmt(allAdvTotal)} | Already recovered in prior settlements: ${fmt(allAdvTotal - owner.ownerAdvanceTotal)} | Unrecovered (deducted this bill): ${fmt(owner.ownerAdvanceTotal)}`, margin, y)
          y += 6
        }
      } else if (mode === 'advances') {
        doc.setFontSize(9); doc.setTextColor(...GRAY)
        doc.text('No advances recorded for this owner.', margin, y + 10)
      }
    }

    // ── SUMMARY BOX (if not full mode — at the bottom for trip/expense/advance-only modes) ──
    if (mode !== 'full') {
      if (y > 220) { doc.addPage(); y = 14 }
      y = addSummaryBox(doc, owner as any, y, margin, W)
    }
  })

  const suffix = mode === 'full' ? 'settlement' : mode === 'trips' ? 'trips' : mode === 'expenses' ? 'expenses' : 'advances'
  const name = ownerName?.replace(/\s+/g, '_') ?? 'all'
  doc.save(`${name}_${suffix}_${bill.period.end || 'bill'}.pdf`)
}
