import { CourseSchema, DepartmentSchema, UserSchema } from '../../../db/schema';
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
    
    // Check for existing course with same code (both active and inactive)
    const existingCourse = await Course.findOne({ 
      courseCode: courseData.courseCode
    });

    if (existingCourse) {
      if (existingCourse.isActive) {
        throw new Error('Course code already exists and is active');
      } else {
        // If course exists but is inactive, reactivate it
        const updatedCourse = await Course.findOneAndUpdate(
          { _id: existingCourse._id },
          { 
            $set: {
              courseTitle: courseData.courseTitle,
              department: courseData.department,
              isActive: true
            }
          },
          { new: true }
        ).populate('department', 'departmentCode departmentName');
        
        return JSON.parse(JSON.stringify(updatedCourse));
      }
    }

    // If no existing course, create new one
    const course = new Course(courseData);
    const savedCourse = await course.save();
    await savedCourse.populate('department', 'departmentCode departmentName');
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

    // Check if courseCode is being changed and if new code exists among active courses
    const newCourseCode = updateData.courseCode?.trim().toUpperCase();
    if (newCourseCode && newCourseCode !== courseCode) {
      const existingCourse = await Course.findOne({
        courseCode: newCourseCode,
        isActive: true
      });

      if (existingCourse) {
        throw new Error('Course code already exists');
      }
    }

    // Find and update the course
    const course = await Course.findOneAndUpdate(
      { courseCode: courseCode },
      { $set: updateData },
      { new: true }
    ).populate('department', 'departmentCode departmentName');

    if (!course) {
      throw new Error('Course not found');
    }

    return JSON.parse(JSON.stringify(course));
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

  async getCoursesByUserRole(userId) {
    try {
      await this.initModel();
      
      // Initialize both Users and Departments models
      const User = mongoose.models.Users || mongoose.model('Users', UserSchema);
      const Department = mongoose.models.Departments || mongoose.model('Departments', DepartmentSchema);

      // First get the user with populated department and course
      const user = await User.findById(userId)
        .populate({
          path: 'department',
          model: Department
        })
        .populate({
          path: 'course',
          model: this.MODEL,
          populate: {
            path: 'department',
            model: Department
          }
        });
      
      if (!user) {
        throw new Error('User not found');
      }

      // If user is a program chair, only return their assigned course
      if (user.role === 'Program Chair' && user.course) {
        return [user.course];
      }

      // For other roles, continue with existing logic
      let query = { isActive: true };
      if (user.role === 'Dean' && user.department) {
        query.department = user.department._id;
      }

      const courses = await this.MODEL.find(query)
        .populate({
          path: 'department',
          model: Department,
          select: 'departmentCode departmentName'
        })
        .lean();

      return courses;
    } catch (error) {
      console.error('Error in getCoursesByUserRole:', error);
      throw error;
    }
  }
}

const coursesModel = new CoursesModel();
export default coursesModel;