'use client'

import { useState } from 'react'
import ProjectRateCalculator from './ProjectRateCalculator'

interface Props {
  projectId: string
  projectName: string
  partyRate: number
  ownerRate: number
}

export default function RateCalculatorButton({ projectId, projectName, partyRate, ownerRate }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Rate Calculator"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
          cursor: 'pointer', border: '1px solid rgba(245,158,11,0.2)',
          background: 'rgba(245,158,11,0.06)', color: '#f59e0b',
          transition: 'all 0.15s ease',
        }}
        onMouseOver={e => { (e.target as HTMLElement).style.background = 'rgba(245,158,11,0.12)' }}
        onMouseOut={e => { (e.target as HTMLElement).style.background = 'rgba(245,158,11,0.06)' }}
      >
        🧮 Rates
      </button>
      {open && (
        <ProjectRateCalculator
          projectId={projectId}
          projectName={projectName}
          partyRate={partyRate}
          ownerRate={ownerRate}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
