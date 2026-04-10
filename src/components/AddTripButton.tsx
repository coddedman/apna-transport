'use client'

import { useState } from 'react'
import Modal from './Modal'
import TripForm from './forms/TripForm'

interface AddTripButtonProps {
  vehicles: { id: string, plateNo: string }[]
  projects: { id: string, projectName: string }[]
}

export default function AddTripButton({ vehicles, projects }: AddTripButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
        + Log New Trip
      </button>

      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title="Log Operational Trip Record"
      >
        <TripForm 
          vehicles={vehicles} 
          projects={projects} 
          onSuccess={() => setIsOpen(false)} 
        />
      </Modal>
    </>
  )
}
