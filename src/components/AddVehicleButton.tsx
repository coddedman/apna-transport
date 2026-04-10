'use client'

import { useState } from 'react'
import Modal from './Modal'
import VehicleForm from './forms/VehicleForm'

interface AddVehicleButtonProps {
  owners: { id: string, ownerName: string }[]
  projects: { id: string, projectName: string }[]
}

export default function AddVehicleButton({ owners, projects }: AddVehicleButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
        + Register Vehicle
      </button>

      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title="Register New Fleet Vehicle"
      >
        <VehicleForm 
          owners={owners} 
          projects={projects} 
          onSuccess={() => setIsOpen(false)} 
        />
      </Modal>
    </>
  )
}
