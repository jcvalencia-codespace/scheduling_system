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
      department: department._id, // Use department ObjectId instead of code
      capacity: parseInt(formData.get('capacity') || '0', 10),
      updatedBy: userId // Changed from formData.get('userId') to already validated userId
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
    
    // Serialize rooms data - dates are already serialized from aggregation
    const serializedRooms = rooms.map(room => ({
      _id: room._id,
      roomCode: room.roomCode,
      roomName: room.roomName,
      type: room.type,
      floor: room.floor,
      department: room.department,
      capacity: room.capacity,
      isActive: room.isActive,
      updateHistory: room.updateHistory || [],
      createdAt: room.createdAt,
      updatedAt: room.updatedAt
    }));

    return { rooms: serializedRooms };
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

    const updateData = {
      roomName: formData.get('roomName')?.trim(),
      type: formData.get('type')?.trim(),
      floor: formData.get('floor')?.trim(),
      department: department._id,
      capacity: parseInt(formData.get('capacity') || '0', 10),
      updatedBy: userId
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
    revalidatePath('/entry/rooms');
    return { success: true, room: updatedRoom };
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

    const deletedRoom = await roomsModel.processRoomDeletion(roomCode, userId);
    revalidatePath('/entry/rooms');
    return { success: true };
  } catch (error) {
    console.error('Error in removeRoom:', error);
    return { error: error.message || 'Failed to delete room' };
  }
}
