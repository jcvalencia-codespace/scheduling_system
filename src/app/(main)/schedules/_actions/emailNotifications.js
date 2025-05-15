'use server';

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function sendScheduleNotificationEmail(user, notification) {
  try {
    let subject, preheader, actionType;

    // Determine email subject and preheader based on notification type
    switch (notification.type) {
      case 'success':
        subject = 'New Schedule Assignment';
        preheader = 'You have been assigned to a new schedule.';
        actionType = 'assigned to';
        break;
      case 'warning':
        subject = 'Schedule Update';
        preheader = 'Your schedule has been modified.';
        actionType = 'updated for';
        break;
      case 'error':
        subject = 'Schedule Removal';
        preheader = 'One of your schedules has been removed.';
        actionType = 'removed from';
        break;
      default:
        subject = 'Schedule Notification';
        preheader = 'There has been a change to your schedule.';
        actionType = 'modified for';
    }

    const mailOptions = {
      from: `"SCHED-NU" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #00204A; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <img src="cid:nuShield" alt="NU Shield" style="width: 80px; height: 100px; margin-bottom: 15px; object-fit: contain;"/>
            <h2 style="margin: 0; font-size: 24px;">${subject}</h2>
          </div>
          <div style="padding: 30px; background-color: white; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="color: #666; font-size: 16px;">Dear ${user.firstName} ${user.lastName},</p>
            <p style="color: #666; font-size: 16px;">${preheader}</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #333;">${notification.message}</p>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              Please check your schedule in SCHED-NU for more details.
            </p>
          </div>
          <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            This is an automated message. Please do not reply to this email.<br>
            ${new Date().getFullYear()} National University - Baliwag. All rights reserved.
          </div>
        </div>
      `,
      attachments: [{
        filename: 'nu-shield.png',
        path: process.cwd() + '/public/nu-shield.png',
        cid: 'nuShield'
      }]
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending schedule notification email:', error);
    return { error: 'Failed to send email notification' };
  }
}
