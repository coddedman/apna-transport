import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { BillSummary } from './actions/billing'

const fmt = (n: number) => `Rs.${Math.round(n).toLocaleString('en-IN')}`
const fmtD = (s: string) => s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

export function generateBillPdf(bill: BillSummary, ownerName?: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const margin = 14
  const colW = W - margin * 2

  const owners = ownerName
    ? bill.ownerSummaries.filter(o => o.ownerName === ownerName)
    : bill.ownerSummaries

  owners.forEach((owner, oi) => {
    if (oi > 0) doc.addPage()

    // ─── Header ───
    doc.setFillColor(11, 17, 32)
    doc.rect(0, 0, W, 38, 'F')
    doc.setTextColor(245, 158, 11)
    doc.setFontSize(18); doc.setFont('helvetica', 'bold')
    doc.text('SETTLEMENT INVOICE', margin, 16)
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.setTextColor(148, 163, 184)
    doc.text('Hyva Transport Management', margin, 23)
    doc.text(`Period: ${bill.period.label}`, margin, 29)
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, margin, 35)

    // Owner info box
    doc.setFillColor(26, 35, 50)
    doc.roundedRect(margin, 42, colW, 22, 3, 3, 'F')
    doc.setTextColor(245, 158, 11); doc.setFontSize(13); doc.setFont('helvetica', 'bold')
    doc.text(owner.ownerName, margin + 5, 52)
    doc.setTextColor(148, 163, 184); doc.setFontSize(8); doc.setFont('helvetica', 'normal')
    doc.text(`${owner.vehicles.length} vehicle(s)  •  ${owner.vehicles.reduce((a, v) => a + v.totalTrips, 0)} trips  •  ${owner.vehicles.reduce((a, v) => a + v.totalWeight, 0).toFixed(1)} MT`, margin + 5, 59)

    // Summary boxes
    const boxes = [
      { label: 'Gross Payout', value: fmt(owner.totalGross), color: [245, 158, 11] as [number,number,number] },
      { label: 'Deductions', value: fmt(owner.totalDeductions), color: [239, 68, 68] as [number,number,number] },
      { label: 'Net Settlement', value: fmt(owner.totalNet), color: [16, 185, 129] as [number,number,number] },
      { label: 'Balance Due', value: fmt(owner.totalBalanceDue), color: owner.totalBalanceDue < 0 ? [239,68,68] as [number,number,number] : [34, 211, 238] as [number,number,number] },
    ]
    const bW = colW / 4 - 2
    boxes.forEach((b, i) => {
      const x = margin + i * (bW + 2.5)
      doc.setFillColor(17, 24, 39)
      doc.roundedRect(x, 68, bW, 20, 2, 2, 'F')
      doc.setDrawColor(...b.color); doc.setLineWidth(0.5)
      doc.roundedRect(x, 68, bW, 20, 2, 2, 'S')
      doc.setTextColor(...b.color); doc.setFontSize(7); doc.setFont('helvetica', 'bold')
      doc.text(b.label.toUpperCase(), x + 3, 75)
      doc.setFontSize(10)
      doc.text(b.value, x + 3, 83)
    })

    let y = 94

    // ─── Per vehicle ───
    owner.vehicles.forEach(v => {
      // Vehicle header
      doc.setFillColor(30, 41, 59)
      doc.rect(margin, y, colW, 8, 'F')
      doc.setTextColor(241, 245, 249); doc.setFontSize(9); doc.setFont('helvetica', 'bold')
      doc.text(`🚛 ${v.plateNo}   Rate: ${fmt(v.effectiveOwnerRate)}/MT   Trips: ${v.totalTrips}   Weight: ${v.totalWeight.toFixed(1)} MT`, margin + 3, y + 5.5)
      y += 10

      // Trips table
      if (v.trips.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Date', 'Inv/LR', 'Weight (MT)', 'Rate', 'Payout']],
          body: v.trips.map(t => [
            fmtD(t.date), t.invoiceNo || t.lrNo || '—',
            t.weight.toFixed(2), fmt(t.appliedOwnerRate), fmt(t.ownerPayout)
          ]),
          foot: [['', '', `${v.totalWeight.toFixed(2)} MT`, 'GROSS TOTAL', fmt(v.grossPayout)]],
          theme: 'plain',
          styles: { fontSize: 8, cellPadding: 2, textColor: [148, 163, 184], lineColor: [30, 41, 59], lineWidth: 0.1 },
          headStyles: { fillColor: [17, 24, 39], textColor: [100, 116, 139], fontSize: 7, fontStyle: 'bold' },
          footStyles: { fillColor: [17, 24, 39], textColor: [245, 158, 11], fontStyle: 'bold', fontSize: 8 },
          columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right', textColor: [245, 158, 11] } },
          margin: { left: margin, right: margin },
        })
        y = (doc as any).lastAutoTable.finalY + 3
      }

      // Deductions
      if (v.deductions.items.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Deductions', '', 'Amount']],
          body: v.deductions.items.map(d => [fmtD(d.date), d.label + (d.note ? ` (${d.note})` : ''), `-${fmt(d.amount)}`]),
          foot: [['', 'TOTAL DEDUCTIONS', `-${fmt(v.deductions.total)}`]],
          theme: 'plain',
          styles: { fontSize: 8, cellPadding: 2, textColor: [148, 163, 184], lineColor: [30, 41, 59], lineWidth: 0.1 },
          headStyles: { fillColor: [30, 20, 20], textColor: [239, 68, 68], fontSize: 7, fontStyle: 'bold' },
          footStyles: { fillColor: [30, 20, 20], textColor: [239, 68, 68], fontStyle: 'bold', fontSize: 8 },
          columnStyles: { 2: { halign: 'right', textColor: [239, 68, 68] } },
          margin: { left: margin, right: margin },
        })
        y = (doc as any).lastAutoTable.finalY + 3
      }

      // Settlement summary row
      doc.setFillColor(17, 24, 39)
      doc.rect(margin, y, colW, 10, 'F')
      doc.setFontSize(8); doc.setFont('helvetica', 'bold')
      doc.setTextColor(16, 185, 129); doc.text(`Net: ${fmt(v.netSettlement)}`, margin + 5, y + 6.5)
      if (v.previouslyPaid > 0) {
        doc.setTextColor(249, 115, 22); doc.text(`Already Paid: -${fmt(v.previouslyPaid)}`, margin + 50, y + 6.5)
      }
      doc.setTextColor(34, 211, 238); doc.text(`Balance Due: ${fmt(v.balanceDue)}`, W - margin - 45, y + 6.5)
      y += 14

      if (y > 260) { doc.addPage(); y = 14 }
    })

    // Owner Total Footer
    doc.setFillColor(11, 17, 32)
    doc.rect(margin, y, colW, 14, 'F')
    doc.setDrawColor(245, 158, 11); doc.setLineWidth(0.3)
    doc.rect(margin, y, colW, 14, 'S')
    doc.setFontSize(10); doc.setFont('helvetica', 'bold')
    doc.setTextColor(241, 245, 249)
    doc.text(`TOTAL FOR ${owner.ownerName.toUpperCase()}`, margin + 4, y + 5.5)
    doc.setTextColor(245, 158, 11); doc.text(`Gross: ${fmt(owner.totalGross)}`, margin + 4, y + 11)
    doc.setTextColor(239, 68, 68); doc.text(`Ded: ${fmt(owner.totalDeductions)}`, margin + 50, y + 11)
    doc.setTextColor(16, 185, 129); doc.text(`Net: ${fmt(owner.totalNet)}`, margin + 95, y + 11)
    doc.setTextColor(34, 211, 238); doc.text(`Balance Due: ${fmt(owner.totalBalanceDue)}`, W - margin - 50, y + 11)
  })

  doc.save(`settlement_${ownerName?.replace(/\s+/g, '_') ?? 'all'}_${bill.period.end}.pdf`)
}
