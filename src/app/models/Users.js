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
}

// Create and export a singleton instance
const usersModel = new UsersModel();
export default usersModel;