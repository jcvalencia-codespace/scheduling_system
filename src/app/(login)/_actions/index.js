'use server'

import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions } from '@/lib/iron-config'
import connectDB from '../../../../lib/mongo';
import User from '../../models/Users';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// OTP storage (in a real app, use a more persistent storage like Redis)
const otpStore = new Map();

function cleanupExpiredOTPs() {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (data.expiresAt < now) {
      otpStore.delete(email);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupExpiredOTPs, 60000);

export async function generateOTP(email) {
  // Generate a 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  
  // Store OTP with expiration (5 minutes)
  otpStore.set(email, {
    otp,
    createdAt: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
  });

  return otp;
}

export async function sendOTPEmail(email, otp) {
  // Configure nodemailer with Gmail SMTP
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"SCHED-NU" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Login Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: #00204A; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <img src="cid:nuShield" alt="NU Shield" style="width: 80px; height: 100px; margin-bottom: 15px; object-fit: contain;"/>
          <h2 style="margin: 0; font-size: 24px;">SCHED-NU Login Verification</h2>
        </div>
        <div style="padding: 30px; background-color: white; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="color: #666; font-size: 16px; margin-bottom: 20px; font-weight: bold;">Your One-Time Password (OTP) is:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="font-size: 32px; color: #00204A; letter-spacing: 8px; margin: 0; font-weight: bold;">${otp}</h1>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            <span style="color: #dc3545;">⚠️ This OTP will expire in 5 minutes.</span><br>
            For security reasons, please do not share this code with anyone.
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666;">
            If you didn't request this code, please ignore this email.
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
    console.error('Error sending OTP email:', error);
    return false;
  }
}

export async function verifyOTP(email, userProvidedOTP) {
  const storedOTP = otpStore.get(email);

  if (!storedOTP) {
    return { error: 'No OTP found for this email' };
  }

  // Check if OTP is expired
  if (Date.now() > storedOTP.expiresAt) {
    otpStore.delete(email);
    return { error: 'OTP has expired' };
  }

  // Check if OTP matches
  if (storedOTP.otp !== userProvidedOTP) {
    return { error: 'Invalid or expired OTP' };
  }

  // Mark OTP as verified instead of deleting it
  otpStore.set(email, {
    ...storedOTP,
    verified: true
  });
  
  return { success: true };
}

export async function requestOTP(formData) {
  try {
    await connectDB();

    const email = formData.get('email');
    const password = formData.get('password');
    
    const user = await User.getUserByEmail(email);
    
    if (!user) {
      return { error: 'User not found' }
    }

    // Validate password before sending OTP
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { error: 'Invalid credentials (Double check Email or Password)' };
    }

    // Generate and send OTP
    const otp = await generateOTP(email);
    const emailSent = await sendOTPEmail(email, otp);

    if (!emailSent) {
      return { error: 'Failed to send OTP' };
    }

    return { success: true, message: ' OTP has been sent successfully. (Please check your email inbox or spam folder)' };
  } catch (error) {
    console.error('OTP request error:', error);
    return { error: 'An error occurred while requesting OTP' };
  }
}

export async function resendOTP(formData) {
  try {
    await connectDB();

    const email = formData.get('email');
    const user = await User.getUserByEmail(email);
    
    if (!user) {
      return { error: 'User not found' }
    }

    // Check if the user can request a new OTP (optional: add a cooldown)
    const otp = await generateOTP(email);
    const emailSent = await sendOTPEmail(email, otp);

    if (!emailSent) {
      return { error: 'Failed to send OTP email' }
    }

    return { success: true, message: 'New OTP sent successfully' };
  } catch (error) {
    console.error('Error resending OTP:', error);
    return { error: 'An error occurred while resending OTP' }
  }
}

export async function login(formData) {
  try {
    const email = formData.get('email')
    const password = formData.get('password')
    const otp = formData.get('otp')

    if (!email || !password) {
      return { error: 'Email and password are required' }
    }

    await connectDB()

    const user = await User.getUserByEmail(email)

    if (!user) {
      return { error: 'Invalid credentials (Double check Email or Password)' }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return { error: 'Invalid credentials (Double check Email or Password)' }
    }

    // Verify OTP if provided
    if (otp) {
      const otpVerification = await verifyOTP(email, otp);
      if (!otpVerification.success) {
        return otpVerification;
      }
    }

    // First await the cookies
    const cookieStore = await cookies()

    // Then use cookieStore with getIronSession
    const session = await getIronSession(cookieStore, sessionOptions)

    const userWithoutPassword = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department,
      course: user.course,
      employmentType: user.employmentType
    }

    session.user = userWithoutPassword
    await session.save()

    return { success: true, user: userWithoutPassword }        
  } catch (error) {
    console.error('Login error:', error)
    return { error: 'An error occurred during login' }
  }
}

export async function logout() {
  try {
    // First await the cookies
    const cookieStore = await cookies()
    
    // Then use cookieStore with getIronSession
    const session = await getIronSession(cookieStore, sessionOptions)
    
    // Destroy the session
    await session.destroy()
    
    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
    return { error: 'An error occurred during logout' }
  }
}

async function generateResetOTP(email) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Store OTP with expiration
  otpStore.set(email, {
    otp,
    expiresAt
  });

  return otp;
}

export async function requestPasswordReset(formData) {
  try {
    await connectDB();

    const email = formData.get('email');
    const user = await User.getUserByEmail(email);
    
    if (!user) {
      return { error: 'No account found with this email address' };
    }

    const otp = await generateResetOTP(email);
    const emailSent = await sendResetOTPEmail(email, otp);

    if (!emailSent) {
      return { error: 'Failed to send reset instructions' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error requesting password reset:', error);
    return { error: 'An error occurred while processing your request' };
  }
}

async function sendResetOTPEmail(email, otp) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"SCHED-NU" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: #00204A; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <img src="cid:nuShield" alt="NU Shield" style="width: 80px; height: 100px; margin-bottom: 15px; object-fit: contain;"/>
          <h2 style="margin: 0; font-size: 24px;">Password Reset Request</h2>
        </div>
        <div style="padding: 30px; background-color: white; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
            We received a request to reset your password. Please use the following code to reset your password:
          </p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #00204A;">
              ${otp}
            </span>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            This code will expire in 10 minutes. If you didn't request a password reset, please ignore this email.
          </p>
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
    console.error('Error sending reset password email:', error);
    return false;
  }
}

export async function verifyOTPAndResetPassword(formData) {
  try {
    await connectDB();

    const email = formData.get('email');
    const otp = formData.get('otp');
    const newPassword = formData.get('newPassword');

    // Check OTP validity and verification status
    const storedData = otpStore.get(email);
    if (!storedData || storedData.otp !== otp || storedData.expiresAt < Date.now() || !storedData.verified) {
      return { error: 'Invalid or expired reset OTP code' };
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password using email instead of ID
    const user = await User.MODEL.findOneAndUpdate(
      { email },
      { $set: { password: hashedPassword } },
      { new: true }
    );

    if (!user) {
      return { error: 'User not found' };
    }

    // Delete the used OTP after successful password reset
    otpStore.delete(email);

    return { success: true };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { error: 'An error occurred while resetting your password' };
  }
}