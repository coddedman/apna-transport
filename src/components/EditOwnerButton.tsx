'use client'

import { useState } from 'react'
import Modal from './Modal'
import EditOwnerForm from './forms/EditOwnerForm'

interface EditOwnerButtonProps {
  owner: {
    id: string
    ownerName: string
    phone: string
    defaultPassword: string | null
    mustChangePassword: boolean | null
    user: { email: string } | null
  }
}

export default function EditOwnerButton({ owner }: EditOwnerButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        className="btn btn-secondary btn-sm" 
        onClick={() => setIsOpen(true)}
        style={{ fontSize: '12px', padding: '4px 12px' }}
      >
        ✏️ Edit
      </button>

      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title={`Edit Owner — ${owner.ownerName}`}
      >
        <EditOwnerForm 
          owner={owner} 
          onSuccess={() => setIsOpen(false)} 
        />
      </Modal>
    </>
  )
}
