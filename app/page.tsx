'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/AppLayout'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard on load
    router.push('/dashboard')
  }, [router])

  return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">CRM PMK</h1>
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    </AppLayout>
  )
}
