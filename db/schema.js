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

const DepartmentSchema = new Schema({
  departmentCode: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  departmentName: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  collection: 'departments'
});

const CourseSchema = new Schema({
  courseCode: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  courseTitle: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
  },
  departmentCode: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
    ref: 'Departments',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  collection: 'courses'
});

const RoomSchema = new Schema({
  roomCode: {
    type: String,
    required: [true, 'Room code is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  roomName: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Room type is required'],
    trim: true,
  },
  floor: {
    type: String,
    required: [true, 'Floor is required'],
    trim: true,
    enum: ['1st Floor', '2nd Floor', '3rd Floor', '4th Floor'],
  },
  departmentCode: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
    ref: 'Departments',
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  collection: 'rooms'
});

const SectionSchema = new Schema({
  sectionName: {
    type: String,
    required: [true, 'Section name is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  courseCode: {
    type: String,
    required: [true, 'Course is required'],
    trim: true,
    ref: 'Courses',
  },
  departmentCode: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
    ref: 'Departments',
  },
  yearLevel: {
    type: String,
    required: [true, 'Year level is required'],
    trim: true,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  collection: 'sections'
});

export {
  UserSchema,
  SubjectSchema,
  DepartmentSchema,
  CourseSchema,
  RoomSchema,
  SectionSchema
};