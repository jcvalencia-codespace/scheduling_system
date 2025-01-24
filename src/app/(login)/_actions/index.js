'use server'

import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions } from '@/lib/iron-config'
import connectDB from '../../../../lib/mongo';
import User from '../../models/Users';
import bcrypt from 'bcryptjs';

export async function login(formData) {
  try {
    await connectDB();

    const email = formData.get('email');
    const password = formData.get('password');

    const user = await User.getUserByEmail(email);
    
    if (!user) {
      return { error: 'User not found' }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    
    if (!isPasswordValid) {
      return { error: 'Invalid password' }
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