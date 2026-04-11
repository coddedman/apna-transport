'use client'

import { markSettled } from '@/lib/actions/settlements'
import { useState } from 'react'

export default function MarkSettledButton({ settlementId }: { settlementId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      await markSettled(settlementId)
    } catch {
      alert('Failed to mark as settled')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button className="btn btn-primary btn-sm" onClick={handleClick} disabled={loading}>
      {loading ? '...' : '✓ Mark Settled'}
    </button>
  )
}
