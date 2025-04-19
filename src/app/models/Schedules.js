import {
  Sections,
  Users,
  Subjects,
  Rooms
} from './index';

import mongoose from 'mongoose';
import { ScheduleSchema } from '../../../db/schema';
import moment from 'moment';

// Define the model at the top
const Schedules = mongoose.models.Schedules || mongoose.model('Schedules', ScheduleSchema);

// Add to your imports
import { createNotification } from '../(main)/schedules/_actions/notifications';

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
        // Match non-administrator users
        {
          $match: {
            role: { $ne: 'Administrator' }
          }
        },
        // Lookup department info
        {
          $lookup: {
            from: 'departments',
            localField: 'department',
            foreignField: '_id',
            as: 'departmentInfo'
          }
        },
        { $unwind: '$departmentInfo' },
        // Project required fields
        {
          $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            employmentType: 1,
            role: 1,
            department: '$departmentInfo.departmentCode',
            fullName: {
              $concat: [
                '$lastName',
                ', ',
                '$firstName',
                ' (',
                '$departmentInfo.departmentCode',
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
      // Check for conflicts before creating
      const conflicts = await this.checkScheduleConflicts(scheduleData);
      if (conflicts.hasConflicts) {
        return { conflicts };
      }

      const formatTime = (timeStr) => {
        return moment(timeStr, 'h:mm A').format('h:mm A');
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

      // Return an object with the schedule property
      // Get the populated schedule data
      const populatedSchedule = await Schedules.findById(schedule._id)
        .populate([
          { path: 'subject', select: 'subjectCode subjectName' },
          { path: 'section', select: 'sectionName' }
        ]);

      // Create notification with readable values
      await createNotification({ 
        userId: scheduleData.faculty,
        title: 'New Schedule Assigned',
        message: `You have been assigned to teach ${populatedSchedule.subject.subjectCode} - ${populatedSchedule.subject.subjectName} for section ${populatedSchedule.section.sectionName}`,
        type: 'success',
        relatedSchedule: schedule._id
      });

      return { schedule };
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
      // First get the schedule details before deletion with full population
      const schedule = await Schedules.findById(scheduleId).populate([
        { path: 'faculty', select: '_id' },
        { path: 'subject', select: 'subjectCode subjectName' },
        { path: 'section', select: 'sectionName' }
      ]);

      if (!schedule) {
        throw new Error('Schedule not found');
      }

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

      // Add notification with populated data
      await createNotification({
        userId: schedule.faculty._id,
        title: 'Schedule Deleted',
        message: `Your schedule for ${schedule.subject.subjectCode} - ${schedule.subject.subjectName} for section ${schedule.section.sectionName} has been removed`,
        type: 'error',
        relatedSchedule: scheduleId
      });

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

      // Check for conflicts before updating, excluding the current schedule
      const conflicts = await this.checkScheduleConflicts(scheduleData, scheduleId);
      if (conflicts.hasConflicts) {
        return { conflicts };
      }

      const formatTime = (timeStr) => {
        return moment(timeStr, 'h:mm A').format('h:mm A');
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

      // Add notification with populated data
      await createNotification({
        userId: scheduleData.faculty,
        title: 'Schedule Updated',
        message: `Your schedule for ${schedule.subject.subjectCode} - ${schedule.subject.subjectName} for section ${schedule.section.sectionName} has been updated`,
        type: 'warning',
        relatedSchedule: schedule._id
      });

      return { schedule };
    } catch (error) {
      console.error('Schedule update error:', error);
      throw new Error('Failed to update schedule: ' + error.message);
    }
  }

  static async checkScheduleConflicts(scheduleData, scheduleIdToExclude = null) {
    try {
      const conflicts = {
        hasConflicts: false,
        roomConflicts: [],
        facultyConflicts: [],
        sectionConflicts: []
      };

      // Helper function to check time overlap
      const isTimeOverlap = (slot1, slot2) => {
        // Parse times using moment
        const timeFrom1 = moment(slot1.timeFrom, 'h:mm A');
        const timeTo1 = moment(slot1.timeTo, 'h:mm A');
        const timeFrom2 = moment(slot2.timeFrom, 'h:mm A');
        const timeTo2 = moment(slot2.timeTo, 'h:mm A');

        // Debug logs to verify time parsing
        console.log('Time comparison:', {
          slot1: { from: slot1.timeFrom, to: slot1.timeTo },
          slot2: { from: slot2.timeFrom, to: slot2.timeTo },
          parsed1: { from: timeFrom1.format('HH:mm'), to: timeTo1.format('HH:mm') },
          parsed2: { from: timeFrom2.format('HH:mm'), to: timeTo2.format('HH:mm') }
        });

        // Check if one time range is completely before or after the other
        // A conflict exists if one range doesn't end before the other starts
        // and doesn't start after the other ends
        return !(
          timeTo1.isSameOrBefore(timeFrom2) || 
          timeFrom1.isSameOrAfter(timeTo2)
        );
      };

      // Process all schedule slots (main and paired if exists)
      const allSlots = [
        {
          days: Array.isArray(scheduleData.days) ? scheduleData.days : [scheduleData.days],
          timeFrom: scheduleData.timeFrom,
          timeTo: scheduleData.timeTo,
          room: scheduleData.room
        }
      ];

      if (scheduleData.isPaired && scheduleData.pairedSchedule) {
        allSlots.push({
          days: Array.isArray(scheduleData.pairedSchedule.days) 
            ? scheduleData.pairedSchedule.days 
            : [scheduleData.pairedSchedule.days],
          timeFrom: scheduleData.pairedSchedule.timeFrom,
          timeTo: scheduleData.pairedSchedule.timeTo,
          room: scheduleData.pairedSchedule.room
        });
      }

      // Check each slot for conflicts
      for (const slot of allSlots) {
        for (const day of slot.days) {
          // Base query to find potential conflicts
          const baseQuery = {
            isActive: true,
            'scheduleSlots.days': day
          };
          
          // Add term filter if provided
          if (scheduleData.term) {
            baseQuery.term = new mongoose.Types.ObjectId(scheduleData.term);
          }

          // Exclude the current schedule if updating
          if (scheduleIdToExclude) {
            baseQuery._id = { $ne: new mongoose.Types.ObjectId(scheduleIdToExclude) };
          }

          // 1. Check for room conflicts
          const roomId = new mongoose.Types.ObjectId(slot.room);
          console.log('Checking room conflicts for:', { day, roomId: roomId.toString(), time: `${slot.timeFrom}-${slot.timeTo}` });
          
          const roomConflicts = await Schedules.aggregate([
            {
              $match: {
                ...baseQuery,
              }
            },
            { $unwind: '$scheduleSlots' },
            {
              $match: {
                'scheduleSlots.days': day,
                'scheduleSlots.room': roomId
              }
            },
            {
              $lookup: {
                from: 'rooms',
                localField: 'scheduleSlots.room',
                foreignField: '_id',
                as: 'roomInfo'
              }
            },
            { $unwind: '$roomInfo' },
            {
              $lookup: {
                from: 'sections',
                localField: 'section',
                foreignField: '_id',
                as: 'sectionInfo'
              }
            },
            { $unwind: '$sectionInfo' }
          ]);

          console.log(`Found ${roomConflicts.length} potential room conflicts`);
          
          // Filter room conflicts by time overlap
          const filteredRoomConflicts = roomConflicts.filter(conflict => {
            const hasOverlap = isTimeOverlap(slot, conflict.scheduleSlots);
            console.log('Time overlap check:', { 
              hasOverlap, 
              slot: `${slot.timeFrom}-${slot.timeTo}`, 
              conflict: `${conflict.scheduleSlots.timeFrom}-${conflict.scheduleSlots.timeTo}` 
            });
            return hasOverlap;
          });

          console.log(`After filtering, ${filteredRoomConflicts.length} actual room conflicts`);

          if (filteredRoomConflicts.length > 0) {
            conflicts.hasConflicts = true;
            conflicts.roomConflicts.push({
              day,
              room: filteredRoomConflicts[0].roomInfo.roomCode,
              timeFrom: slot.timeFrom,
              timeTo: slot.timeTo,
              conflictingSchedules: filteredRoomConflicts.map(c => ({
                section: c.sectionInfo.sectionName,
                timeFrom: c.scheduleSlots.timeFrom,
                timeTo: c.scheduleSlots.timeTo
              }))
            });
          }

          // 2. Check for faculty conflicts
          const facultyConflicts = await Schedules.aggregate([
            {
              $match: {
                ...baseQuery,
                faculty: new mongoose.Types.ObjectId(scheduleData.faculty)
              }
            },
            { $unwind: '$scheduleSlots' },
            {
              $match: {
                'scheduleSlots.days': day
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'faculty',
                foreignField: '_id',
                as: 'facultyInfo'
              }
            },
            { $unwind: '$facultyInfo' },
            {
              $lookup: {
                from: 'sections',
                localField: 'section',
                foreignField: '_id',
                as: 'sectionInfo'
              }
            },
            { $unwind: '$sectionInfo' }
          ]);

          // Filter faculty conflicts by time overlap
          const filteredFacultyConflicts = facultyConflicts.filter(conflict => 
            isTimeOverlap(slot, conflict.scheduleSlots)
          );

          if (filteredFacultyConflicts.length > 0) {
            conflicts.hasConflicts = true;
            conflicts.facultyConflicts.push({
              day,
              faculty: `${filteredFacultyConflicts[0].facultyInfo.lastName}, ${filteredFacultyConflicts[0].facultyInfo.firstName}`,
              timeFrom: slot.timeFrom,
              timeTo: slot.timeTo,
              conflictingSchedules: filteredFacultyConflicts.map(c => ({
                section: c.sectionInfo.sectionName,
                timeFrom: c.scheduleSlots.timeFrom,
                timeTo: c.scheduleSlots.timeTo
              }))
            });
          }

          // 3. Check for section conflicts
          const sectionConflicts = await Schedules.aggregate([
            {
              $match: {
                ...baseQuery,
                section: new mongoose.Types.ObjectId(scheduleData.section)
              }
            },
            { $unwind: '$scheduleSlots' },
            {
              $match: {
                'scheduleSlots.days': day
              }
            },
            {
              $lookup: {
                from: 'sections',
                localField: 'section',
                foreignField: '_id',
                as: 'sectionInfo'
              }
            },
            { $unwind: '$sectionInfo' },
            {
              $lookup: {
                from: 'subjects',
                localField: 'subject',
                foreignField: '_id',
                as: 'subjectInfo'
              }
            },
            { $unwind: '$subjectInfo' }
          ]);

          // Filter section conflicts by time overlap
          const filteredSectionConflicts = sectionConflicts.filter(conflict => 
            isTimeOverlap(slot, conflict.scheduleSlots)
          );

          if (filteredSectionConflicts.length > 0) {
            conflicts.hasConflicts = true;
            conflicts.sectionConflicts.push({
              day,
              section: filteredSectionConflicts[0].sectionInfo.sectionName,
              timeFrom: slot.timeFrom,
              timeTo: slot.timeTo,
              conflictingSchedules: filteredSectionConflicts.map(c => ({
                subject: c.subjectInfo.subjectCode,
                timeFrom: c.scheduleSlots.timeFrom,
                timeTo: c.scheduleSlots.timeTo
              }))
            });
          }
        }
      }

      console.log('Final conflict check result:', conflicts);
      return conflicts;
    } catch (error) {
      console.error('Schedule conflict check error:', error);
      throw new Error('Failed to check schedule conflicts: ' + error.message);
    }
  }
}
