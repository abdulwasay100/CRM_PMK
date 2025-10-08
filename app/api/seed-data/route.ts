import { NextResponse } from 'next/server'
import { initializeDatabase, createLead } from '@/lib/database'

export async function POST() {
  try {
    await initializeDatabase()
    
    // Sample leads data
    const sampleLeads = [
      {
        full_name: 'Abdul Rahman',
        parent_name: 'Muhammad Ali',
        phone: '923119811131',
        email: 'abdul.rahman@email.com',
        city: 'Karachi',
        age: 15,
        interested_course: 'Math',
        inquiry_source: 'Website',
        notes: 'Interested in advanced mathematics'
      },
      {
        full_name: 'Ahmad Islam',
        parent_name: 'Hassan Khan',
        phone: '923119811132',
        email: 'ahmad.islam@email.com',
        city: 'Lahore',
        age: 14,
        interested_course: 'Science',
        inquiry_source: 'Social Media',
        notes: 'Very interested in physics'
      },
      {
        full_name: 'Abdul Bar',
        parent_name: 'Ali Ahmed',
        phone: '923119811133',
        email: 'abdul.bar@email.com',
        city: 'Islamabad',
        age: 16,
        interested_course: 'English',
        inquiry_source: 'Referral',
        notes: 'Needs help with English literature'
      },
      {
        full_name: 'Fatima Khan',
        parent_name: 'Muhammad Khan',
        phone: '923119811134',
        email: 'fatima.khan@email.com',
        city: 'Karachi',
        age: 13,
        interested_course: 'Programming',
        inquiry_source: 'Advertisement',
        notes: 'Wants to learn coding'
      },
      {
        full_name: 'Hassan Ali',
        parent_name: 'Ahmed Hassan',
        phone: '923119811135',
        email: 'hassan.ali@email.com',
        city: 'Lahore',
        age: 17,
        interested_course: 'Art',
        inquiry_source: 'Walk-in',
        notes: 'Artistic student looking for guidance'
      }
    ]

    // Check if leads already exist
    const { pool } = await import('@/lib/database')
    const [existingLeads] = await pool.execute('SELECT COUNT(*) as count FROM leads')
    const count = (existingLeads as any[])[0].count

    if (count > 0) {
      return NextResponse.json({ 
        message: 'Sample data already exists', 
        count 
      })
    }

    // Insert sample leads
    const results = []
    for (const lead of sampleLeads) {
      const result = await createLead(lead)
      results.push(result)
    }

    // Convert some leads to test the functionality
    const { convertLead } = await import('@/lib/database')
    try {
      // Convert first lead (Abdul Rahman)
      await convertLead(results[0].id)
      console.log('✅ Converted Abdul Rahman')
      
      // Convert third lead (Abdul Bar) 
      await convertLead(results[2].id)
      console.log('✅ Converted Abdul Bar')
    } catch (error) {
      console.log('Note: Some leads may already be converted')
    }

    return NextResponse.json({ 
      message: 'Sample data created successfully', 
      leads: results 
    })

  } catch (error) {
    console.error('Error creating sample data:', error)
    return NextResponse.json(
      { error: 'Failed to create sample data' },
      { status: 500 }
    )
  }
}
