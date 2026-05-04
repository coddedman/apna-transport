import Link from 'next/link'

interface Props { vehicle: { id: string; plateNo: string } }

export default function VehicleAnalyticsButton({ vehicle }: Props) {
  return (
    <Link
      href={`/dashboard/vehicles/${vehicle.id}`}
      className="btn btn-secondary btn-sm"
      style={{ fontSize: '11px', padding: '4px 8px', textDecoration: 'none' }}
    >
      📊 Stats
    </Link>
  )
}
