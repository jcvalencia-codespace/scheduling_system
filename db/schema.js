import mongoose from 'mongoose';
const { Schema } = mongoose;

const UserSchema = new Schema({
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

const SubjectSchema = new Schema({
  schoolYear: {
    type: String,
    required: true,
  },
  term: {
    type: Number,
    required: true,
    enum: [1, 2, 3],
  },
  subjectCode: {
    type: String,
    required: true,
    unique: true,
  },
  subjectName: {
    type: String,
    required: true,
  },
  lectureHours: {
    type: Number,
    required: true,
    min: 0,
  },
  labHours: {
    type: Number,
    required: true,
    min: 0,
  },
  course: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
  collection: 'subjects'
});


export {
  UserSchema,
  SubjectSchema
};