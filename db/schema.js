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
    type: Schema.Types.ObjectId,
    ref: 'departments',
    required: function() {
      return this.role !== 'Administrator';
    }
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'courses',
    required: function() {
      return this.role !== 'Administrator';
    }
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
  department: {
    type: Schema.Types.ObjectId,
    ref: 'Departments',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  updateHistory: [{
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'deleted'],
      required: true
    },
    academicYear: {
      type: String,
      required: true
    }
  }],
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
  department: {
    type: Schema.Types.ObjectId,
    ref: 'Departments',  // Changed from 'departments' to 'Departments'
    required: [true, 'Department is required'],
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
  department: {
    type: Schema.Types.ObjectId,
    required: [true, 'Department is required'],
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
  updateHistory: [{
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'deleted', 'reactivated'],
      required: true
    },
    academicYear: {
      type: String,
      required: true  
    }
  }],
}, {
  timestamps: true,
  collection: 'rooms'
});

const SectionSchema = new Schema({
  sectionName: {
    type: String,
    required: [true, 'Section name is required'],
    trim: true,
    uppercase: true,
    index: false // Explicitly prevent index creation
  },
  course: {  // Changed from courseCode
    type: Schema.Types.ObjectId,
    required: [true, 'Course is required'],
    ref: 'Courses',
  },
  department: {
    type: Schema.Types.ObjectId,
    required: [true, 'Department is required'],
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
  updateHistory: [{
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'deleted'],
      required: true
    },
    academicYear: {
      type: String,
      required: true
    }
  }],
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
  },
  isVisible: {
    type: Boolean,
    default: true,
    required: true
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
  academicYear: {
    type: String,
    required: true,
    trim: true
  },
  classId: {
    type: Schema.Types.ObjectId,
    ref: 'Section',
    required: true
  },
  subjects: [{
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    term: {
      type: Number,
      required: true,
      enum: [1, 2, 3]
    },
    termId: {
      type: Schema.Types.ObjectId,
      ref: 'Terms',
      required: true
    },
    hours: {  // Add hours field
      type: Number,
      required: true,
      min: 1
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  updateHistory: [{
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'deleted'],
      required: true
    },
    academicYear: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true,
  collection: 'assignSubjects'
});

TermSchema.index({ academicYear: 1, term: 1 }, { unique: true });
TermSchema.index({ status: 1 });

const ScheduleSlotSchema = new Schema({
  days: [{
    type: String,
    required: true
  }],
  timeFrom: {
    type: String,
    required: true
  },
  timeTo: {
    type: String,
    required: true
  },
  room: {
    type: Schema.Types.ObjectId,
    ref: 'Rooms',
    required: true
  },
  scheduleType: {
    type: String,
    required: true,
    enum: ['lecture', 'laboratory', 'tutorial']
  }
});

const ScheduleSchema = new Schema({
  term: {
    type: Schema.Types.ObjectId,
    ref: 'Terms',
    required: true
  },
  section: [{
    type: Schema.Types.ObjectId,
    ref: 'Sections',
    required: true
  }],
  faculty: {
    type: Schema.Types.ObjectId,
    ref: 'Users',
    default: null
  },
  subject: {
    type: Schema.Types.ObjectId,
    ref: 'Subjects',
    required: true
  },
  classLimit: {
    type: Number,
    required: true
  },
  studentType: {
    type: String,
    required: true
  },
  isPaired: {
    type: Boolean,
    default: false
  },
  isMultipleSections: {
    type: Boolean,
    default: false
  },
  scheduleSlots: [ScheduleSlotSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  // Add update history tracking
  updateHistory: [{
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'deleted'],
      required: true
    },
    academicYear: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true,
  collection: 'schedules'
});

const AdminHourSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  term: {
    type: Schema.Types.ObjectId,
    ref: 'Terms',
    required: true
  },
  slots: [{
    _id: {
      type: Schema.Types.ObjectId,
      auto: true
    },
    day: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled','deleted'],
      default: 'pending'
    },
    rejectionReason: String,
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Users'
    },
    approvalDate: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  needsApproval: {
    type: Boolean,
    default: true,
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Users'
  },
  approvalDate: Date,
  rejectionReason: String,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  updateHistory: [{
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'deleted', 'approved', 'rejected'],
      required: true
    },
    academicYear: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true,
  collection: 'adminHours'
});

const NotificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'Users',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['success', 'warning', 'error', 'info'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  relatedSchedule: {
    type: Schema.Types.ObjectId,
    ref: 'Schedules',
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // 30 days
  }
}, {
  timestamps: true,
  collection: 'notifications'
});

const ChatSchema = new Schema({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  }],
  messages: [{
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    readBy: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'Users'
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastMessage: {
    type: Date,
    default: Date.now
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  groupName: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'chats'
});

// Index for efficient querying
ChatSchema.index({ participants: 1, lastMessage: -1 });
ChatSchema.index({ 'messages.sender': 1, 'messages.createdAt': -1 });

const AccessSettingsSchema = new Schema({
  role: {
    type: String,
    required: true,
    enum: ['Dean', 'Program Chair'],
    unique: true
  },
  settings: {
    showMultipleSections: {
      type: Boolean,
      default: true
    },
    showFacultyDropdown: {
      type: Boolean,
      default: true
    }
  },
  updateHistory: [{
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  collection: 'accessSettings'
});

export {
  UserSchema,
  SubjectSchema,
  DepartmentSchema,
  CourseSchema,
  RoomSchema,
  SectionSchema,
  TermSchema,
  FeedbackSchema,
  AssignSubjectsSchema,
  ScheduleSchema,
  AdminHourSchema,
  NotificationSchema,
  ChatSchema,
  AccessSettingsSchema
};