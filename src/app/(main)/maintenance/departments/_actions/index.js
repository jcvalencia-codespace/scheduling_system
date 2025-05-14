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

    // Check only active departments for duplicates
    const existingDepartment = await departmentsModel.getDepartmentByCodeAndStatus(
      departmentData.departmentCode,
      true // only check active departments
    );
    
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
    return { departments: JSON.parse(JSON.stringify(departments)) };
  } catch (error) {
    console.error('Error in getDepartments:', error);
    return { error: error.message || 'Failed to fetch departments' };
  }
}

export async function editDepartment(departmentCode, formData) {
  try {
    const updateData = {
      departmentCode: formData.get('departmentCode')?.trim().toUpperCase(),
      departmentName: formData.get('departmentName')?.trim(),
      originalCode: formData.get('originalCode')
    };

    if (!updateData.departmentName || !updateData.departmentCode) {
      throw new Error('Department code and name are required');
    }

    if (updateData.departmentCode !== updateData.originalCode) {
      const existingDepartment = await departmentsModel.getDepartmentByCodeAndStatus(
        updateData.departmentCode,
        true
      );
      if (existingDepartment) {
        throw new Error('Department code already exists');
      }
    }

    const updatedDepartment = await departmentsModel.updateDepartment(departmentCode, updateData);
    if (!updatedDepartment) {
      throw new Error('Department not found');
    }

    revalidatePath('/maintenance/departments');
    return { 
      success: true, 
      department: JSON.parse(JSON.stringify(updatedDepartment)) 
    };
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
    // Serialize the department object to ensure it's a plain JavaScript object
    const serializedDepartment = JSON.parse(JSON.stringify(department));
    return { success: true, department: serializedDepartment };
  } catch (error) {
    console.error('Error in getDepartmentById:', error);
    return { error: error.message || 'Failed to fetch department' };
  }
}

export async function getDepartmentDetails(departmentCode) {
  try {
    const department = await departmentsModel.getDepartmentByCode(departmentCode);
    if (!department) {
      throw new Error('Department not found');
    }
    // Serialize the department object to ensure it's a plain JavaScript object
    const serializedDepartment = JSON.parse(JSON.stringify(department));
    return { success: true, department: serializedDepartment };
  } catch (error) {
    console.error('Error in getDepartmentDetails:', error);
    return { error: error.message || 'Failed to fetch department' };
  }
}
