'use client'

import { useEffect, useState, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useLoading } from '@/lib/context/LoadingContext'

function PageLoaderInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isLoading, setLoading } = useLoading()
  const [navigating, setNavigating] = useState(false)

  // Combined loading state
  const showLoader = isLoading || navigating

  useEffect(() => {
    // Whenever pathname or searchParams change, the navigation has completed
    setNavigating(false)
  }, [pathname, searchParams])

  useEffect(() => {
    // Intercept all link clicks to show the loading bar immediately
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')

      if (
        anchor && 
        anchor.href && 
        anchor.href.startsWith(window.location.origin) && 
        !anchor.target &&
        anchor.getAttribute('download') === null &&
        anchor.href !== window.location.href
      ) {
        setNavigating(true)
      }
    }

    document.addEventListener('click', handleAnchorClick)
    return () => document.removeEventListener('click', handleAnchorClick)
  }, [])

  if (!showLoader) return null

  return (
    <div className="global-page-loader">
      <div className="global-page-loader-bar" />
      <style jsx>{`
        .global-page-loader {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          z-index: 10000;
          background: rgba(245, 158, 11, 0.05);
          overflow: hidden;
        }
        .global-page-loader-bar {
          height: 100%;
          background: linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b);
          background-size: 200% 100%;
          width: 100%;
          animation: loading-bar-progress 2s cubic-bezier(0.4, 0, 0.2, 1) infinite,
                     loading-bar-shimmer 1.5s linear infinite;
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
        }
        @keyframes loading-bar-progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(-30%); }
          100% { transform: translateX(0); }
        }
        @keyframes loading-bar-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

export default function PageLoader() {
  return (
    <Suspense fallback={null}>
      <PageLoaderInner />
    </Suspense>
  )
}
