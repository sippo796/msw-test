'use client'

import { useEffect } from 'react'

export function MSWProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('../mocks/fetchMock').then(({ enableFetchMocking }) => {
        enableFetchMocking()
      })
    }
  }, [])

  return <>{children}</>
}