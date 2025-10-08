'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in, if not redirect to login
    router.push('/login')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">CRM PMK</h1>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}
