import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, sendBulkEmails, testEmailConnection, emailTemplates } from '@/lib/email-service';
import { getLeadsByGroup, getLeadById } from '@/lib/database';

// POST /api/email/send - Send single email
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Email API received:', body);
    const { type, to, subject, message, template, leadId, groupId, attachments, recipients } = body;

    if (type === 'single') {
      // Send to single recipient
      const success = await sendEmail({
        to,
        subject,
        html: message,
        attachments
      });

      return NextResponse.json({ success, message: success ? 'Email sent successfully' : 'Failed to send email' });
    }

    if (type === 'bulk') {
      // Send to multiple recipients
      let emailRecipients = [];

      // If recipients are provided directly (from Quick Message)
      if (recipients && recipients.length > 0) {
        emailRecipients = recipients;
      } else if (groupId) {
        // Get leads from group
        const leads = await getLeadsByGroup(groupId);
        emailRecipients = leads.map(lead => ({
          email: lead.email,
          name: lead.full_name || lead.name
        }));
      } else if (leadId) {
        // Get single lead
        const lead = await getLeadById(leadId);
        if (lead) {
          emailRecipients = [{
            email: lead.email,
            name: lead.full_name || lead.name
          }];
        }
      }

      if (emailRecipients.length === 0) {
        return NextResponse.json({ success: false, message: 'No recipients found' }, { status: 400 });
      }

      // Use template if specified
      let emailContent = message;
      if (template && template !== 'custom' && emailTemplates[template as keyof typeof emailTemplates]) {
        const templateFunction = emailTemplates[template as keyof typeof emailTemplates];
        // For now, use the message as template functions require parameters
        // TODO: Implement proper template parameter handling
        emailContent = message;
      }

      const result = await sendBulkEmails({
        recipients: emailRecipients,
        subject,
        html: emailContent,
        attachments
      });

      return NextResponse.json({
        success: result.success > 0,
        message: `Sent ${result.success} emails successfully, ${result.failed} failed`,
        details: result
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid email type' }, { status: 400 });

  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/email/test - Test email connection
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'test') {
      const isConnected = await testEmailConnection();
      return NextResponse.json({ 
        success: isConnected, 
        message: isConnected ? 'Email service is working' : 'Email service connection failed' 
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
