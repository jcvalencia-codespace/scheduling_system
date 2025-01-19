'use server';

import { createUser, getAllUsers, getUserByEmail, updateUser, deleteUser } from '../../../../models/Users';
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
      employmentType: formData.get('employmentType')  // Ensure no extra spaces and convert to lowercase
    };

    console.log('Server received user data:', { ...userData, password: '[REDACTED]' });

    const existingUser = await getUserByEmail(userData.email);
    if (existingUser) {
      console.log('Email already exists:', userData.email);
      throw new Error('Email already exists');
    }

    const savedUser = await createUser(userData);
    console.log('User created successfully:', { ...savedUser, password: '[REDACTED]' });
    
    revalidatePath('/entry/users');
    return { success: true, user: savedUser };
  } catch (error) {
    console.error('Error in addUser:', error);
    return { error: error.message || 'Failed to create user' };
  }
}

export async function getUsers() {
  try {
    console.log('Server received request to fetch all users');
    const users = await getAllUsers();
    console.log('Fetched users successfully:', users.length);
    return { users: JSON.parse(JSON.stringify(users)) };
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
      employmentType: formData.get('employmentType').trim().toLowerCase()  // Ensure no extra spaces and convert to lowercase
    };

    const password = formData.get('password');
    if (password) {
      updateData.password = password;
    }

    console.log('Server received user data to update:', { ...updateData, password: '[REDACTED]' });

    const updatedUser = await updateUser(userId, updateData);
    console.log('User updated successfully:', { ...updatedUser, password: '[REDACTED]' });
    
    revalidatePath('/entry/users');
    return { success: true, user: JSON.parse(JSON.stringify(updatedUser)) };
  } catch (error) {
    console.error('Error in editUser:', error);
    return { error: error.message || 'Failed to update user' };
  }
}

export async function removeUser(userId) {
  try {
    console.log('Server received request to delete user:', userId);
    const deletedUser = await deleteUser(userId);
    console.log('User deleted successfully:', { ...deletedUser, password: '[REDACTED]' });
    
    revalidatePath('/entry/users');
    return { success: true, user: JSON.parse(JSON.stringify(deletedUser)) };
  } catch (error) {
    console.error('Error in removeUser:', error);
    return { error: error.message || 'Failed to delete user' };
  }
}