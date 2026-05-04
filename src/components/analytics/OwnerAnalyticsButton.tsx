import Link from 'next/link'

interface Props { owner: { id: string; ownerName: string } }

export default function OwnerAnalyticsButton({ owner }: Props) {
  return (
    <Link
      href={`/dashboard/owners/${owner.id}`}
      className="btn btn-secondary btn-sm"
      style={{ fontSize: '11px', padding: '4px 8px', textDecoration: 'none' }}
    >
      📊 Analytics
    </Link>
  )
}
