'use client'

import { useState } from 'react'
import Modal from './Modal'
import OwnerForm from './forms/OwnerForm'

export default function AddOwnerButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
        + Add Owner
      </button>

      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title="Register New Vehicle Owner"
      >
        <OwnerForm onSuccess={() => setIsOpen(false)} />
      </Modal>
    </>
  )
}
