import {
  Sections,
  Users,
  Subjects,
  Rooms
} from './index';

import mongoose from 'mongoose';
import { ScheduleSchema } from '../../../db/schema';

// Define the model at the top
const Schedules = mongoose.models.Schedules || mongoose.model('Schedules', ScheduleSchema);

export default class SchedulesModel {
  static async getSections() {
    try {
      const sections = await Sections.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: 'courses',
            localField: 'courseCode',
            foreignField: 'courseCode',
            as: 'course'
          }
        },
        { $unwind: '$course' },
        {
          $project: {
            _id: 1,
            sectionName: 1,
            courseCode: 1,
            courseName: '$course.courseTitle'
          }
        },
        { $sort: { sectionName: 1 } }
      ]);
      return sections;
    } catch (error) {
      console.error('Section fetch error:', error);
      throw new Error('Failed to fetch sections');
    }
  }

  static async getFaculty() {
    try {
      const faculty = await Users.aggregate([
        {
          $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            department: 1,
            employmentType: 1,
            role: 1,
            fullName: {
              $concat: [
                '$lastName',
                ', ',
                '$firstName',
                ' (',
                '$department',
                ' - ',
                '$role',
                ')'
              ]
            }
          }
        },
        { $sort: { lastName: 1, firstName: 1 } }
      ]);
      
      console.log('Fetched users:', faculty); // Debug log
      return faculty;
    } catch (error) {
      console.error('Users fetch error:', error);
      throw new Error('Failed to fetch users');
    }
  }

  static async getSubjects() {
    try {
      const subjects = await Subjects.aggregate([
        { $match: { isActive: true } },
        {
          $project: {
            _id: 1,
            subjectCode: 1,
            subjectName: 1,
            displayName: { $concat: ['$subjectCode', ' - ', '$subjectName'] }
          }
        },
        { $sort: { subjectCode: 1 } }
      ]);
      return subjects;
    } catch (error) {
      console.error('Subjects fetch error:', error);
      throw new Error('Failed to fetch subjects');
    }
  }

  static async getRooms() {
    try {
      const rooms = await Rooms.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: 'departments',
            localField: 'departmentCode',
            foreignField: 'departmentCode',
            as: 'department'
          }
        },
        { $unwind: '$department' },
        {
          $project: {
            _id: 1,
            roomCode: 1,
            roomName: 1,
            capacity: 1,
            type: 1,
            floor: 1,
            displayName: { $concat: ['$roomCode', ' - ', '$roomName'] }
          }
        },
        { $sort: { roomCode: 1 } }
      ]);
      return rooms;
    } catch (error) {
      console.error('Rooms fetch error:', error);
      throw new Error('Failed to fetch rooms');
    }
  }

  static async createSchedule(scheduleData) {
    try {
      // Format time strings to ensure consistent format
      const formatTime = (timeStr) => {
        // Time is already in 12-hour format from the frontend
        // Just ensure consistent formatting
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':');
        return `${hours}:${minutes} ${period.toUpperCase()}`;
      };
      
      const schedule = await Schedules.create({
        ...scheduleData,
        term: new mongoose.Types.ObjectId(scheduleData.term),
        section: new mongoose.Types.ObjectId(scheduleData.section),
        faculty: new mongoose.Types.ObjectId(scheduleData.faculty),
        subject: new mongoose.Types.ObjectId(scheduleData.subject),
        room: new mongoose.Types.ObjectId(scheduleData.room),
        timeFrom: formatTime(scheduleData.timeFrom),
        timeTo: formatTime(scheduleData.timeTo)
      });
      return schedule;
    } catch (error) {
      console.error('Schedule creation error:', error);
      throw new Error('Failed to create schedule: ' + error.message);
    }
  }

  static async getSchedules(query = {}) {
    try {
      const schedules = await Schedules.aggregate([
        { $match: { isActive: true, ...query } },
        // Add term lookup
        {
          $lookup: {
            from: 'terms',
            localField: 'term',
            foreignField: '_id',
            as: 'term'
          }
        },
        // Add existing lookups
        {
          $lookup: {
            from: 'sections',
            localField: 'section',
            foreignField: '_id',
            as: 'section'
          }
        },
        {
          $lookup: {
            from: 'subjects',
            localField: 'subject',
            foreignField: '_id',
            as: 'subject'
          }
        },
        {
          $lookup: {
            from: 'rooms',
            localField: 'room',
            foreignField: '_id',
            as: 'room'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'faculty',
            foreignField: '_id',
            as: 'faculty'
          }
        },
        // Unwind term along with other arrays
        { $unwind: '$term' },
        { $unwind: '$section' },
        { $unwind: '$subject' },
        { $unwind: '$room' },
        { $unwind: '$faculty' },
        {
          $project: {
            _id: 1,
            days: 1,
            timeFrom: 1,
            timeTo: 1,
            classLimit: 1,
            scheduleType: 1,
            studentType: 1,
            isPaired: 1,
            isActive: 1,
            // Add term projection
            term: {
              _id: '$term._id',
              term: '$term.term',
              academicYear: '$term.academicYear'
            },
            section: {
              _id: '$section._id',
              sectionName: '$section.sectionName'
            },
            subject: {
              _id: '$subject._id',
              subjectCode: '$subject.subjectCode',
              subjectName: '$subject.subjectName'
            },
            room: {
              _id: '$room._id',
              roomCode: '$room.roomCode',
              roomName: '$room.roomName'
            },
            faculty: {
              _id: '$faculty._id',
              firstName: '$faculty.firstName',
              lastName: '$faculty.lastName',
              fullName: {
                $concat: ['$faculty.lastName', ', ', '$faculty.firstName']
              }
            }
          }
        }
      ]);
      return schedules;
    } catch (error) {
      console.error('Schedules fetch error:', error);
      throw new Error('Failed to fetch schedules');
    }
  }

  

}