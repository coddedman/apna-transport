'use client'

import { deleteTrip } from '@/lib/actions/trips'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface DeleteTripButtonProps {
  tripId: string
  vehiclePlate: string
}

export default function DeleteTripButton({ tripId, vehiclePlate }: DeleteTripButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    toast.promise(
      deleteTrip(tripId),
      {
        loading: 'Deleting trip...',
        success: 'Trip deleted',
        error: (err) => err.message || 'Failed to delete',
      }
    ).catch(() => {}).finally(() => {
      setLoading(false)
      setConfirming(false)
    })
  }

  if (confirming) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '11px', color: 'var(--color-danger)' }}>Delete?</span>
        <button
          className="btn btn-sm"
          onClick={handleDelete}
          disabled={loading}
          style={{
            fontSize: '11px', padding: '2px 8px',
            background: 'var(--color-danger)', color: '#fff', border: 'none',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          }}
        >
          {loading ? '...' : 'Yes'}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setConfirming(false)}
          style={{ fontSize: '11px', padding: '2px 8px' }}
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      className="btn btn-secondary btn-sm"
      onClick={() => setConfirming(true)}
      title={`Delete trip for ${vehiclePlate}`}
      style={{ fontSize: '12px', padding: '4px 8px' }}
    >
      🗑️
    </button>
  )
}
