'use client'
import { useEffect } from 'react'

export function ThemePreference() {
  useEffect(() => {
    try { document.documentElement.dataset.theme = localStorage.getItem('apna-theme') === 'dark' ? 'dark' : 'light' } catch { /* Storage is optional. */ }
  }, [])
  return null
}

export default function ThemeControl() {
  return <button type="button" className="theme-control" aria-label="Toggle light or dark theme" title="Toggle theme" onClick={() => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('apna-theme', theme) } catch { /* Theme still works without storage. */ }
  }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20 15.5A8.5 8.5 0 018.5 4 8.5 8.5 0 1020 15.5Z" /></svg></button>
}
