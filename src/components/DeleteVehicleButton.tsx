'use client'

import { deleteVehicle } from '@/lib/actions/vehicles'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface DeleteVehicleButtonProps {
  vehicleId: string
  plateNo: string
  tripCount: number
  expenseCount: number
}

export default function DeleteVehicleButton({ vehicleId, plateNo, tripCount, expenseCount }: DeleteVehicleButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  const hasData = tripCount > 0 || expenseCount > 0

  async function handleDelete() {
    setLoading(true)
    toast.promise(
      deleteVehicle(vehicleId),
      {
        loading: 'Deleting vehicle...',
        success: 'Vehicle deleted',
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
      disabled={hasData}
      title={hasData ? `Has ${tripCount} trip(s), ${expenseCount} expense(s)` : `Delete ${plateNo}`}
      style={{
        fontSize: '12px', padding: '4px 8px',
        opacity: hasData ? 0.4 : 1,
        cursor: hasData ? 'not-allowed' : 'pointer',
      }}
    >
      🗑️
    </button>
  )
}
