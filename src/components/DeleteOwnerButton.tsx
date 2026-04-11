'use client'

import { deleteOwner } from '@/lib/actions/owners'
import { useState } from 'react'

import toast from 'react-hot-toast'

interface DeleteOwnerButtonProps {
  ownerId: string
  ownerName: string
  vehicleCount: number
}

export default function DeleteOwnerButton({ ownerId, ownerName, vehicleCount }: DeleteOwnerButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    
    toast.promise(
      deleteOwner(ownerId),
      {
        loading: 'Deleting owner...',
        success: 'Owner deleted globally',
        error: (err) => {
          setError(err.message || 'Failed to delete')
          return err.message || 'Failed to delete'
        }
      }
    ).catch(() => {}).finally(() => setLoading(false))
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '11px', color: 'var(--color-danger)', maxWidth: '140px', lineHeight: '1.3' }}>{error}</span>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => { setError(null); setConfirming(false) }}
          style={{ fontSize: '11px', padding: '2px 8px' }}
        >
          OK
        </button>
      </div>
    )
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
      disabled={vehicleCount > 0}
      title={vehicleCount > 0 ? `Remove ${vehicleCount} vehicle(s) first` : `Delete ${ownerName}`}
      style={{ 
        fontSize: '12px', padding: '4px 12px',
        opacity: vehicleCount > 0 ? 0.4 : 1,
        cursor: vehicleCount > 0 ? 'not-allowed' : 'pointer',
      }}
    >
      🗑️
    </button>
  )
}
