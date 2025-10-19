import nodemailer from 'nodemailer';

// SMTP Configuration
const smtpConfig = {
  host: process.env.SMTP_HOST || 'mail.privateemail.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_MAIL || 'info@polymath-kids.com',
    pass: process.env.SMTP_PASSWORD || 'GTaX0278'
  }
};

// Create transporter
const transporter = nodemailer.createTransport(smtpConfig);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
    encoding?: string;
  }>;
}

export interface BulkEmailOptions {
  recipients: Array<{
    email: string;
    name?: string;
  }>;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
    encoding?: string;
  }>;
}

// Send single email
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const mailOptions = {
      from: `"Polymath Kids CRM" <${smtpConfig.auth.user}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
      // Add headers to improve deliverability
      headers: {
        'X-Mailer': 'Polymath Kids CRM',
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Reply-To': smtpConfig.auth.user,
        'Return-Path': smtpConfig.auth.user
      }
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Send bulk emails
export async function sendBulkEmails(options: BulkEmailOptions): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const recipient of options.recipients) {
    try {
      const mailOptions = {
        from: `"Polymath Kids CRM" <${smtpConfig.auth.user}>`,
        to: recipient.email,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
        // Add headers to improve deliverability
        headers: {
          'X-Mailer': 'Polymath Kids CRM',
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
          'Reply-To': smtpConfig.auth.user,
          'Return-Path': smtpConfig.auth.user
        }
      };

      await transporter.sendMail(mailOptions);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to send to ${recipient.email}: ${error}`);
    }
  }

  return results;
}

// Test email connection
export async function testEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('SMTP connection failed:', error);
    return false;
  }
}

// Email templates
export const emailTemplates = {
  courseDetails: (studentName: string, courseName: string) => ({
    subject: `Course Details - ${courseName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Course Details</h2>
        <p>Dear ${studentName},</p>
        <p>Thank you for your interest in our ${courseName} course.</p>
        <p>Here are the course details:</p>
        <ul>
          <li>Course: ${courseName}</li>
          <li>Duration: As per schedule</li>
          <li>Fees: Please contact for details</li>
        </ul>
        <p>Best regards,<br>Polymath Kids Team</p>
      </div>
    `
  }),
  
  fees: (studentName: string) => ({
    subject: 'Fee Structure Information',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Fee Structure</h2>
        <p>Dear ${studentName},</p>
        <p>Please find below our fee structure:</p>
        <ul>
          <li>Monthly Fee: Contact for details</li>
          <li>Registration Fee: Contact for details</li>
          <li>Payment Methods: Cash, Bank Transfer</li>
        </ul>
        <p>For more information, please contact us.</p>
        <p>Best regards,<br>Polymath Kids Team</p>
      </div>
    `
  }),
  
  schedule: (studentName: string) => ({
    subject: 'Class Schedule Information',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Class Schedule</h2>
        <p>Dear ${studentName},</p>
        <p>Here is your class schedule:</p>
        <ul>
          <li>Monday to Friday: 4:00 PM - 6:00 PM</li>
          <li>Saturday: 10:00 AM - 12:00 PM</li>
          <li>Sunday: Off</li>
        </ul>
        <p>Please note any changes will be communicated in advance.</p>
        <p>Best regards,<br>Polymath Kids Team</p>
      </div>
    `
  }),
  
  discountOffers: (studentName: string) => ({
    subject: 'Special Discount Offers',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Special Offers</h2>
        <p>Dear ${studentName},</p>
        <p>We have exciting discount offers for you:</p>
        <ul>
          <li>Early Bird Discount: 10% off on annual fees</li>
          <li>Referral Bonus: Get 1 month free for each referral</li>
          <li>Sibling Discount: 15% off for second child</li>
        </ul>
        <p>Contact us to avail these offers!</p>
        <p>Best regards,<br>Polymath Kids Team</p>
      </div>
    `
  })
};
