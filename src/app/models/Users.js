import { User } from '../../../db/schema';
import connectDB from '../../../lib/mongo';
import bcrypt from 'bcryptjs';

export async function createUser(userData) {
  await connectDB();
  
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  const user = new User({
    ...userData,
    password: hashedPassword
  });
  
  const savedUser = await user.save();
  return JSON.parse(JSON.stringify(savedUser));
}

export async function getUserByEmail(email) {
  await connectDB();
  const user = await User.findOne({ email });
  return user ? JSON.parse(JSON.stringify(user)) : null;
}

export async function getAllUsers() {
  await connectDB();
  const users = await User.find({}).select('-password');
  return JSON.parse(JSON.stringify(users));
}

export async function updateUser(userId, updateData) {
  await connectDB();
  
  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }
  
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true }
  ).select('-password');

  return JSON.parse(JSON.stringify(updatedUser));
}

export async function deleteUser(userId) {
  await connectDB();
  const deletedUser = await User.findByIdAndDelete(userId);
  return JSON.parse(JSON.stringify(deletedUser));
}

export async function validatePassword(user, password) {
  return bcrypt.compare(password, user.password);
}