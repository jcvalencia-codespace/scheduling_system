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
            localField: 'course',
            foreignField: '_id',
            as: 'course'
          }
        },
        { $unwind: '$course' },
        {
          $lookup: {
            from: 'departments',
            localField: 'course.department',
            foreignField: '_id',
            as: 'department'
          }
        },
        { $unwind: '$department' },
        {
          $project: {
            _id: 1,
            sectionName: 1,
            yearLevel: 1,
            course: {
              _id: '$course._id',
              courseCode: '$course.courseCode',
              courseTitle: '$course.courseTitle',
              department: {
                _id: '$department._id',
                departmentCode: '$department.departmentCode',
                departmentName: '$department.departmentName'
              }
            },
            displayName: {
              $concat: [
                '$sectionName',
                ' (',
                '$course.courseCode',
                ' - ',
                { $toString: '$yearLevel' },
                ')'
              ]
            }
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
            localField: 'department',  // Changed from departmentCode
            foreignField: '_id',       // Changed to _id
            as: 'departmentInfo'
          }
        },
        { $unwind: '$departmentInfo' },
        {
          $project: {
            _id: 1,
            roomCode: 1,
            roomName: 1,
            capacity: 1,
            type: 1,
            floor: 1,
            department: '$departmentInfo',
            displayName: {
              $concat: [
                '$roomCode',
                ' - ',
                '$roomName',
                ' (',
                { $toString: '$capacity' },
                ' capacity)'
              ]
            }
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
      const formatTime = (timeStr) => {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':');
        return `${hours}:${minutes} ${period.toUpperCase()}`;
      };

      // Get the term details to access academicYear
      const term = await mongoose.model('Terms').findById(scheduleData.term);
      if (!term) {
        throw new Error('Term not found');
      }

      // Prepare schedule slots
      const scheduleSlots = [{
        days: scheduleData.days,
        timeFrom: formatTime(scheduleData.timeFrom),
        timeTo: formatTime(scheduleData.timeTo),
        room: scheduleData.room,
        scheduleType: scheduleData.scheduleType
      }];

      // Add paired schedule slot if exists
      if (scheduleData.isPaired && scheduleData.pairedSchedule) {
        scheduleSlots.push({
          days: scheduleData.pairedSchedule.days,
          timeFrom: formatTime(scheduleData.pairedSchedule.timeFrom),
          timeTo: formatTime(scheduleData.pairedSchedule.timeTo),
          room: scheduleData.pairedSchedule.room,
          scheduleType: scheduleData.pairedSchedule.scheduleType
        });
      }

      // Create schedule document with update history including academicYear
      const schedule = await Schedules.create({
        term: scheduleData.term,
        section: scheduleData.section,
        faculty: scheduleData.faculty,
        subject: scheduleData.subject,
        classLimit: scheduleData.classLimit,
        studentType: scheduleData.studentType,
        isPaired: scheduleData.isPaired,
        isMultipleSections: scheduleData.isMultipleSections,
        scheduleSlots,
        isActive: true,
        updateHistory: [{
          updatedBy: scheduleData.userId,
          updatedAt: new Date(),
          action: 'created',
          academicYear: term.academicYear // Add the academicYear from the term
        }]
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
        {
          $lookup: {
            from: 'terms',
            localField: 'term',
            foreignField: '_id',
            as: 'term'
          }
        },
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
            from: 'users',
            localField: 'faculty',
            foreignField: '_id',
            as: 'faculty'
          }
        },
        // Lookup for rooms in scheduleSlots
        {
          $lookup: {
            from: 'rooms',
            localField: 'scheduleSlots.room',
            foreignField: '_id',
            as: 'roomsData'
          }
        },
        { $unwind: '$term' },
        { $unwind: '$section' },
        { $unwind: '$subject' },
        { $unwind: '$faculty' },
        {
          $project: {
            _id: 1,
            scheduleSlots: {
              $map: {
                input: '$scheduleSlots',
                as: 'slot',
                in: {
                  _id: '$$slot._id',
                  days: '$$slot.days',
                  timeFrom: '$$slot.timeFrom',
                  timeTo: '$$slot.timeTo',
                  scheduleType: '$$slot.scheduleType',
                  room: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$roomsData',
                          as: 'r',
                          cond: { $eq: ['$$r._id', '$$slot.room'] }
                        }
                      },
                      0
                    ]
                  }
                }
              }
            },
            classLimit: 1,
            studentType: 1,
            isPaired: 1,
            isActive: 1,
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

  static async deleteSchedule(scheduleId, userId) {
    try {
      const result = await Schedules.findByIdAndUpdate(
        scheduleId,
        {
          $set: { isActive: false },
          $push: {
            updateHistory: {
              updatedBy: userId,
              updatedAt: new Date(),
              action: 'deleted'
            }
          }
        },
        { new: true }
      );
      if (!result) {
        throw new Error('Schedule not found');
      }
      return result;
    } catch (error) {
      console.error('Schedule deletion error:', error);
      throw new Error('Failed to delete schedule');
    }
  }

  static async updateSchedule(scheduleId, scheduleData) {
    try {
      if (!scheduleId) {
        throw new Error('Schedule ID is required for update');
      }

      const formatTime = (timeStr) => {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':');
        return `${hours}:${minutes} ${period.toUpperCase()}`;
      };

      // Prepare schedule slots
      const scheduleSlots = [{
        days: scheduleData.days,
        timeFrom: formatTime(scheduleData.timeFrom),
        timeTo: formatTime(scheduleData.timeTo),
        room: new mongoose.Types.ObjectId(scheduleData.room),
        scheduleType: scheduleData.scheduleType
      }];

      // Add paired schedule slot if exists
      if (scheduleData.isPaired && scheduleData.pairedSchedule) {
        scheduleSlots.push({
          days: scheduleData.pairedSchedule.days,
          timeFrom: formatTime(scheduleData.pairedSchedule.timeFrom),
          timeTo: formatTime(scheduleData.pairedSchedule.timeTo),
          room: new mongoose.Types.ObjectId(scheduleData.pairedSchedule.room),
          scheduleType: scheduleData.pairedSchedule.scheduleType
        });
      }

      const updatedData = {
        term: new mongoose.Types.ObjectId(scheduleData.term),
        section: new mongoose.Types.ObjectId(scheduleData.section),
        faculty: new mongoose.Types.ObjectId(scheduleData.faculty),
        subject: new mongoose.Types.ObjectId(scheduleData.subject),
        classLimit: scheduleData.classLimit,
        studentType: scheduleData.studentType,
        isPaired: scheduleData.isPaired,
        isMultipleSections: scheduleData.isMultipleSections,
        scheduleSlots,
        isActive: true,
        $push: {
          updateHistory: {
            updatedBy: new mongoose.Types.ObjectId(scheduleData.userId),
            updatedAt: new Date(),
            action: 'updated'
          }
        }
      };

      const schedule = await Schedules.findByIdAndUpdate(
        scheduleId,
        updatedData,
        { new: true }
      ).populate([
        { path: 'term' },
        { path: 'section' },
        { path: 'faculty' },
        { path: 'subject' },
        {
          path: 'scheduleSlots.room',
          model: 'Rooms'
        }
      ]);

      if (!schedule) {
        throw new Error('Schedule not found');
      }

      return schedule;
    } catch (error) {
      console.error('Schedule update error:', error);
      throw new Error('Failed to update schedule: ' + error.message);
    }
  }
}