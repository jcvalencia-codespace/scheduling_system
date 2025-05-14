'use server';

import roomsModel from '../../../../models/Rooms';
import departmentsModel from '../../../../models/Departments';
import mongoose from 'mongoose';
import { revalidatePath } from 'next/cache';

export async function addRoom(formData) {
  try {
    const userId = formData.get('userId');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { error: 'Invalid user ID' };
    }

    // Get department first to get its _id
    const department = await departmentsModel.getDepartmentByCode(
      formData.get('departmentCode')?.trim()
    );
    if (!department) {
      throw new Error('Selected department does not exist');
    }

    const roomData = {
      roomCode: formData.get('roomCode')?.trim().toUpperCase(),
      roomName: formData.get('roomName')?.trim(),
      type: formData.get('type')?.trim(),
      floor: formData.get('floor')?.trim(),
      department: department._id,
      capacity: parseInt(formData.get('capacity') || '0', 10),
      updatedBy: userId,
      updateHistory: [{
        updatedBy: userId,
        action: 'created',
        updatedAt: new Date(),
        academicYear: new Date().getFullYear()
      }]
    };

    // Validate required fields
    const requiredFields = ['roomCode', 'roomName', 'type', 'floor', 'capacity'];
    for (const field of requiredFields) {
      if (!roomData[field] && roomData[field] !== 0) {
        throw new Error(`${field} is required`);
      }
    }

    // Validate capacity
    if (roomData.capacity < 0) {
      throw new Error('Capacity must be a positive number');
    }

    const savedRoom = await roomsModel.createRoom(roomData);
    revalidatePath('/entry/rooms');
    return { success: true, room: savedRoom };
  } catch (error) {
    console.error('Error in addRoom:', error);
    return { error: error.message || 'Failed to create room' };
  }
}

export async function getRooms() {
  try {
    const rooms = await roomsModel.getAllRooms();
    return { rooms: JSON.parse(JSON.stringify(rooms)) };
  } catch (error) {
    console.error('Error in getRooms:', error);
    return { error: error.message || 'Failed to fetch rooms' };
  }
}

export async function getDepartments() {
  try {
    const departments = await departmentsModel.getAllDepartments();
    return { departments: JSON.parse(JSON.stringify(departments)) };
  } catch (error) {
    console.error('Error in getDepartments:', error);
    return { error: error.message || 'Failed to fetch departments' };
  }
}

export async function editRoom(roomCode, formData) {
  try {
    const userId = formData.get('userId');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { error: 'Invalid user ID' };
    }

    // Get department to get its _id
    const department = await departmentsModel.getDepartmentByCode(
      formData.get('departmentCode')?.trim()
    );
    if (!department) {
      throw new Error('Selected department does not exist');
    }

    const updateData = {
      roomCode: formData.get('roomCode')?.trim().toUpperCase(),
      roomName: formData.get('roomName')?.trim(),
      type: formData.get('type')?.trim(),
      floor: formData.get('floor')?.trim(),
      department: department._id,
      capacity: parseInt(formData.get('capacity') || '0', 10),
      updatedBy: userId,
      $push: {
        updateHistory: {
          updatedBy: userId,
          action: 'updated',
          updatedAt: new Date(),
          academicYear: new Date().getFullYear()
        }
      }
    };

    // Validate required fields
    const requiredFields = ['roomCode', 'roomName', 'type', 'floor', 'capacity'];
    for (const field of requiredFields) {
      if (!updateData[field] && updateData[field] !== 0) {
        throw new Error(`${field} is required`);
      }
    }

    // Validate capacity
    if (updateData.capacity < 0) {
      throw new Error('Capacity must be a positive number');
    }

    const updatedRoom = await roomsModel.updateRoom(roomCode, updateData);
    revalidatePath('/entry/rooms');
    return { success: true, room: JSON.parse(JSON.stringify(updatedRoom)) };
  } catch (error) {
    console.error('Error in editRoom:', error);
    return { error: error.message || 'Failed to update room' };
  }
}

export async function removeRoom(roomCode, userId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { error: 'Invalid user ID' };
    }

    const deletedRoom = await roomsModel.deleteRoom(roomCode, userId);
    revalidatePath('/entry/rooms');
    return { success: true, room: JSON.parse(JSON.stringify(deletedRoom)) };
  } catch (error) {
    console.error('Error in removeRoom:', error);
    return { error: error.message || 'Failed to delete room' };
  }
}
