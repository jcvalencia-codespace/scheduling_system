"use server"

import archiveModel from '@/app/models/Archive';

import coursesModel from "@/app/models/Courses";

export async function getCourses(departmentId = null) {
  try {
    console.log('Fetching courses for department:', departmentId);
    const courses = departmentId 
      ? await coursesModel.getCoursesByDepartmentId(departmentId)
      : await coursesModel.getAllCourses();
    return { courses };
  } catch (error) {
    console.error('Error in getCourses action:', error);
    return { error: 'Failed to fetch courses' };
  }
}

export async function getScheduleHistory(startDate, endDate, academicYear) {
  try {
    const history = await archiveModel.getScheduleHistory(startDate, endDate, academicYear);
    return history;
  } catch (error) {
    console.error('Error in getScheduleHistory action:', error);
    return { error: 'Failed to fetch schedule history' };
  }
}