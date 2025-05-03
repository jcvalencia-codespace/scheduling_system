'use server';

import departmentsModel from '../../../../models/Departments';
import coursesModel from '../../../../models/Courses';
import { revalidatePath } from 'next/cache';

export async function addDepartment(formData) {
  try {
    const departmentData = {
      departmentCode: formData.get('departmentCode')?.trim().toUpperCase(),
      departmentName: formData.get('departmentName')?.trim(),
    };

    // Validate required fields
    const requiredFields = ['departmentCode', 'departmentName'];
    for (const field of requiredFields) {
      if (!departmentData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    // Check if department code already exists
    const existingDepartment = await departmentsModel.getDepartmentByCode(departmentData.departmentCode);
    if (existingDepartment) {
      throw new Error('Department code already exists');
    }

    const savedDepartment = await departmentsModel.createDepartment(departmentData);
    revalidatePath('/maintenance/departments');
    return { success: true, department: savedDepartment };
  } catch (error) {
    console.error('Error in addDepartment:', error);
    return { error: error.message || 'Failed to create department' };
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

export async function editDepartment(departmentCode, formData) {
  try {
    const updateData = {
      departmentName: formData.get('departmentName')?.trim(),
    };

    // Validate required fields
    if (!updateData.departmentName) {
      throw new Error('Department name is required');
    }

    const updatedDepartment = await departmentsModel.updateDepartment(departmentCode, updateData);
    if (!updatedDepartment) {
      throw new Error('Department not found');
    }

    revalidatePath('/maintenance/departments');
    return { success: true, department: updatedDepartment };
  } catch (error) {
    console.error('Error in editDepartment:', error);
    return { error: error.message || 'Failed to update department' };
  }
}

export async function removeDepartment(departmentCode) {
  try {
    const deletedDepartment = await departmentsModel.deleteDepartment(departmentCode);
    if (!deletedDepartment) {
      throw new Error('Department not found');
    }

    revalidatePath('/maintenance/departments');
    return { success: true };
  } catch (error) {
    console.error('Error in removeDepartment:', error);
    return { error: error.message || 'Failed to delete department' };
  }
}

export async function getCoursesByDepartment(departmentCode) {
  try {
    const courses = await coursesModel.getCoursesByDepartmentCode(departmentCode);
    return { courses };
  } catch (error) {
    console.error('Error in getCoursesByDepartment:', error);
    return { error: error.message || 'Failed to fetch courses' };
  }
}

export async function getDepartmentById(departmentId) {
  try {
    const department = await departmentsModel.getDepartmentById(departmentId);
    if (!department) {
      throw new Error('Department not found');
    }
    return { success: true, department };
  } catch (error) {
    console.error('Error in getDepartmentById:', error);
    return { error: error.message || 'Failed to fetch department' };
  }
}
