import { UserSchema } from '../../../db/schema';
import connectDB from '../../../lib/mongo';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Departments, Courses } from './index';

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
        });
      return JSON.parse(JSON.stringify(users));
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw error;
    }
  }

  async createUser(userData) {
    const User = await this.initModel();
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = new User({
      ...userData,
      password: hashedPassword
    });
    
    const savedUser = await user.save();
    return JSON.parse(JSON.stringify(savedUser));
  }

  async getUserByEmail(email) {
    const User = await this.initModel();
    const user = await User.findOne({ email });
    return user ? JSON.parse(JSON.stringify(user)) : null;
  }

  async updateUser(userId, updateData) {
    const User = await this.initModel();
    
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    )
    .select('-password')
    .populate('department', 'departmentCode departmentName')
    .populate('course', 'courseCode courseTitle');

    return updatedUser ? JSON.parse(JSON.stringify(updatedUser)) : null;
  }

  async deleteUser(userId) {
    const User = await this.initModel();
    const deletedUser = await User.findByIdAndDelete(userId);
    return deletedUser ? JSON.parse(JSON.stringify(deletedUser)) : null;
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
      // If admin, fetch all faculty regardless of department
      const query = isAdmin 
        ? { role: { $in: ['Faculty', 'Program Chair', 'Dean'] } }
        : {
            role: { $in: ['Faculty', 'Program Chair', 'Dean'] },
            ...(departmentId && { department: new mongoose.Types.ObjectId(departmentId) })
          };

      const faculty = await User.find(query)
        .select('firstName lastName employmentType department')
        .populate({
          path: 'department',
          model: Departments
        })
        .sort({ lastName: 1, firstName: 1 });

      return JSON.parse(JSON.stringify(faculty));
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
        : {
            role: { $in: ['Faculty', 'Program Chair'] },
            ...(courseId && { course: new mongoose.Types.ObjectId(courseId) })
          };

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

      return JSON.parse(JSON.stringify(faculty));
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
      return JSON.parse(JSON.stringify(departments));
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  }

  async getCoursesByDepartment(departmentId) {
    try {
      const courses = await Courses.find({ 
        department: departmentId,
        isActive: true 
      })
        .select('courseCode courseTitle')
        .sort({ courseTitle: 1 });
      return JSON.parse(JSON.stringify(courses));
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const usersModel = new UsersModel();
export default usersModel;