'use server'

import { getSchedules } from '../../_actions'
import UsersModel from '@/app/models/Users'

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
    console.error('Error fetching faculty schedules:', error)
    return { error: 'Failed to fetch schedules' }
  }
}
