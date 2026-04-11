'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface LoadingContextType {
  setLoading: (loading: boolean) => void
  isLoading: boolean
}

const LoadingContext = createContext<LoadingContextType>({
  setLoading: () => {},
  isLoading: false,
})

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading: setIsLoading }}>
      {children}
    </LoadingContext.Provider>
  )
}

export const useLoading = () => useContext(LoadingContext)
