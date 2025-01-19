import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  middleName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    trim: true,
    enum: ['Administrator', 'Dean', 'Program Chair', 'Faculty']
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  course: {
    type: String,
    required: true,
    trim: true
  },
  employmentType: {
    type: String,
    required: true,
    enum: ['full-time', 'part-time']
  }
}, {
  timestamps: true,
  collection: 'users'
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);