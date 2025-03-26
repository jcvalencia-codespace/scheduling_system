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
    type: Schema.Types.ObjectId,
    ref: 'Courses',
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

const TermSchema = new Schema({
  academicYear: {
    type: String,
    required: true,
    trim: true
  },
  term: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Inactive'],
    default: 'Inactive'
  }
}, {
  timestamps: true,
  collection: 'terms'
});

const FeedbackSchema = new Schema({
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['suggestion', 'bug', 'feature', 'other'],
    default: 'suggestion'
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  status: {
    type: String,
    required: true,
    enum: ['submitted', 'in-review', 'resolved', 'rejected'],
    default: 'submitted'
  },
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Users',
    required: [true, 'User is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'feedback'
});

const AssignSubjectsSchema = new Schema({
  yearLevel: {
    type: String,
    required: true,
    enum: ['1st', '2nd', '3rd', '4th', 'grad']
  },
  term: {
    type: Number,
    required: true,
    enum: [1, 2, 3]
  },
  classId: {
    type: Schema.Types.ObjectId,
    ref: 'Section',
    required: true
  },
  subjects: [{
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  }]
}, {
  timestamps: true,
  collection: 'assignSubjects'
});

TermSchema.index({ academicYear: 1, term: 1 }, { unique: true });
TermSchema.index({ status: 1 });

export {
  UserSchema,
  SubjectSchema,
  DepartmentSchema,
  CourseSchema,
  RoomSchema,
  SectionSchema,
  TermSchema,
  FeedbackSchema,
  AssignSubjectsSchema
};