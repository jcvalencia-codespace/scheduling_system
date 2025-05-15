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
    if (!user) {
      return { rooms: [] };
    }

    let rooms;
    const isAdmin = user?.role === 'Administrator';
    
    console.log('Getting rooms for user:', {
      role: user.role,
      department: user.department,
      course: user.course,
      isAdmin
    });

    // Get all rooms for Admin, Dean, and Program Chair
    if (user?.role === 'Dean' || user?.role === 'Program Chair' || isAdmin) {
      rooms = await RoomsModel.getAllRooms();

      if (!Array.isArray(rooms)) {
        return { rooms: [] };
      }

      // Group rooms by department
      const groupedRooms = rooms.reduce((acc, room) => {
        const deptName = room.department?.departmentName || 'Unassigned';
        if (!acc[deptName]) {
          acc[deptName] = [];
        }
        acc[deptName].push(room);
        return acc;
      }, {});

      return { rooms, groupedRooms };
    }

    return { rooms: [] };
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
      classLimit: schedule.classLimit,
      studentType: schedule.studentType,
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