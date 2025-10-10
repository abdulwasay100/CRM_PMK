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
    .slice(0, 15)

  // Get all not completed reminders (Pending + In Progress)
  const notCompletedTasks = reminders.filter((r: any) => r.status === 'Pending' || r.status === 'In Progress')
  
  // Get completed reminders sorted by latest first
  const completedTasks = reminders.filter((r: any) => r.status === 'Completed')
    .sort((a: any, b: any) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
  
  // If not completed < 15, add latest completed to make total 15
  let pendingTasks = [...notCompletedTasks]
  if (notCompletedTasks.length < 15) {
    const needed = 15 - notCompletedTasks.length
    pendingTasks = [...notCompletedTasks, ...completedTasks.slice(0, needed)]
  }

  return NextResponse.json({
    totals: { totalLeads, newLeadsToday, contacted, converted, notInterested, conversionRate },
    leadsBySource,
    monthly,
    recentLeads,
    pendingTasks,
    reminderCategories: {
      pending: reminders.filter((r: any) => r.status === 'Pending'),
      inProgress: reminders.filter((r: any) => r.status === 'In Progress'),
      completed: completedTasks.slice(0, 15) // Latest 15 completed
    }
  })
}


