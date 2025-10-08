'use client'

import { AppLayout } from '@/components/layout/AppLayout'
import dynamic from 'next/dynamic'

const Dashboard = dynamic(() => import('@/pages/Dashboard'), {
  ssr: false,
})

export default function DashboardPage() {
  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  )
}
