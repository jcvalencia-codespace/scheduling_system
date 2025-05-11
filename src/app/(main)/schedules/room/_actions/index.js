'use server'

import { getSchedules } from '../../_actions'
import UsersModel from '@/app/models/Users'
import RoomsModel from '@/app/models/Rooms'
import SchedulesModel from '@/app/models/Schedules'

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

    // Serialize rooms data with proper date handling
    const serializedRooms = rooms.map(room => ({
      _id: room._id.toString(),
      roomCode: room.roomCode,
      roomName: room.roomName,
      type: room.type,
      floor: room.floor,
      department: room.department ? {
        _id: room.department._id.toString(),
        departmentCode: room.department.departmentCode,
        departmentName: room.department.departmentName
      } : null,
      capacity: room.capacity,
      isActive: room.isActive,
      updateHistory: room.updateHistory?.map(history => ({
        _id: history._id.toString(),
        updatedBy: history.updatedBy.toString(),
        updatedAt: new Date(history.updatedAt).toISOString(), // Fix date handling
        action: history.action
      })) || []
    }));

    console.log(`Fetched ${serializedRooms.length} rooms for ${user?.role}`);
    return { rooms: serializedRooms };
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
    
    const schedules = await SchedulesModel.getRoomSchedules(roomId);
    
    // Serialize schedules data
    const serializedSchedules = schedules.map(schedule => ({
      _id: schedule._id.toString(),
      term: {
        _id: schedule.term._id.toString(),
        term: schedule.term.term,
        academicYear: schedule.term.academicYear
      },
      section: {
        _id: schedule.section._id.toString(),
        sectionName: schedule.section.sectionName
      },
      subject: {
        _id: schedule.subject._id.toString(),
        subjectCode: schedule.subject.subjectCode,
        subjectName: schedule.subject.subjectName
      },
      faculty: schedule.faculty ? {
        _id: schedule.faculty._id.toString(),
        firstName: schedule.faculty.firstName,
        lastName: schedule.faculty.lastName
      } : null,
      scheduleSlots: schedule.scheduleSlots.map(slot => ({
        days: slot.days,
        timeFrom: slot.timeFrom,
        timeTo: slot.timeTo,
        room: {
          _id: slot.room._id.toString(),
          roomCode: slot.room.roomCode,
          roomName: slot.room.roomName
        },
        scheduleType: slot.scheduleType
      }))
    }));

    return { schedules: serializedSchedules };
  } catch (error) {
    console.error('Error fetching room schedules:', error);
    return { error: 'Failed to fetch schedules' };
  }
}
