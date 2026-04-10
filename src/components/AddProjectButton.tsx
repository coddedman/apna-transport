'use client'

import { useState } from 'react'
import Modal from './Modal'
import ProjectForm from './forms/ProjectForm'

export default function AddProjectButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
        + Create Project
      </button>

      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title="Create New Project Site"
      >
        <ProjectForm onSuccess={() => setIsOpen(false)} />
      </Modal>
    </>
  )
}
