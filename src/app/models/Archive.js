import mongoose from 'mongoose';
import { AssignSubjectsSchema, SectionSchema, CourseSchema, UserSchema, RoomSchema } from '../../../db/schema';
import connectDB from '../../../lib/mongo';

class ArchiveModel {
  constructor() {
    this.models = {
      AssignSubjects: null,
      Section: null,
      Course: null,
      Users: null,
      Rooms: null  // Add Rooms model
    };
  }

  async initializeModels() {
    try {
      await connectDB();

      // Initialize all required models
      this.models.Course = mongoose.models.Courses || 
        mongoose.model('Courses', CourseSchema);

      this.models.Section = mongoose.models.Sections || 
        mongoose.model('Sections', SectionSchema);

      this.models.AssignSubjects = mongoose.models.AssignSubjects || 
        mongoose.model('AssignSubjects', AssignSubjectsSchema);

      this.models.Users = mongoose.models.Users || 
        mongoose.model('Users', UserSchema);

      this.models.Rooms = mongoose.models.Rooms || 
        mongoose.model('Rooms', RoomSchema);

      return true;
    } catch (error) {
      console.error('Error initializing models:', error);
      throw error;
    }
  }

  async getUpdateHistory(startDate, endDate, academicYear) {
    try {
      await this.initializeModels();
      console.log('Fetching history for academic year:', academicYear); // Debug log

      // Remove the academicYear filter from the initial query
      const assignments = await this.models.AssignSubjects.find()
        .populate({
          path: 'classId',
          model: this.models.Section,
          select: 'sectionName course yearLevel',
          populate: {
            path: 'course',
            model: this.models.Course,
            select: 'courseCode'
          }
        })
        .populate({
          path: 'updateHistory.updatedBy',
          model: this.models.Users,
          select: 'firstName lastName email role course'  // Added role and course
        })
        .select('yearLevel classId updateHistory')
        .lean();

      const history = assignments.reduce((acc, assignment) => {
        if (!assignment?.updateHistory) return acc;

        const historyEntries = assignment.updateHistory
          .filter(entry => {
            if (!entry) return false;
            // Skip academicYear check if no academicYear is provided
            if (!academicYear) return true;
            // Include all entries (including null/undefined academicYear) when academicYear is provided
            const entryYear = entry.academicYear?.toString();
            const targetYear = academicYear?.toString();
            return targetYear === entryYear || !entryYear;
          })
          .map(entry => ({
            _id: entry._id?.toString() || '',
            action: entry.action || 'unknown',
            updatedAt: entry.updatedAt ? new Date(entry.updatedAt).toISOString() : new Date().toISOString(),
            updatedBy: entry.updatedBy ? {
              _id: entry.updatedBy._id?.toString() || '',
              name: `${entry.updatedBy.firstName || ''} ${entry.updatedBy.lastName || ''}`.trim() || 'Unknown User',
              email: entry.updatedBy.email || 'N/A',
              role: entry.updatedBy.role || 'N/A',    // Added role
              course: entry.updatedBy.course || 'N/A'  // Added course
            } : { name: 'System', email: 'N/A', role: 'System', course: 'N/A' },
            classDetails: {
              section: assignment.classId?.sectionName || 'N/A',
              course: assignment.classId?.course?.courseCode || 'N/A',
              yearLevel: assignment.yearLevel || 'N/A'
            },
            academicYear: entry.academicYear || 'N/A' // Add this to track academicYear
          }));

        return [...acc, ...historyEntries];
      }, []);

      return history.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } catch (error) {
      console.error('Error in getUpdateHistory:', error);
      throw error;
    }
  }

  async getSubjectHistory(startDate, endDate, academicYear) {
    try {
      await this.initializeModels();
      
      // Add debug logging
      console.log('Searching for academicYear:', academicYear);

      // Remove the academicYear filter from the initial query
      const subjects = await mongoose.models.Subjects.find()
        .populate({
          path: 'department',
          select: 'departmentCode departmentName'
        })
        .populate({
          path: 'updateHistory.updatedBy',
          model: this.models.Users,
          select: 'firstName lastName email role course'
        })
        .select('subjectCode subjectName department updateHistory')
        .lean();

      const history = subjects.reduce((acc, subject) => {
        if (!subject?.updateHistory) return acc;

        const historyEntries = subject.updateHistory
          .filter(entry => {
            // Add null check and debug logging
            if (!entry) return false;
            // Skip academicYear check if no academicYear is provided
            if (!academicYear) return true;
            // Include all entries (including null/undefined academicYear) when academicYear is provided
            const entryYear = entry.academicYear?.toString();
            const targetYear = academicYear?.toString();
            return targetYear === entryYear || !entryYear;
          })
          .map(entry => ({
            _id: entry._id?.toString() || '',
            action: entry.action || 'unknown',
            updatedAt: entry.updatedAt ? new Date(entry.updatedAt).toISOString() : new Date().toISOString(),
            updatedBy: entry.updatedBy ? {
              _id: entry.updatedBy._id?.toString() || '',
              name: `${entry.updatedBy.firstName || ''} ${entry.updatedBy.lastName || ''}`.trim() || 'Unknown User',
              email: entry.updatedBy.email || 'N/A',
              role: entry.updatedBy.role || 'N/A',
              course: entry.updatedBy.course || 'N/A'
            } : { name: 'System', email: 'N/A', role: 'System', course: 'N/A' },
            subjectCode: subject.subjectCode,
            subjectName: subject.subjectName,
            departmentCode: subject.department?.departmentCode || 'N/A',
            academicYear: entry.academicYear || 'N/A' // Add academicYear to output
          }));

        return [...acc, ...historyEntries];
      }, []);

      // Add debug logging for results
      console.log('Found history entries:', history.length);

      return history.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } catch (error) {
      console.error('Error in getSubjectHistory:', error);
      throw error;
    }
  }

