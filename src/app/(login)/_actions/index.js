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
    from: `"SchedNU" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #00204A; color: white; padding: 10px; text-align: center;">
          <h2>SchedNu Login Verification</h2>
        </div>
        <div style="padding: 20px; background-color: white;">
          <p>Your One-Time Password (OTP) is:</p>
          <h1 style="text-align: center; color: #00204A; letter-spacing: 5px;">${otp}</h1>
          <p>This OTP will expire in 5 minutes. Do not share this with anyone.</p>
        </div>
        <div style="text-align: center; padding: 10px; color: #888;">
          ${new Date().getFullYear()} SchedNu. All rights reserved.
        </div>
      </div>
    `
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
    return { error: 'Invalid OTP' };
  }

  // OTP is valid, remove it from store
  otpStore.delete(email);
  return { success: true };
}

export async function requestOTP(formData) {
  try {
    await connectDB();

    const email = formData.get('email');
    const user = await User.getUserByEmail(email);
    
    if (!user) {
      return { error: 'User not found' }
    }

    // Generate and send OTP
    const otp = await generateOTP(email);
    const emailSent = await sendOTPEmail(email, otp);

    if (!emailSent) {
      return { error: 'Failed to send OTP' };
    }

    return { success: true, message: 'OTP sent successfully' };
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
    await connectDB();

    const email = formData.get('email');
    const password = formData.get('password');
    const otp = formData.get('otp');

    const user = await User.getUserByEmail(email);
    
    if (!user) {
      return { error: 'User not found' }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid) {
      return { error: 'Invalid password' }
    }

    // Verify OTP if provided
    if (otp) {
      const otpVerification = await verifyOTP(email, otp);
      if (!otpVerification.success) {
        return otpVerification;
      }
    }

    const session = await getIronSession(cookies(), sessionOptions)
    
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
  const session = await getIronSession(cookies(), sessionOptions)
  session.destroy()
  return { success: true }
}