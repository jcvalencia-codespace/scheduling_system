'use server';

import roomsModel from '../../../../models/Rooms';
import departmentsModel from '../../../../models/Departments';
import { revalidatePath } from 'next/cache';

export async function addRoom(formData) {
  try {
    const roomData = {
      roomCode: formData.get('roomCode')?.trim().toUpperCase(),
      roomName: formData.get('roomName')?.trim(),
      type: formData.get('type')?.trim(),
      floor: formData.get('floor')?.trim(),
      departmentCode: formData.get('departmentCode')?.trim(),
      capacity: parseInt(formData.get('capacity') || '0', 10),
    };

    // Validate required fields
    const requiredFields = ['roomCode', 'roomName', 'type', 'floor', 'departmentCode', 'capacity'];
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

    // Check if department exists
    const department = await departmentsModel.getDepartmentByCode(roomData.departmentCode);
    if (!department) {
      throw new Error('Selected department does not exist');
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
    const updateData = {
      roomName: formData.get('roomName')?.trim(),
      type: formData.get('type')?.trim(),
      floor: formData.get('floor')?.trim(),
      departmentCode: formData.get('departmentCode')?.trim(),
      capacity: parseInt(formData.get('capacity') || '0', 10),
    };

    // Validate required fields
    const requiredFields = ['roomName', 'type', 'floor', 'departmentCode', 'capacity'];
    for (const field of requiredFields) {
      if (!updateData[field] && updateData[field] !== 0) {
        throw new Error('All fields are required');
      }
    }

    // Validate capacity
    if (updateData.capacity < 0) {
      throw new Error('Capacity must be a positive number');
    }

    // Check if department exists
    const department = await departmentsModel.getDepartmentByCode(updateData.departmentCode);
    if (!department) {
      throw new Error('Selected department does not exist');
    }

    const updatedRoom = await roomsModel.updateRoom(roomCode, updateData);
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

export async function removeRoom(roomCode) {
  try {
    const deletedRoom = await roomsModel.deleteRoom(roomCode);
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
