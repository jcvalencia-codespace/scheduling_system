'use server'

import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions } from '@/lib/iron-config';
import feedbackModel from '../../../models/Feedback';
import { revalidatePath } from 'next/cache';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';

async function sendFeedbackEmail(feedback, user) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const priorityColors = {
    low: '#6B7280',
    normal: '#3B82F6',
    high: '#F97316',
    urgent: '#DC2626'
  };

  const typeIcons = {
    suggestion: '💡',
    bug: '🐛',
    feature: '✨',
    other: '📝'
  };

  const mailOptions = {
    from: `"SCHED-NU Feedback" <${process.env.EMAIL_USER}>`,
    to: 'rjlnu.capstone@gmail.com',
    subject: `New Feedback: ${feedback.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: #00204A; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <img src="cid:nuShield" alt="NU Shield" style="width: 80px; height: 100px; margin-bottom: 15px; object-fit: contain;"/>
          <h2 style="margin: 0; font-size: 24px;">New Feedback Received</h2>
        </div>
        <div style="padding: 30px; background-color: white; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="margin-bottom: 20px;">
            <h3 style="color: #00204A; margin: 0 0 5px 0;">Subject</h3>
            <p style="margin: 0; color: #4B5563; font-size: 16px;">${feedback.subject}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #00204A; margin: 0 0 5px 0;">Message</h3>
            <p style="margin: 0; color: #4B5563; font-size: 16px; white-space: pre-wrap;">${feedback.message}</p>
          </div>

          <!-- Metadata Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; margin-bottom: 20px;">
            <!-- Type -->
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
              <h3 style="margin: 0 0 8px; color: #00204A; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Type</h3>
              <p style="margin: 0; color: #4B5563; font-size: 16px;">
                ${typeIcons[feedback.type]} ${feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)}
              </p>
            </div>

            <!-- Priority -->
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
              <h3 style="margin: 0 0 8px; color: #00204A; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Priority</h3>
              <p style="margin: 0; font-size: 16px;">
                <span style="color: ${priorityColors[feedback.priority]}; font-weight: 600;">
                  ● ${feedback.priority.charAt(0).toUpperCase() + feedback.priority.slice(1)}
                </span>
              </p>
            </div>

            <!-- Status -->
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
              <h3 style="margin: 0 0 8px; color: #00204A; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Status</h3>
              <p style="margin: 0; color: #4B5563; font-size: 16px;">
                ${feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
              </p>
            </div>

            <!-- Submitted By -->
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
              <h3 style="margin: 0 0 8px; color: #00204A; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Submitted By</h3>
              <p style="margin: 0; color: #4B5563; font-size: 16px;">
                ${user.firstName} ${user.lastName}
              </p>
              <p style="margin: 4px 0 0; color: #6B7280; font-size: 14px;">
                ${user.email}
              </p>
            </div>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
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

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending feedback email:', error);
    return false;
  }
}

export async function submitFeedback(formData) {
  try {
    // Get user session for validation with awaited cookies
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);

    if (!session.user) {
      return { error: 'You must be logged in to submit feedback' };
    }

    // Use session.user._id directly instead of formData
    const userId = session.user._id;
    if (!userId) {
      return { error: 'User ID is required' };
    }

    // Create feedback with the correct user ID
    const feedbackData = {
      subject: formData.get('subject'),
      message: formData.get('message'),
      type: formData.get('type'),
      priority: formData.get('priority'),
      submittedBy: new mongoose.Types.ObjectId(userId),
      status: 'submitted',
      isActive: true
    };

    const feedback = await feedbackModel.createFeedback(feedbackData);
    
    // Send email notification using session.user for email details
    await sendFeedbackEmail(feedback, session.user);

    // Revalidate the feedback page
    revalidatePath('/feedback');

    return { success: true, feedback };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return { error: error.message || 'Failed to submit feedback' };
  }
}

export async function getUserFeedback() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);

    if (!session.user) {
      return { error: 'You must be logged in to view feedback' };
    }

    // Get user's feedback using _id instead of id
    const feedback = await feedbackModel.getFeedbackByUser(session.user._id);
    return { success: true, feedback };
  } catch (error) {
    console.error('Error getting user feedback:', error);
    return { error: error.message || 'Failed to get feedback' };
  }
}

export async function getAllFeedbackData() {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);

    if (!session.user) {
      return { error: 'You must be logged in to view feedback' };
    }

    // Get all feedback
    const feedback = await feedbackModel.getAllFeedback();
    return { success: true, feedback };
  } catch (error) {
    console.error('Error getting all feedback:', error);
    return { error: error.message || 'Failed to get feedback' };
  }
}

export async function updateFeedbackStatus(feedbackId, status) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);

    if (!session.user) {
      return { error: 'You must be logged in to update feedback' };
    }

    const feedback = await feedbackModel.updateFeedback(feedbackId, { status });

    if (!feedback) {
      return { error: 'Feedback not found' };
    }

    revalidatePath('/feedback');
    return { success: true, feedback };
  } catch (error) {
    console.error('Error updating feedback status:', error);
    return { error: error.message || 'Failed to update feedback status' };
  }
}

export async function deleteFeedback(feedbackId) {
  try {
    const cookieStore = await cookies();
    const session = await getIronSession(cookieStore, sessionOptions);

    if (!session.user) {
      return { error: 'You must be logged in to delete feedback' };
    }

    const feedback = await feedbackModel.deleteFeedback(feedbackId);

    if (!feedback) {
      return { error: 'Feedback not found' };
    }

    revalidatePath('/feedback');
    return { success: true };
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return { error: error.message || 'Failed to delete feedback' };
  }
}