'use client'

import { useState } from 'react'
import Modal from './Modal'
import EditProjectForm from './forms/EditProjectForm'

export default function EditProjectButton({ project }: { project: any }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        className="btn btn-secondary btn-sm" 
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(true)
        }}
        style={{ padding: '4px 8px', fontSize: '11px', flex: 1, justifyContent: 'center' }}
      >
        ✏️ Edit
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit Project">
        <EditProjectForm project={project} onSuccess={() => setIsOpen(false)} />
      </Modal>
    </>
  )
}
