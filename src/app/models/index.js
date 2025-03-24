import mongoose from 'mongoose';
import {
  UserSchema,
  SubjectSchema,
  DepartmentSchema,
  CourseSchema,
  RoomSchema,
  SectionSchema,
  TermSchema,
  ScheduleSchema
} from '../../../db/schema';

// Register all models
const Users = mongoose.models.Users || mongoose.model('Users', UserSchema);
const Subjects = mongoose.models.Subjects || mongoose.model('Subjects', SubjectSchema);
const Departments = mongoose.models.Departments || mongoose.model('Departments', DepartmentSchema);
const Courses = mongoose.models.Courses || mongoose.model('Courses', CourseSchema);
const Rooms = mongoose.models.Rooms || mongoose.model('Rooms', RoomSchema);
const Sections = mongoose.models.Sections || mongoose.model('Sections', SectionSchema);
const Terms = mongoose.models.Terms || mongoose.model('Terms', TermSchema);
const Schedules = mongoose.models.Schedules || mongoose.model('Schedules', ScheduleSchema);

export {
  Users,
  Subjects,
  Departments,
  Courses,
  Rooms,
  Sections,
  Terms,
  Schedules
};