'use server'

import { getSchedules } from '../../_actions'
import UsersModel from '@/app/models/Users'
import RoomsModel from '@/app/models/Rooms'

export async function getAllFaculty(departmentId = null, user = null) {
  try {
    const isAdmin = user?.role === 'Administrator';
    
    // Handle different user roles
    if (user?.role === 'Program Chair') {
      const faculty = await UsersModel.getFacultyByCourse(user.course, false);
      return { faculty };
    } else if (user?.role === 'Dean' && !isAdmin) {
      const faculty = await UsersModel.getFacultyByDepartment(departmentId, false);
      return { faculty };
    } else {
      // Admin gets all faculty
      const faculty = await UsersModel.getFacultyByDepartment(null, true);
      return { faculty };
    }
  } catch (error) {
    console.error('Error fetching faculty:', error);
    return { error: error.message || 'Failed to fetch faculty', faculty: [] };
  }
}

export async function getFacultySchedules(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required')
    }
    
    const response = await getSchedules({ 
      faculty: userId
    })

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.schedules) {
      return { schedules: [] }
    }

    const facultySchedules = response.schedules.filter(
      schedule => schedule.faculty?._id.toString() === userId.toString()
    )

    return { schedules: facultySchedules }
  } catch (error) {
    console.error('Error fetching faculty schedules:', error);
    return { error: 'Failed to fetch schedules' }
  }
}

export async function getAllRooms(user = null) {
  try {
    let rooms;
    const isAdmin = user?.role === 'Administrator';
    
    // Handle different user roles
    if (user?.role === 'Program Chair') {
      // For Program Chair, get department from their course
      const departmentId = user?.department;
      rooms = await RoomsModel.getRoomsByDepartment(departmentId);
    } else if (user?.role === 'Dean') {
      rooms = await RoomsModel.getRoomsByDepartment(user.department);
    } else {
      rooms = await RoomsModel.getAllRooms();
    }
      
    if (!rooms) {
      return { rooms: [] };
    }

    console.log(`Fetched ${rooms.length} rooms for ${user?.role}`);
    return { rooms };
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return { error: error.message || 'Failed to fetch rooms', rooms: [] };
  }
}

export async function getRoomSchedules(roomId) {
  try {
    if (!roomId) {
      throw new Error('Room ID is required');
    }
    
    const response = await getSchedules({ 
      room: roomId
    });

    if (response.error) {
      throw new Error(response.error);
    }

    return { schedules: response.schedules || [] };
  } catch (error) {
    console.error('Error fetching room schedules:', error);
    return { error: 'Failed to fetch schedules' };
  }
}
