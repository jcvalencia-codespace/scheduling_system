'use server';

import usersModel from '../../../../models/Users';
import { revalidatePath } from 'next/cache';

export async function addUser(formData) {
  try {
    const userData = {
      lastName: formData.get('lastName'),
      firstName: formData.get('firstName'),
      middleName: formData.get('middleName') || '',
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role'),
      department: formData.get('department'),
      course: formData.get('course'),
      employmentType: formData.get('employmentType')?.trim().toLowerCase() // Safe access and normalize
    };

    console.log('Server received user data:', { ...userData, password: '[REDACTED]' });

    const existingUser = await usersModel.getUserByEmail(userData.email);
    if (existingUser) {
      console.log('Email already exists:', userData.email);
      throw new Error('Email already exists');
    }

    const savedUser = await usersModel.createUser(userData);
    console.log('User created successfully:', { ...savedUser, password: '[REDACTED]' });
    
    revalidatePath('/entry/users');
    return { success: true, user: savedUser }; // No need for JSON.parse(JSON.stringify()) here
  } catch (error) {
    console.error('Error in addUser:', error);
    return { error: error.message || 'Failed to create user' };
  }
}

export async function getUsers() {
  try {
    console.log('Server received request to fetch all users');
    const users = await usersModel.getAllUsers();
    console.log('Fetched users successfully:', users.length);
    return { users }; // No need for JSON.parse(JSON.stringify()) here
  } catch (error) {
    console.error('Error in getUsers:', error);
    return { error: error.message || 'Failed to fetch users' };
  }
}

export async function editUser(userId, formData) {
  try {
    console.log('Server received request to edit user:', userId);
    const updateData = {
      lastName: formData.get('lastName'),
      firstName: formData.get('firstName'),
      middleName: formData.get('middleName'),
      email: formData.get('email'),
      role: formData.get('role'),
      department: formData.get('department'),
      course: formData.get('course'),
      employmentType: formData.get('employmentType')?.trim().toLowerCase() // Safe access and normalize
    };

    // Remove undefined or null values
    Object.keys(updateData).forEach(key => 
      (updateData[key] === undefined || updateData[key] === null) && delete updateData[key]
    );

    const password = formData.get('password');
    if (password?.trim()) {
      updateData.password = password;
    }

    console.log('Server received user data to update:', { ...updateData, password: '[REDACTED]' });

    const updatedUser = await usersModel.updateUser(userId, updateData);
    console.log('User updated successfully:', { ...updatedUser, password: '[REDACTED]' });
    
    revalidatePath('/entry/users');
    return { success: true, user: updatedUser }; // No need for JSON.parse(JSON.stringify()) here
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
    return { success: true, user: deletedUser }; // No need for JSON.parse(JSON.stringify()) here
  } catch (error) {
    console.error('Error in removeUser:', error);
    return { error: error.message || 'Failed to delete user' };
  }
}