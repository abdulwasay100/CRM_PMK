'use client'

import { AppLayout } from '@/components/layout/AppLayout'
import dynamic from 'next/dynamic'

const Reports = dynamic(() => import('@/pages/Reports'), {
  ssr: false,
})

export default function ReportsPage() {
  return (
    <AppLayout>
      <Reports />
    </AppLayout>
  )
}
