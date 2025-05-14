import { DepartmentSchema } from '../../../db/schema';
import connectDB from '../../../lib/mongo';
import mongoose from 'mongoose';

class DepartmentsModel {
  constructor() {
    this.MODEL = null;
  }

  async initModel() {
    if (!this.MODEL) {
      await connectDB();
      this.MODEL = mongoose.models.Departments || mongoose.model("Departments", DepartmentSchema);
    }
    return this.MODEL;
  }

  async createDepartment(departmentData) {
    const Department = await this.initModel();
    
    // Check only active departments for duplicates
    const existingActiveDepartment = await this.getDepartmentByCodeAndStatus(
      departmentData.departmentCode, 
      true
    );
    
    if (existingActiveDepartment) {
      throw new Error('Department code already exists');
    }

    // If no active department exists with this code, check for inactive one
    const existingInactiveDepartment = await this.getDepartmentByCodeAndStatus(
      departmentData.departmentCode, 
      false
    );

    if (existingInactiveDepartment) {
      // Reactivate the department
      const reactivated = await Department.findByIdAndUpdate(
        existingInactiveDepartment._id,
        {
          ...departmentData,
          isActive: true
        },
        { new: true }
      );
      return JSON.parse(JSON.stringify(reactivated));
    }

    // Create new department if no existing department found
    const department = new Department({
      ...departmentData,
      isActive: true
    });
    
    const savedDepartment = await department.save();
    return JSON.parse(JSON.stringify(savedDepartment));
  }

  async getAllDepartments() {
    const Department = await this.initModel();
    const departments = await Department.find({ isActive: true });
    return JSON.parse(JSON.stringify(departments));
  }

  async getDepartmentByCode(departmentCode) {
    const Department = await this.initModel();
    const department = await Department.findOne({ departmentCode, isActive: true });
    return department ? JSON.parse(JSON.stringify(department)) : null;
  }

  async getDepartmentById(id) {
    const Department = await this.initModel();
    const department = await Department.findOne({ _id: id, isActive: true });
    return department ? JSON.parse(JSON.stringify(department)) : null;
  }

  async getDepartmentByCodeAndStatus(departmentCode, isActive = true) {
    const Department = await this.initModel();
    const department = await Department.findOne({ 
      departmentCode, 
      isActive 
    });
    return department ? JSON.parse(JSON.stringify(department)) : null;
  }

  async updateDepartment(departmentCode, updateData) {
    const Department = await this.initModel();
    
    // Get original department
    const originalDepartment = await Department.findOne({ 
      departmentCode: updateData.originalCode || departmentCode,
      isActive: true 
    });

    if (!originalDepartment) {
      throw new Error('Department not found');
    }

    // Update department with new code and name
    const updatedDepartment = await Department.findByIdAndUpdate(
      originalDepartment._id,
      { 
        departmentCode: updateData.departmentCode,
        departmentName: updateData.departmentName 
      },
      { new: true }
    );

    return updatedDepartment;
  }

  async deleteDepartment(departmentCode) {
    const Department = await this.initModel();
    const department = await Department.findOneAndUpdate(
      { departmentCode, isActive: true },
      { $set: { isActive: false } },
      { new: true }
    );
    return department ? JSON.parse(JSON.stringify(department)) : null;
  }
}

const departmentsModel = new DepartmentsModel();
export default departmentsModel;