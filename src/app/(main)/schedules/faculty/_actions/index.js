'use server'

import { getSchedules } from '../../_actions'
import UsersModel from '@/app/models/Users'

export async function getAllFaculty(departmentId = null, user = null) {
  try {
    const isAdmin = user?.role === 'Administrator';
    
    if (user?.role === 'Dean') {
      // Extract department ID from user
      const deanDeptId = user.department?._id?.toString() || user.department?.toString();
      console.log('Dean fetching faculty with departmentId:', deanDeptId);
      
      const faculty = await UsersModel.getFacultyByDepartment(deanDeptId, false);
      return { faculty };
    } else if (user?.role === 'Program Chair') {
      // Extract the course ID
      const courseId = user.course?._id?.toString() || user.course?.toString();
      console.log('Program Chair fetching faculty with courseId:', courseId);
      
      const faculty = await UsersModel.getFacultyByCourse(courseId, false);
      console.log('Found faculty members:', faculty.length);
      
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
