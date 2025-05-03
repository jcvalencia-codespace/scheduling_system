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
    const department = new Department(departmentData);
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

  async updateDepartment(departmentCode, updateData) {
    const Department = await this.initModel();
    const department = await Department.findOneAndUpdate(
      { departmentCode, isActive: true },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    return department ? JSON.parse(JSON.stringify(department)) : null;
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
