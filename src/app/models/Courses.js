import { CourseSchema, DepartmentSchema } from '../../../db/schema';
import connectDB from '../../../lib/mongo';
import mongoose from 'mongoose';

class CoursesModel {
  constructor() {
    this.MODEL = null;
    this.DEPARTMENT_MODEL = null;
  }

  async initModel() {
    if (!this.MODEL || !this.DEPARTMENT_MODEL) {
      await connectDB();
      // Initialize Department model first
      this.DEPARTMENT_MODEL = mongoose.models.Departments || mongoose.model("Departments", DepartmentSchema);
      // Then initialize Course model
      this.MODEL = mongoose.models.Courses || mongoose.model("Courses", CourseSchema);
    }
    return this.MODEL;
  }

  async createCourse(courseData) {
    const Course = await this.initModel();
    const course = new Course(courseData);
    const savedCourse = await course.save();
    return JSON.parse(JSON.stringify(savedCourse));
  }

  async getAllCourses() {
    const Course = await this.initModel();
    const courses = await Course.find({ isActive: true })
      .populate('department', 'departmentCode departmentName');
    return JSON.parse(JSON.stringify(courses));
  }

  async getCourseByCode(courseCode) {
    const Course = await this.initModel();
    const course = await Course.findOne({ courseCode, isActive: true });
    return course ? JSON.parse(JSON.stringify(course)) : null;
  }

  async getCourseById(id) {
    const Course = await this.initModel();
    const course = await Course.findOne({ _id: id, isActive: true })
      .populate('department');
    return course ? JSON.parse(JSON.stringify(course)) : null;
  }

  async updateCourse(courseCode, updateData) {
    const Course = await this.initModel();
    const course = await Course.findOneAndUpdate(
      { courseCode, isActive: true },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    return course ? JSON.parse(JSON.stringify(course)) : null;
  }

  async deleteCourse(courseCode) {
    const Course = await this.initModel();
    const course = await Course.findOneAndUpdate(
      { courseCode, isActive: true },
      { $set: { isActive: false } },
      { new: true }
    );
    return course ? JSON.parse(JSON.stringify(course)) : null;
  }

  async getCoursesByDepartment(departmentCode) {
    const Course = await this.initModel();
    const courses = await Course.find({ departmentCode, isActive: true });
    return JSON.parse(JSON.stringify(courses));
  }

  async getCoursesByDepartmentCode(departmentCode) {
    const Course = await this.initModel();
    const Department = this.DEPARTMENT_MODEL;
    
    // First find the department by code
    const department = await Department.findOne({ departmentCode, isActive: true });
    if (!department) {
      return [];
    }
  
    // Then find all courses for this department
    const courses = await Course.find({
      department: department._id,
      isActive: true
    }).lean();
    
    return JSON.parse(JSON.stringify(courses));
  }

  async getAllCoursesWithDepartment() {
    try {
      const Course = await this.initModel();
      const courses = await Course.find({ isActive: true })
        .populate({
          path: 'department',
          select: 'departmentCode departmentName'
        })
        .lean();
      return JSON.parse(JSON.stringify(courses));
    } catch (error) {
      console.error('Error in getAllCoursesWithDepartment:', error);
      throw error;
    }
  }

  async getCoursesByDepartmentId(departmentId) {
    try {
      const Course = await this.initModel();
      const courses = await Course.find({
        department: departmentId,
        isActive: true
      })
      .populate('department', 'departmentCode departmentName')
      .lean();
      
      return JSON.parse(JSON.stringify(courses));
    } catch (error) {
      console.error('Error in getCoursesByDepartmentId:', error);
      throw error;
    }
  }
}

const coursesModel = new CoursesModel();
export default coursesModel;