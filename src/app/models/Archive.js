import mongoose from 'mongoose';
import { AssignSubjectsSchema, SectionSchema, CourseSchema, UserSchema, RoomSchema, ScheduleSchema } from '../../../db/schema';
import connectDB from '../../../lib/mongo';

class ArchiveModel {
  constructor() {
    this.models = {
      AssignSubjects: null,
      Section: null,
      Course: null,
      Users: null,
      Rooms: null,  // Add Rooms model
      Schedules: null, // Add Schedules model
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

      this.models.Schedules = mongoose.models.Schedules || 
        mongoose.model('Schedules', ScheduleSchema);

      return true;
    } catch (error) {
      console.error('Error initializing models:', error);
      throw error;
    }
  }

  async getActiveTerm() {
    try {
      await connectDB();
      
      // Properly serialize the course ObjectId
      const term = await mongoose.model('Terms').findOne({
        status: 'Active',
        isVisible: true
      }).lean();

      if (!term) return null;

      return {
        _id: term._id.toString(),
        academicYear: term.academicYear,
        term: term.term,
        startDate: term.startDate.toISOString(),
        endDate: term.endDate.toISOString(),
        status: term.status,
        isVisible: term.isVisible
      };
    } catch (error) {
      console.error('Error getting active term:', error);
      throw error;
    }
  }

  async getUpdateHistory(startDate, endDate, academicYear, courseId = null) {
    try {
      await this.initializeModels();
      
      console.log('Building query with courseId:', courseId);

      let query = {};
      if (courseId) {
        // Update query to look for assignments where the section's course matches the program chair's course
        const sections = await this.models.Section.find({
          course: new mongoose.Types.ObjectId(courseId),
          isActive: true
        }).select('_id');
        
        const sectionIds = sections.map(s => s._id);
        console.log('Found section IDs:', sectionIds);
        
        query.classId = { $in: sectionIds };
      }

      console.log('Final query:', JSON.stringify(query, null, 2));

      const assignments = await this.models.AssignSubjects.find(query)
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
          select: 'firstName lastName email role course'
        })
        .select('yearLevel classId updateHistory')
        .lean();

      // Process and sanitize the data
      const sanitizedAssignments = assignments.map(assignment => {
        const sanitizedAssignment = JSON.parse(JSON.stringify(assignment));
        
        // Ensure course IDs are properly stringified
        if (sanitizedAssignment.updateHistory) {
          sanitizedAssignment.updateHistory = sanitizedAssignment.updateHistory.map(entry => ({
            ...entry,
            updatedBy: entry.updatedBy ? {
              ...entry.updatedBy,
              course: entry.updatedBy.course ? entry.updatedBy.course.toString() : 'N/A'
            } : null
          }));
        }

        return sanitizedAssignment;
      });

      // Convert to history entries
      const history = sanitizedAssignments.reduce((acc, assignment) => {
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
            _id: entry._id?.toString(),
            action: entry.action || 'unknown',
            updatedAt: entry.updatedAt ? new Date(entry.updatedAt).toISOString() : new Date().toISOString(),
            updatedBy: entry.updatedBy ? {
              _id: entry.updatedBy._id?.toString(),
              name: `${entry.updatedBy.firstName || ''} ${entry.updatedBy.lastName || ''}`.trim() || 'Unknown User',
              email: entry.updatedBy.email || 'N/A',
              role: entry.updatedBy.role || 'N/A',
              course: entry.updatedBy.course || 'N/A'
            } : { name: 'System', email: 'N/A', role: 'System', course: 'N/A' },
            classDetails: {
              section: assignment.classId?.sectionName || 'N/A',
              course: assignment.classId?.course?.courseCode || 'N/A',
              yearLevel: assignment.yearLevel || 'N/A'
            },
            academicYear: entry.academicYear || 'N/A'
          }));

        return [...acc, ...historyEntries];
      }, []);

      return JSON.parse(JSON.stringify(history.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))));
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

  async getScheduleHistory(startDate, endDate, academicYear) {
    try {
      await this.initializeModels();

      const schedules = await this.models.Schedules.find()
        .populate({
          path: 'subject',
          select: 'subjectCode subjectName department',
          populate: {
            path: 'department',
            select: 'departmentCode departmentName _id'
          }
        })
        .populate({
          path: 'section',
          select: 'sectionName course',
          populate: {
            path: 'course',
            select: 'courseCode department',
            populate: {
              path: 'department',
              select: 'departmentCode departmentName _id'
            }
          }
        })
        .populate({
          path: 'faculty',
          select: 'firstName lastName email'
        })
        .populate({
          path: 'updateHistory.updatedBy',
          model: this.models.Users,
          select: 'firstName lastName email role course'
        })
        .populate({
          path: 'term',
          select: 'termNumber term'
        })
        .select('section faculty subject scheduleSlots updateHistory term academicYear')
        .lean();

      const history = schedules.reduce((acc, schedule) => {
        if (!schedule?.updateHistory) return acc;

        const historyEntries = schedule.updateHistory
          .filter(entry => {
            if (!entry) return false;
            if (!academicYear) return true;
            const entryYear = entry.academicYear?.toString();
            const targetYear = academicYear?.toString();
            return targetYear === entryYear || !entryYear;
          })
          .map(entry => {
            const sections = schedule.section?.map(s => ({
              name: s.sectionName || 'N/A',
              course: s.course?.courseCode || 'N/A',
              department: s.course?.department ? {
                id: s.course.department._id.toString(),
                code: s.course.department.departmentCode,
                name: s.course.department.departmentName
              } : null
            })) || [];

            const mainDepartment = sections[0]?.department || null;

            // Handle term data serialization
            const termData = schedule.term ? {
              id: schedule.term._id?.toString(),
              term: schedule.term?.term || null,
              termNumber: schedule.term?.term || null
            } : {
              id: null,
              term: null,
              termNumber: null
            };

            return {
              _id: entry._id?.toString() || '',
              action: entry.action || 'unknown',
              updatedAt: entry.updatedAt ? new Date(entry.updatedAt).toISOString() : new Date().toISOString(),
              updatedBy: entry.updatedBy ? {
                _id: entry.updatedBy._id?.toString() || '',
                name: `${entry.updatedBy.firstName || ''} ${entry.updatedBy.lastName || ''}`.trim() || 'Unknown User',
                email: entry.updatedBy.email || 'N/A',
                role: entry.updatedBy.role || 'N/A',
                course: typeof entry.updatedBy.course === 'string' ? entry.updatedBy.course : entry.updatedBy.course?.toString() || 'N/A'
              } : { name: 'System', email: 'N/A', role: 'System', course: 'N/A' },
              scheduleDetails: {
                sections,
                faculty: schedule.faculty ? {
                  name: `${schedule.faculty.firstName} ${schedule.faculty.lastName}`,
                  id: schedule.faculty._id.toString()
                } : { name: 'TBA', id: null },
                subject: {
                  code: schedule.subject?.subjectCode || 'N/A',
                  name: schedule.subject?.subjectName || 'N/A'
                },
                department: mainDepartment,
                term: termData.term || null,
                termNumber: termData.termNumber || null
              },
              academicYear: entry.academicYear || schedule.academicYear || 'N/A'
            };
          });

        return [...acc, ...historyEntries];
      }, []);

      return history.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } catch (error) {
      console.error('Error in getScheduleHistory:', error);
      throw error;
    }
  }
}

const archiveModel = new ArchiveModel();
export default archiveModel;