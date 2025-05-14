'use server';

import nodemailer from 'nodemailer';
import crypto from 'crypto';
import usersModel from '../../../../models/Users';
import coursesModel from '../../../../models/Courses';
import { revalidatePath } from 'next/cache';

function generatePassword() {
  return crypto.randomBytes(3).toString('hex'); // 3 bytes = 6 hex characters
}

async function sendWelcomeEmail(email, password, userData) {
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
    subject: 'Welcome to SCHED-NU - Your Account Details',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: #00204A; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <img src="cid:nuShield" alt="NU Shield" style="width: 80px; height: 100px; margin-bottom: 15px; object-fit: contain;"/>
          <h2 style="margin: 0; font-size: 24px;">Welcome to SCHED-NU</h2>
        </div>
        <div style="padding: 30px; background-color: white; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="color: #666; font-size: 16px;">Hello ${userData.firstName},</p>
          <p style="color: #666; font-size: 16px;">Your account has been created successfully. Here are your login credentials:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
            <p style="margin: 5px 0;"><strong>Role:</strong> ${userData.role}</p>
          </div>
          <p style="color: #dc3545; font-size: 14px; margin-top: 20px;">
            ⚠️ Please change your password after your first login for security purposes.
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
    console.error('Error sending welcome email:', error);
    return false;
  }
}

export async function addUser(formData) {
  try {
    const role = formData.get('role');
    const generatedPassword = generatePassword();
    
    const userData = {
      lastName: formData.get('lastName'),
      firstName: formData.get('firstName'),
      middleName: formData.get('middleName') || '',
      email: formData.get('email'),
      password: generatedPassword,
      role: role,
      department: role === 'Administrator' ? null : formData.get('department'),
      course: role === 'Administrator' ? null : formData.get('course'),
      employmentType: role === 'Administrator' ? 'full-time' : formData.get('employmentType')?.trim().toLowerCase()
    };

    const existingUser = await usersModel.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    const savedUser = await usersModel.createUser(userData);
    
    // Send welcome email with credentials
    const emailSent = await sendWelcomeEmail(userData.email, generatedPassword, userData);

    // Return plain object response
    revalidatePath('/entry/users');
    return { 
      success: true, 
      message: emailSent ? 'User created and welcome email sent successfully' : 'User created but failed to send welcome email',
      user: JSON.parse(JSON.stringify(savedUser))
    };
  } catch (error) {
    console.error('Error in addUser:', error);
    return { error: error.message || 'Failed to create user' };
  }
}

export async function getUsers() {
  try {
    const users = await usersModel.getAllUsers();
    return { users: JSON.parse(JSON.stringify(users)) };
  } catch (error) {
    console.error('Error in getUsers:', error);
    return { error: error.message || 'Failed to fetch users' };
  }
}

export async function editUser(userId, formData) {
  try {
    const role = formData.get('role');
    console.log('Server received request to edit user:', userId);
    const updateData = {
      lastName: formData.get('lastName'),
      firstName: formData.get('firstName'),
      middleName: formData.get('middleName'),
      email: formData.get('email'),
      role: role,
      department: role === 'Administrator' ? null : formData.get('department'),
      course: role === 'Administrator' ? null : formData.get('course'),
      employmentType: role === 'Administrator' ? 'full-time' : formData.get('employmentType')?.trim().toLowerCase()
    };

    // Remove undefined or null values
    Object.keys(updateData).forEach(key => 
      (updateData[key] === undefined || updateData[key] === null) && delete updateData[key]
    );

    // Only include password in update if it's not empty
    const password = formData.get('password');
    if (password && password.trim() !== '') {
      updateData.password = password.trim();
    }

    console.log('Server received user data to update:', { 
      ...updateData, 
      password: updateData.password ? '[REDACTED]' : undefined 
    });

    const updatedUser = await usersModel.updateUser(userId, updateData);
    console.log('User updated successfully:', { ...updatedUser, password: '[REDACTED]' });
    
    revalidatePath('/entry/users');
    return { 
      success: true, 
      user: JSON.parse(JSON.stringify(updatedUser))  // Added JSON parse/stringify here
    };
  } catch (error) {
    console.error('Error in editUser:', error);
    return { error: error.message || 'Failed to update user' };
  }
}

export async function removeUser(userId) {
  try {
    console.log('Server received request to delete user:', userId);
    const deletedUser = await usersModel.deleteUser(userId);
    console.log('User deleted successfully:', { ...deletedUser, password: '[REDACTED]' });
    
    revalidatePath('/entry/users');
    return { success: true, user: deletedUser };
  } catch (error) {
    console.error('Error in removeUser:', error);
    return { error: error.message || 'Failed to delete user' };
  }
}

export async function getDepartments() {
  try {
    const departments = await usersModel.getDepartments();
    return { departments };
  } catch (error) {
    console.error('Error fetching departments:', error);
    return { error: 'Failed to fetch departments' };
  }
}

export async function getCoursesByDepartment(departmentId) {
  try {
    const courses = await usersModel.getCoursesByDepartment(departmentId);
    return { courses };
  } catch (error) {
    console.error('Error fetching courses:', error);
    return { error: 'Failed to fetch courses' };
  }
}

export async function getAllCourses() {
  try {
    const courses = await coursesModel.getAllCoursesWithDepartment();
    return { courses };
  } catch (error) {
    console.error('Error fetching all courses:', error);
    return { error: 'Failed to fetch courses' };
  }
}