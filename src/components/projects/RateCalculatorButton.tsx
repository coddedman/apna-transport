import Link from 'next/link'

interface Props {
  projectId: string
}

export default function RateCalculatorButton({ projectId }: Props) {
  return (
    <Link
      href={`/dashboard/projects/${projectId}`}
      title="Rate Calculator"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
        cursor: 'pointer', border: '1px solid rgba(245,158,11,0.2)',
        background: 'rgba(245,158,11,0.06)', color: '#f59e0b',
        transition: 'all 0.15s ease', textDecoration: 'none',
      }}
    >
      🧮 Rates
    </Link>
  )
}
