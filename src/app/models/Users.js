import { UserSchema } from '../../../db/schema';
import connectDB from '../../../lib/mongo';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

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

  async getAllUsers() {
    const User = await this.initModel();
    const users = await User.find({}).select('-password');
    return JSON.parse(JSON.stringify(users));
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
    ).select('-password');

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

  async getFacultyUsers() {
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
      
      return JSON.parse(JSON.stringify(facultyData));
    } catch (error) {
      console.error('Error in getFacultyUsers:', error);
      throw error;
    }
  }

  async getAllUsersForChat() {
    try {
      const Users = await this.initModel();
      const users = await Users.aggregate([
        {
          $sort: {
            lastName: 1,
            firstName: 1
          }
        },
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
        }
      ]);
      
      return JSON.parse(JSON.stringify(users));
    } catch (error) {
      console.error('Error in getAllUsersForChat:', error);
      throw error;
    }
  }

  async find() {
    try {
      const User = await this.initModel();
      if (!User) {
        console.error('Failed to initialize User model');
        return [];
      }

      const users = await User.find(
        { isActive: { $ne: false } }
      ).lean().exec();

      // Properly serialize ObjectIds
      const serializedUsers = users.map(user => ({
        ...user,
        _id: user._id.toString()
      }));

      console.log('Users found in database:', serializedUsers?.length);
      return serializedUsers;
    } catch (error) {
      console.error('Error in find:', error);
      return [];
    }
  }

  async findById(userId) {
    try {
      const User = await this.initModel();
      const user = await User.findById(userId)
        .select('-password')
        .lean()
        .exec();

      if (!user) return null;

      return {
        ...user,
        _id: user._id.toString()
      };
    } catch (error) {
      console.error('Error in findById:', error);
      return null;
    }
  }

  async getAvailableUsersForChat(currentUserId) {
    try {
      const Users = await this.initModel();
      const users = await Users.aggregate([
        {
          $match: {
            _id: { $ne: new mongoose.Types.ObjectId(currentUserId) }
          }
        },
        {
          $sort: {
            lastName: 1,
            firstName: 1
          }
        },
        {
          $project: {
            _id: 1,
            lastName: 1,
            firstName: 1,
            email: 1,
            role: 1,
            department: 1,
            profileImage: 1,
            status: { $literal: "offline" } // You can update this with real status later
          }
        }
      ]);
      
      return JSON.parse(JSON.stringify(users));
    } catch (error) {
      console.error('Error in getAvailableUsersForChat:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const usersModel = new UsersModel();
export default usersModel;