  async getSectionHistory(startDate, endDate, academicYear) {
    try {
      await this.initializeModels();

      // Remove the academicYear filter from the initial query
      const sections = await mongoose.models.Sections.find()
        .populate({
          path: 'course',
          select: 'courseCode courseTitle',
          populate: {
            path: 'department',
            select: 'departmentCode departmentName'
          }
        })
        .populate({
          path: 'updateHistory.updatedBy',
          model: this.models.Users,
          select: 'firstName lastName email role course'
        })
        .select('sectionName yearLevel course updateHistory')
        .lean();

      const history = sections.reduce((acc, section) => {
        if (!section?.updateHistory) return acc;

        const historyEntries = section.updateHistory
          .filter(entry => {
            if (!entry) return false;
            // Skip academicYear check if no academicYear is provided
            if (!academicYear) return true;
            // Include all entries (including null/undefined academicYear) when academicYear is provided
            const entryYear = entry.academicYear?.toString();
            const targetYear = academicYear?.toString();
            return targetYear === entryYear || !entryYear;
          })
          .map(entry => ({
            _id: entry._id?.toString() || '',
            action: entry.action || 'unknown',
            updatedAt: entry.updatedAt ? new Date(entry.updatedAt).toISOString() : new Date().toISOString(),
            updatedBy: entry.updatedBy ? {
              _id: entry.updatedBy._id?.toString() || '',
              name: `${entry.updatedBy.firstName || ''} ${entry.updatedBy.lastName || ''}`.trim() || 'Unknown User',
              email: entry.updatedBy.email || 'N/A',
              role: entry.updatedBy.role || 'N/A',
              course: entry.updatedBy.course || 'N/A'
            } : { name: 'System', email: 'N/A', role: 'System', course: 'N/A' },
            sectionDetails: {
              name: section.sectionName || 'N/A',
              yearLevel: section.yearLevel || 'N/A',
              course: section.course?.courseCode || 'N/A',
              department: section.course?.department?.departmentName || 'N/A'
            },
            academicYear: entry.academicYear || 'N/A' // Add this to track academicYear
          }));

        return [...acc, ...historyEntries];
      }, []);

      return history.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } catch (error) {
      console.error('Error in getSectionHistory:', error);
      throw error;
    }
  }

  async getRoomHistory(startDate, endDate, academicYear) {
    try {
      await this.initializeModels();

      // Remove the academicYear filter from the initial query
      const rooms = await this.models.Rooms.find()
        .populate({
          path: 'department',
          select: 'departmentCode departmentName'
        })
        .populate({
          path: 'updateHistory.updatedBy',
          model: this.models.Users,
          select: 'firstName lastName email role course'
        })
        .select('roomCode roomName capacity isActive department updateHistory')
        .lean();

      const history = rooms.reduce((acc, room) => {
        if (!room?.updateHistory) return acc;

        const historyEntries = room.updateHistory
          .filter(entry => {
            if (!entry) return false;
            // Skip academicYear check if no academicYear is provided
            if (!academicYear) return true;
            // Include all entries (including null/undefined academicYear) when academicYear is provided
            const entryYear = entry.academicYear?.toString();
            const targetYear = academicYear?.toString();
            return targetYear === entryYear || !entryYear;
          })
          .map(entry => ({
            _id: entry._id?.toString() || '',
            action: entry.action || 'unknown',
            updatedAt: entry.updatedAt ? new Date(entry.updatedAt).toISOString() : new Date().toISOString(),
            updatedBy: entry.updatedBy ? {
              _id: entry.updatedBy._id?.toString() || '',
              name: `${entry.updatedBy.firstName || ''} ${entry.updatedBy.lastName || ''}`.trim() || 'Unknown User',
              email: entry.updatedBy.email || 'N/A',
              role: entry.updatedBy.role || 'N/A',
              course: entry.updatedBy.course || 'N/A'
            } : { name: 'System', email: 'N/A', role: 'System', course: 'N/A' },
            roomDetails: {
              code: room.roomCode || 'N/A',
              name: room.roomName || 'N/A',
              capacity: room.capacity || 'N/A',
              status: room.isActive ? 'Active' : 'Inactive',
              department: room.department?.departmentName || 'N/A'
            },
            academicYear: entry.academicYear || 'N/A' // Add this to track academicYear
          }));

        return [...acc, ...historyEntries];
      }, []);

      return history.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } catch (error) {
      console.error('Error in getRoomHistory:', error);
      throw error;
    }
  }
}

const archiveModel = new ArchiveModel();
export default archiveModel;
