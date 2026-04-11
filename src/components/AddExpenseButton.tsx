'use client'

import { useState } from 'react'
import Modal from './Modal'
import ExpenseForm from './forms/ExpenseForm'

interface AddExpenseButtonProps {
  vehicles: { id: string, plateNo: string }[]
  projects: { id: string, projectName: string }[]
}

export default function AddExpenseButton({ vehicles, projects }: AddExpenseButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)}>
        + Log Expense
      </button>

      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title="Log Operational Expense"
      >
        <ExpenseForm 
          vehicles={vehicles} 
          projects={projects}
          onSuccess={() => setIsOpen(false)} 
        />
      </Modal>
    </>
  )
}
