import { UserSchema, CourseSchema } from '../../../db/schema';
import connectDB from '../../../lib/mongo';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Departments, Courses } from './index';
import coursesModel from './Courses';

class UsersModel {
  constructor() {
    this.MODEL = null;
  }

  async initModel() {
    if (!this.MODEL) {
      await connectDB();
      this.MODEL = mongoose.models.Users || mongoose.model("Users", UserSchema);
    }
    return this.MODEL;
  }

  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  toPlainObject(doc) {
    if (!doc) return null;
    const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    return {
      ...obj,
      _id: obj._id.toString(),
      createdAt: obj.createdAt?.toISOString(),
      updatedAt: obj.updatedAt?.toISOString(),
      department: obj.department?._id ? {
        ...obj.department,
        _id: obj.department._id.toString()
      } : obj.department,
      course: obj.course?._id ? {
        ...obj.course,
        _id: obj.course._id.toString()
      } : obj.course,
    };
  }

  async createUser(userData) {
    try {
      const User = await this.initModel();
      if (userData.role === 'Administrator') {
        delete userData.department;
        delete userData.course;
      }

      if (userData.password) {
        userData.password = await this.hashPassword(userData.password);
      }
      
      const user = new User(userData);
      const savedUser = await user.save();
      
      // Convert to plain object and handle dates
      const plainUser = savedUser.toObject();
      return {
        ...plainUser,
        _id: plainUser._id.toString(),
        createdAt: plainUser.createdAt?.toISOString(),
        updatedAt: plainUser.updatedAt?.toISOString(),
        department: plainUser.department?._id ? {
          ...plainUser.department,
          _id: plainUser.department._id.toString()
        } : plainUser.department,
        course: plainUser.course?._id ? {
          ...plainUser.course,
          _id: plainUser.course._id.toString()
        } : plainUser.course,
      };
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }

  async getAllUsers() {
    try {
      const User = await this.initModel();
      const users = await User.find({})
        .select('-password')
        .populate({
          path: 'department',
          model: Departments,
          select: 'departmentCode departmentName'
        })
        .populate({
          path: 'course',
          model: Courses,
          select: 'courseCode courseTitle'
        })
        .lean();
      return users.map(user => this.toPlainObject(user));
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw error;
    }
  }

  async getUserByEmail(email) {
    const User = await this.initModel();
    const user = await User.findOne({ email });
    return user ? this.toPlainObject(user) : null;
  }

  async updateUser(userId, updateData) {
    try {
      const User = await this.initModel();
      if (updateData.role === 'Administrator') {
        delete updateData.department;
        delete updateData.course;
      }

      // Hash password if it's being updated
      if (updateData.password) {
        updateData.password = await this.hashPassword(updateData.password);
      }

      const user = await User.findByIdAndUpdate(userId, updateData, { 
        new: true, 
        runValidators: true 
      }).lean();

      return this.toPlainObject(user);
    } catch (error) {
      console.error('Error in updateUser:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    const User = await this.initModel();
    const deletedUser = await User.findByIdAndDelete(userId).lean();
    return this.toPlainObject(deletedUser);
  }

  async validatePassword(user, password) {
    return bcrypt.compare(password, user.password);
  }

  async getFacultyUsers(departmentId = null) {
    try {
      const Users = await this.initModel();
      
      // Use aggregation pipeline for more control and debugging
      const faculty = await Users.aggregate([
        // First stage: Match users that aren't administrators
        {
          $match: {
            role: { $ne: 'Administrator' }
          }
        },
        // Second stage: Sort by lastName and firstName
        {
          $sort: {
            lastName: 1,
            firstName: 1
          }
        },
        // Third stage: Project only the fields we need
        {
          $project: {
            _id: 1,
            lastName: 1,
            firstName: 1,
            middleName: 1,
            email: 1,
            role: 1,
            department: 1,
            course: 1,
            employmentType: 1
          }
        },
        // Fourth stage: Add a stage to count documents (for debugging)
        {
          $facet: {
            faculty: [{ $match: {} }],
            totalCount: [{ $count: 'count' }]
          }
        }
      ]);

      console.log('Aggregation result:', JSON.stringify(faculty, null, 2));
      
      // Extract faculty array from aggregation result
      const facultyData = faculty[0]?.faculty || [];
      const totalCount = faculty[0]?.totalCount[0]?.count || 0;
      
      console.log(`Found ${totalCount} faculty members`);

      return JSON.parse(JSON.stringify(faculty));
    } catch (error) {
      console.error('Error in getFacultyUsers:', error);
      throw error;
    }
  }

  async getFacultyByDepartment(departmentId = null, isAdmin = false) {
    try {
      const User = await this.initModel();
      
      // Build the query based on parameters
      const query = isAdmin 
        ? { role: { $in: ['Faculty', 'Program Chair', 'Dean'] } }
        : departmentId
          ? {
              role: { $in: ['Faculty', 'Program Chair'] },
              $or: [
                { department: new mongoose.Types.ObjectId(departmentId) },
                { 'department._id': new mongoose.Types.ObjectId(departmentId) }
              ]
            }
          : { role: { $in: ['Faculty', 'Program Chair'] } };

      console.log('Faculty by department query:', JSON.stringify(query));

      const faculty = await User.find(query)
        .select('firstName lastName employmentType department course')
        .populate({
          path: 'department',
          model: Departments
        })
        .populate({
          path: 'course',
          model: Courses
        })
        .sort({ lastName: 1, firstName: 1 });

      console.log(`Found ${faculty.length} faculty members for department ${departmentId}`);
      return faculty.map(member => this.toPlainObject(member));
    } catch (error) {
      console.error('Error in getFacultyByDepartment:', error);
      throw error;
    }
  }

  async getFacultyByCourse(courseId = null, isAdmin = false) {
    try {
      const User = await this.initModel();
      const query = isAdmin 
        ? { role: { $in: ['Faculty', 'Program Chair', 'Dean'] } }
        : courseId
          ? {
              role: { $in: ['Faculty', 'Program Chair'] },
              $or: [
                { course: new mongoose.Types.ObjectId(courseId) },
                { 'course._id': new mongoose.Types.ObjectId(courseId) }
              ]
            }
          : { role: { $in: ['Faculty', 'Program Chair'] } };

      console.log('Faculty by course query:', JSON.stringify(query));

      const faculty = await User.find(query)
        .select('firstName lastName employmentType department course')
        .populate({
          path: 'department',
          model: Departments
        })
        .populate({
          path: 'course',
          model: Courses
        })
        .sort({ lastName: 1, firstName: 1 });

      console.log(`Found ${faculty.length} faculty members for course ${courseId}`);
      return faculty.map(member => this.toPlainObject(member));
    } catch (error) {
      console.error('Error in getFacultyByCourse:', error);
      throw error;
    }
  }

  async getDepartments() {
    try {
      const departments = await Departments.find({ isActive: true })
        .select('departmentCode departmentName')
        .sort({ departmentName: 1 });
      return departments.map(department => this.toPlainObject(department));
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  async getCoursesByDepartment(departmentId) {
    return coursesModel.getCoursesByDepartmentId(departmentId);
  }

  async getAllCourses() {
    try {
      const Course = mongoose.models.courses || mongoose.model('courses', CourseSchema);
      const courses = await Course.find({ isActive: true })
        .populate('department')
        .sort({ courseCode: 1 });
      return courses.map(course => this.toPlainObject(course));
    } catch (error) {
      console.error('Error in getAllCourses:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const usersModel = new UsersModel();
export default usersModel;