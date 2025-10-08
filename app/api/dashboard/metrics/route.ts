import { NextResponse } from 'next/server'
import { initializeDatabase, getLeads, getReminders } from '@/lib/database'

export async function GET() {
  await initializeDatabase()
  const [leads, reminders] = await Promise.all([getLeads(), getReminders()])

  const todayStr = new Date().toISOString().slice(0, 10)
  const totalLeads = leads.length
  const newLeadsToday = leads.filter((l: any) => {
    const d = l.created_at instanceof Date ? l.created_at : (l.created_at ? new Date(l.created_at) : null)
    if (!d || Number.isNaN(d.getTime())) return false
    return d.toISOString().slice(0, 10) === todayStr
  }).length
  const contacted = leads.filter((l: any) => l.lead_status === 'Contacted').length
  const converted = leads.filter((l: any) => l.lead_status === 'Converted').length
  const notInterested = leads.filter((l: any) => l.lead_status === 'Not Interested').length
  const conversionRate = totalLeads ? Math.round((converted / totalLeads) * 100) : 0

  const sources = ['Website','Social Media','Referral','Advertisement','Walk-in','Phone Call']
  const leadsBySource = sources.map(name => ({
    name,
    value: leads.filter((l: any) => l.inquiry_source === name).length,
    color:
      name === 'Website' ? '#3B82F6' :
      name === 'Social Media' ? '#10B981' :
      name === 'Referral' ? '#F59E0B' :
      name === 'Advertisement' ? '#EF4444' :
      name === 'Walk-in' ? '#8B5CF6' : '#06B6D4'
  }))

  const months = Array.from({ length: 12 }).map((_, idx) => idx)
  const monthly = months.map((idx) => {
    const leadsInMonth = leads.filter((l: any) => {
      const d = l.created_at instanceof Date ? l.created_at : (l.created_at ? new Date(l.created_at) : null)
      return d && !Number.isNaN(d.getTime()) && d.getMonth() === idx
    })
    const conversions = leadsInMonth.filter((l: any) => l.lead_status === 'Converted').length
    return { month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][idx], leads: leadsInMonth.length, conversions }
  })

  const recentLeads = [...leads]
    .sort((a: any, b: any) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .slice(0, 3)

  const pendingTasks = reminders.filter((r: any) => r.status === 'Pending').slice(0, 3)

  return NextResponse.json({
    totals: { totalLeads, newLeadsToday, contacted, converted, notInterested, conversionRate },
    leadsBySource,
    monthly,
    recentLeads,
    pendingTasks,
  })
}


