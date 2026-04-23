'use client'

interface ExportCSVButtonProps {
  data: Array<Record<string, any>>
  filename: string
  columns: { key: string; label: string }[]
}

export default function ExportCSVButton({ data, filename, columns }: ExportCSVButtonProps) {
  function handleExport() {
    if (data.length === 0) return

    const header = columns.map(c => c.label).join(',')
    const rows = data.map(row =>
      columns.map(c => {
        const val = row[c.key]
        // Escape commas and quotes in CSV values
        const str = String(val ?? '')
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
      }).join(',')
    )

    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      className="btn btn-secondary btn-sm"
      onClick={handleExport}
      disabled={data.length === 0}
      title={data.length === 0 ? 'No data to export' : `Export ${data.length} rows`}
    >
      📥 Export CSV
    </button>
  )
}
