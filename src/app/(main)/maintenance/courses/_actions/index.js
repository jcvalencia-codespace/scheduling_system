'use server';

import coursesModel from '../../../../models/Courses';
import departmentsModel from '../../../../models/Departments';
import { revalidatePath } from 'next/cache';

export async function addCourse(formData) {
  try {
    const courseData = {
      courseCode: formData.get('courseCode')?.trim().toUpperCase(),
      courseTitle: formData.get('courseTitle')?.trim(),
      department: formData.get('departmentCode')?.trim(), // Keep form field name but map to department
    };

    // Validate required fields
    const requiredFields = ['courseCode', 'courseTitle', 'department'];
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

    // Check if department exists and get its ObjectId
    const department = await departmentsModel.getDepartmentByCode(courseData.department);
    if (!department) {
      throw new Error('Selected department does not exist');
    }
    courseData.department = department._id; // Use the department's ObjectId

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
    return { departments: JSON.parse(JSON.stringify(departments)) };
  } catch (error) {
    console.error('Error fetching departments:', error);
    return { error: 'Failed to fetch departments' };
  }
}

export async function editCourse(originalCourseCode, formData) {
  try {
    // Get department to get its _id
    const department = await departmentsModel.getDepartmentByCode(
      formData.get('departmentCode')?.trim()
    );
    if (!department) {
      throw new Error('Selected department does not exist');
    }

    const updateData = {
      courseCode: formData.get('courseCode')?.trim().toUpperCase(),
      courseTitle: formData.get('courseTitle')?.trim(),
      department: department._id // Use department's ObjectId
    };

    // Update course directly using the model
    const updatedCourse = await coursesModel.updateCourse(originalCourseCode, updateData);
    
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
