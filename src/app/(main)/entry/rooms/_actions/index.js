'use server';

import roomsModel from '../../../../models/Rooms';
import departmentsModel from '../../../../models/Departments';
import { revalidatePath } from 'next/cache';

export async function addRoom(formData) {
  try {
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
      department: department._id, // Use department ObjectId instead of code
      capacity: parseInt(formData.get('capacity') || '0', 10),
      updatedBy: formData.get('userId'), // Use updatedBy for consistency with schema
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

    // Check if room code already exists
    const existingRoom = await roomsModel.getRoomByCode(roomData.roomCode);
    if (existingRoom) {
      throw new Error('Room code already exists');
    }

    const savedRoom = await roomsModel.processRoomCreation(roomData);
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
    return { rooms };
  } catch (error) {
    console.error('Error in getRooms:', error);
    return { error: error.message || 'Failed to fetch rooms' };
  }
}

export async function getDepartments() {
  try {
    const departments = await departmentsModel.getAllDepartments();
    return { departments };
  } catch (error) {
    console.error('Error in getDepartments:', error);
    return { error: error.message || 'Failed to fetch departments' };
  }
}

export async function editRoom(roomCode, formData) {
  try {
    // Get department first to get its _id
    const department = await departmentsModel.getDepartmentByCode(
      formData.get('departmentCode')?.trim()
    );
    if (!department) {
      throw new Error('Selected department does not exist');
    }

    const updateData = {
      roomName: formData.get('roomName')?.trim(),
      type: formData.get('type')?.trim(),
      floor: formData.get('floor')?.trim(),
      department: department._id, // Use department ObjectId instead of code
      capacity: parseInt(formData.get('capacity') || '0', 10),
      updatedBy: formData.get('userId'), // Use updatedBy for consistency with schema
    };

    // Validate required fields
    const requiredFields = ['roomName', 'type', 'floor', 'capacity'];
    for (const field of requiredFields) {
      if (!updateData[field] && updateData[field] !== 0) {
        throw new Error('All fields are required');
      }
    }

    // Validate capacity
    if (updateData.capacity < 0) {
      throw new Error('Capacity must be a positive number');
    }

    const updatedRoom = await roomsModel.processRoomUpdate(roomCode, updateData);
    if (!updatedRoom) {
      throw new Error('Room not found');
    }

    revalidatePath('/entry/rooms');
    return { success: true, room: updatedRoom };
  } catch (error) {
    console.error('Error in editRoom:', error);
    return { error: error.message || 'Failed to update room' };
  }
}

export async function removeRoom(roomCode, formData) {
  try {
    const userId = formData.get('userId');
    const deletedRoom = await roomsModel.processRoomDeletion(roomCode, userId);
    if (!deletedRoom) {
      throw new Error('Room not found');
    }

    revalidatePath('/entry/rooms');
    return { success: true };
  } catch (error) {
    console.error('Error in removeRoom:', error);
    return { error: error.message || 'Failed to delete room' };
  }
}
