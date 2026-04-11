'use client'

import { useState } from 'react'
import Modal from './Modal'
import EditTripForm from './forms/EditTripForm'

interface EditTripButtonProps {
  trip: any
  vehicles: { id: string, plateNo: string }[]
  projects: { id: string, projectName: string }[]
}

export default function EditTripButton({ trip, vehicles, projects }: EditTripButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        className="btn btn-secondary btn-sm" 
        onClick={() => setIsOpen(true)}
        style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        ✏️
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Trip Record">
        <EditTripForm 
          trip={trip} 
          vehicles={vehicles} 
          projects={projects} 
          onSuccess={() => setIsOpen(false)} 
        />
      </Modal>
    </>
  )
}
