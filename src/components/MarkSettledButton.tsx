'use client'

import { markSettled } from '@/lib/actions/settlements'
import { useState } from 'react'

import toast from 'react-hot-toast'

export default function MarkSettledButton({ settlementId }: { settlementId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    
    toast.promise(
      markSettled(settlementId),
      {
        loading: 'Marking as settled...',
        success: 'Settlement marked as paid!',
        error: 'Failed to mark as settled'
      }
    ).catch(() => {}).finally(() => setLoading(false))
  }

  return (
    <button className="btn btn-primary btn-sm" onClick={handleClick} disabled={loading}>
      {loading ? '...' : '✓ Mark Settled'}
    </button>
  )
}
