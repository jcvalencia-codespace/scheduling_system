'use server';

import coursesModel from '../../../../models/Courses';
import departmentsModel from '../../../../models/Departments';
import { revalidatePath } from 'next/cache';

export async function addCourse(formData) {
  try {
    const courseData = {
      courseCode: formData.get('courseCode')?.trim().toUpperCase(),
      courseTitle: formData.get('courseTitle')?.trim(),
      departmentCode: formData.get('departmentCode')?.trim(),
    };

    // Validate required fields
    const requiredFields = ['courseCode', 'courseTitle', 'departmentCode'];
    for (const field of requiredFields) {
      if (!courseData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    // Check if course code already exists
    const existingCourse = await coursesModel.getCourseByCode(courseData.courseCode);
    if (existingCourse) {
      throw new Error('Course code already exists');
    }

    // Check if department exists
    const department = await departmentsModel.getDepartmentByCode(courseData.departmentCode);
    if (!department) {
      throw new Error('Selected department does not exist');
    }

    const savedCourse = await coursesModel.createCourse(courseData);
    revalidatePath('/maintenance/courses');
    return { success: true, course: savedCourse };
  } catch (error) {
    console.error('Error in addCourse:', error);
    return { error: error.message || 'Failed to create course' };
  }
}

export async function getCourses() {
  try {
    const courses = await coursesModel.getAllCourses();
    return { courses };
  } catch (error) {
    console.error('Error in getCourses:', error);
    return { error: error.message || 'Failed to fetch courses' };
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

export async function editCourse(courseCode, formData) {
  try {
    const updateData = {
      courseTitle: formData.get('courseTitle')?.trim(),
      departmentCode: formData.get('departmentCode')?.trim(),
    };

    // Validate required fields
    if (!updateData.courseTitle || !updateData.departmentCode) {
      throw new Error('All fields are required');
    }

    // Check if department exists
    const department = await departmentsModel.getDepartmentByCode(updateData.departmentCode);
    if (!department) {
      throw new Error('Selected department does not exist');
    }

    const updatedCourse = await coursesModel.updateCourse(courseCode, updateData);
    if (!updatedCourse) {
      throw new Error('Course not found');
    }

    revalidatePath('/maintenance/courses');
    return { success: true, course: updatedCourse };
  } catch (error) {
    console.error('Error in editCourse:', error);
    return { error: error.message || 'Failed to update course' };
  }
}

export async function removeCourse(courseCode) {
  try {
    const deletedCourse = await coursesModel.deleteCourse(courseCode);
    if (!deletedCourse) {
      throw new Error('Course not found');
    }

    revalidatePath('/maintenance/courses');
    return { success: true };
  } catch (error) {
    console.error('Error in removeCourse:', error);
    return { error: error.message || 'Failed to delete course' };
  }
}
