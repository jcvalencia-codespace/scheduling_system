import {
  Sections,
  Users,
  Subjects,
  Rooms
} from './index';
import connectDB from '../../../lib/mongo';  // Add this import
import mongoose from 'mongoose';
import { ScheduleSchema, SectionSchema } from '../../../db/schema';  // Add SectionSchema import
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

      return JSON.parse(JSON.stringify(sections));
    } catch (error) {
      console.error('Section fetch error:', error);
      throw new Error('Failed to fetch sections');
    }
  }

  static async getSectionsForUser() {
    try {
      const Section = mongoose.models.Sections || mongoose.model('Sections', SectionSchema);

      const sections = await Section.find({ isActive: true })
        .populate({
          path: 'course',
          select: 'courseCode courseTitle department',
          populate: {
            path: 'department',
            select: 'departmentCode departmentName'
          }
        })
        .populate('department', 'departmentCode departmentName')
        .lean();

      // Format sections for display
      return sections.map(section => ({
        ...section,
        _id: section._id.toString(),
        course: section.course ? {
          ...section.course,
          _id: section.course._id.toString(),
          department: section.course.department ? {
            ...section.course.department,
            _id: section.course.department._id.toString()
          } : null
        } : null,
        department: section.department ? {
          ...section.department,
          _id: section.department._id.toString()
        } : null,
        displayName: `${section.sectionName} - ${section.course?.courseCode || 'No Course'}`
      }));
    } catch (error) {
      console.error('Error in getSectionsForUser:', error);
      throw error;
    }
  }

  static async getAllActiveSections(departmentId = null) {
    try {
      await connectDB();
      const Sections = mongoose.models.Sections || mongoose.model('Sections', SectionSchema);

      console.log('Starting section filtering with params:', {
        departmentId,
        isDeanView: !!departmentId
      });

      // Base pipeline for all sections
      const pipeline = [
        { $match: { isActive: true } },
        // Lookup course details
        {
          $lookup: {
            from: 'courses',
            localField: 'course',
            foreignField: '_id',
            as: 'courseInfo'
          }
        },
        { $unwind: '$courseInfo' },
        // Lookup department details
        {
          $lookup: {
            from: 'departments',
            localField: 'courseInfo.department',
            foreignField: '_id',
            as: 'departmentInfo'
          }
        },
        { $unwind: '$departmentInfo' }
      ];

      // Add department filter if departmentId is provided (Dean view)
      if (departmentId) {
        console.log('Applying department filter for Dean:', {
          departmentId,
          filterType: 'course.department'
        });

        pipeline.push({
          $match: {
            'courseInfo.department': new mongoose.Types.ObjectId(departmentId)
          }
        });
      }

      // Add final projection
      pipeline.push({
        $project: {
          _id: 1,
          sectionName: 1,
          yearLevel: 1,
          course: {
            _id: '$courseInfo._id',
            courseCode: '$courseInfo.courseCode',
            courseTitle: '$courseInfo.courseTitle',
            department: {
              _id: '$departmentInfo._id',
              departmentCode: '$departmentInfo.departmentCode',
              departmentName: '$departmentInfo.departmentName'
            }
          }
        }
      },
        { $sort: { sectionName: 1 } });

      const sections = await Sections.aggregate(pipeline);

      // Log detailed results for debugging
      console.log('Section filtering results:', {
        totalFound: sections.length,
        departmentId: departmentId,
        departmentsFound: sections.length > 0
          ? [...new Set(sections.map(s => ({
            id: s.course.department._id.toString(),
            code: s.course.department.departmentCode
          })))]
          : []
      });

      return sections;
    } catch (error) {
      console.error('Error in getAllActiveSections:', error);
      throw new Error(`Failed to fetch sections: ${error.message}`);
    }
  }

  static async getFaculty() {
    try {
      const faculty = await Users.aggregate([
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
                ' - ',
                '$employmentType',
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

  static async handleScheduleTrimming(scheduleData) {
    // Helper function to calculate duration
    const calculateDuration = (timeFrom, timeTo) => {
      const [fromTime, fromPeriod] = timeFrom.split(' ');
      const [toTime, toPeriod] = timeTo.split(' ');

      let [fromHour, fromMinute] = fromTime.split(':').map(Number);
      let [toHour, toMinute] = toTime.split(':').map(Number);

      if (fromPeriod === 'PM' && fromHour !== 12) fromHour += 12;
      if (fromPeriod === 'AM' && fromHour === 12) fromHour = 0;
      if (toPeriod === 'PM' && toHour !== 12) toHour += 12;
      if (toPeriod === 'AM' && toHour === 12) toHour = 0;

      const minutes = (toHour * 60 + toMinute) - (fromHour * 60 + fromMinute);
      return minutes > 0 ? minutes : minutes + (24 * 60);
    };

    // Check if resulting schedules would be too short
    const minimumDuration = 120; // 2 hours in minutes

    // Format schedule slots array
    const scheduleSlots = [{
      days: Array.isArray(scheduleData.days) ? scheduleData.days : [scheduleData.days],
      timeFrom: scheduleData.timeFrom,
      timeTo: scheduleData.timeTo,
      room: new mongoose.Types.ObjectId(scheduleData.room)
    }];

    if (scheduleData.isPaired && scheduleData.pairedSchedule) {
      const pairedSlot = {
        days: Array.isArray(scheduleData.pairedSchedule.days)
          ? scheduleData.pairedSchedule.days
          : [scheduleData.pairedSchedule.days],
        timeFrom: scheduleData.pairedSchedule.timeFrom,
        timeTo: scheduleData.pairedSchedule.timeTo,
        room: new mongoose.Types.ObjectId(scheduleData.pairedSchedule.room)
      };
      scheduleSlots.push(pairedSlot);
    }

    for (const slot of scheduleSlots) {
      const conflictingSchedules = await Schedules.find({
        isActive: true,
        term: scheduleData.term, // Add term filter
        'scheduleSlots.days': { $in: slot.days },
        _id: { $ne: scheduleData._id }
      }).populate(['faculty', 'scheduleSlots.room', 'subject', 'section']);

      for (const existingSchedule of conflictingSchedules) {
        let modified = false;
        const newScheduleSlots = [];

        for (const existingSlot of existingSchedule.scheduleSlots) {
          if (slot.days.some(day => existingSlot.days.includes(day))) {
            const newTimeFrom = moment(slot.timeFrom, 'h:mm A');
            const newTimeTo = moment(slot.timeTo, 'h:mm A');
            const existingTimeFrom = moment(existingSlot.timeFrom, 'h:mm A');
            const existingTimeTo = moment(existingSlot.timeTo, 'h:mm A');

            // Check for complete overlap or if trimming would make schedule too short
            const isCompleteOverlap = newTimeFrom.isSameOrBefore(existingTimeFrom) &&
              newTimeTo.isSameOrAfter(existingTimeTo);

            // Calculate potential remaining durations
            const beforeDuration = newTimeFrom.isAfter(existingTimeFrom) ? 
              calculateDuration(existingSlot.timeFrom, newTimeFrom.format('h:mm A')) : 0;
            const afterDuration = newTimeTo.isBefore(existingTimeTo) ?
              calculateDuration(newTimeTo.format('h:mm A'), existingSlot.timeTo) : 0;
            
            const wouldHaveValidDuration = 
              (beforeDuration >= minimumDuration || beforeDuration === 0) &&
              (afterDuration >= minimumDuration || afterDuration === 0);

            if (isCompleteOverlap || !wouldHaveValidDuration) {
              // Deactivate the entire schedule if overlap would create invalid durations
              await Schedules.findByIdAndUpdate(existingSchedule._id, {
                isActive: false,
                $push: {
                  updateHistory: {
                    updatedBy: scheduleData.userId,
                    updatedAt: new Date(),
                    action: isCompleteOverlap ? 
                      'deactivated due to complete overlap' : 
                      'deactivated due to resulting invalid duration'
                  }
                }
              });

              if (existingSchedule.faculty) {
                await createNotification({
                  userId: existingSchedule.faculty._id,
                  title: 'Schedule Removed',
                  message: `Your schedule for ${existingSchedule.subject.subjectCode} has been removed due to ${
                    isCompleteOverlap ? 'complete overlap' : 
                    'resulting schedule duration would be less than minimum required (2 hours)'
                  }`,
                  type: 'warning',
                  relatedSchedule: existingSchedule._id
                });
              }

              modified = true;
              break;
            }

            // Only proceed with trimming if we have valid durations
            if (!(newTimeTo.isSameOrBefore(existingTimeFrom) || newTimeFrom.isSameOrAfter(existingTimeTo))) {
              modified = true;

              // Add before-slot only if duration is valid
              if (beforeDuration >= minimumDuration) {
                newScheduleSlots.push({
                  ...existingSlot.toObject(),
                  timeTo: newTimeFrom.format('h:mm A')
                });
              }

              // Add after-slot only if duration is valid
              if (afterDuration >= minimumDuration) {
                newScheduleSlots.push({
                  ...existingSlot.toObject(),
                  timeFrom: newTimeTo.format('h:mm A')
                });
              }
            } else {
              newScheduleSlots.push(existingSlot);
            }
          } else {
            newScheduleSlots.push(existingSlot);
          }
        }

        // Only update if modified and not completely overlapped
        if (modified && newScheduleSlots.length > 0) {
          await Schedules.findByIdAndUpdate(existingSchedule._id, {
            $set: { scheduleSlots: newScheduleSlots },
            $push: {
              updateHistory: {
                updatedBy: scheduleData.userId,
                updatedAt: new Date(),
                action: 'trimmed'
              }
            }
          });

          // Only send notification if faculty exists
          if (existingSchedule.faculty) {
            const affectedDays = newScheduleSlots
              .map(slot => slot.days.join(', '))
              .join('; ');

            const slotTimeChanges = newScheduleSlots
              .map(slot => `${slot.days.join(',')} ${slot.timeFrom}-${slot.timeTo}`)
              .join('; ');

            const currentTime = moment().format('h:mm A');

            const sectionDisplay = Array.isArray(existingSchedule.section)
              ? existingSchedule.section.map(s => s.sectionName).join(', ')
              : (existingSchedule.section.sectionName || 'Unknown Section');

            await createNotification({
              userId: existingSchedule.faculty._id,
              title: 'Schedule Time Overridden Due to Conflict',
              message: `Your schedule for ${existingSchedule.subject.subjectCode} - ${existingSchedule.subject.subjectName} for section ${sectionDisplay} has been automatically overridden at ${currentTime}.
                Affected Days: ${affectedDays}
                New Schedule Times: ${slotTimeChanges}
                This adjustment was made to accommodate a new schedule in the same time slot.`,
              type: 'warning',
              relatedSchedule: existingSchedule._id
            });
          }
        }
      }
    }
  }

  static async createSchedule(scheduleData) {
    try {
      // Check conflicts first if not forcing
      if (!scheduleData.force) {
        const conflicts = await this.checkScheduleConflicts(scheduleData);
        if (conflicts.hasConflicts) {
          return { conflicts };
        }
      }

      const formatTime = (timeStr) => {
        return moment(timeStr, 'h:mm A').format('h:mm A');
      };

      // Format schedule data for trimming
      const trimmingData = {
        ...scheduleData,
        timeFrom: formatTime(scheduleData.timeFrom),
        timeTo: formatTime(scheduleData.timeTo),
        days: Array.isArray(scheduleData.days) ? scheduleData.days : [scheduleData.days],
        room: new mongoose.Types.ObjectId(scheduleData.room)
      };

      if (scheduleData.isPaired && scheduleData.pairedSchedule) {
        trimmingData.pairedSchedule = {
          ...scheduleData.pairedSchedule,
          timeFrom: formatTime(scheduleData.pairedSchedule.timeFrom),
          timeTo: formatTime(scheduleData.pairedSchedule.timeTo),
          days: Array.isArray(scheduleData.pairedSchedule.days) ?
            scheduleData.pairedSchedule.days : [scheduleData.pairedSchedule.days],
          room: new mongoose.Types.ObjectId(scheduleData.pairedSchedule.room)
        };
      }

      // Always handle schedule trimming
      await this.handleScheduleTrimming(trimmingData);

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
        section: scheduleData.isMultipleSections ? scheduleData.section : [scheduleData.section],
        faculty: scheduleData.faculty || null, // Allow null faculty
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

      // Handle section name safely
      const sectionDisplay = Array.isArray(populatedSchedule.section)
        ? populatedSchedule.section.map(s => s.sectionName).join(', ')
        : populatedSchedule.section.sectionName || 'Unknown Section';

      // Only create notification if faculty is assigned
      if (scheduleData.faculty) {
        await createNotification({
          userId: scheduleData.faculty,
          title: 'New Schedule Assigned',
          message: `You have been assigned to teach ${populatedSchedule.subject.subjectCode} - ${populatedSchedule.subject.subjectName} for section ${sectionDisplay}`,
          type: 'success',
          relatedSchedule: schedule._id
        });
      }

      return { schedule };
    } catch (error) {
      console.error('Schedule creation error:', error);
      throw new Error('Failed to create schedule: ' + error.message);
    }
  }

  static async getSchedules(query = {}) {
    try {
      // Convert term string to ObjectId if present
      if (query.term) {
        query.term = new mongoose.Types.ObjectId(query.term);
      }

      const schedules = await Schedules.aggregate([
        {
          $match: {
            isActive: true,
            ...(query.term ? { term: query.term } : {})
          }
        },
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
            from: 'courses',
            localField: 'section.course',
            foreignField: '_id',
            as: 'course'
          }
        },
        {
          $lookup: {
            from: 'departments',
            localField: 'course.department',
            foreignField: '_id',
            as: 'department'
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
            as: 'facultyData'
          }
        },
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
              $cond: {
                if: { $eq: [{ $size: '$facultyData' }, 0] },
                then: null,
                else: {
                  _id: { $arrayElemAt: ['$facultyData._id', 0] },
                  firstName: { $arrayElemAt: ['$facultyData.firstName', 0] },
                  lastName: { $arrayElemAt: ['$facultyData.lastName', 0] },
                  fullName: {
                    $concat: [
                      { $arrayElemAt: ['$facultyData.lastName', 0] },
                      ', ',
                      { $arrayElemAt: ['$facultyData.firstName', 0] }
                    ]
                  }
                }
              }
            },
            department: {
              $arrayElemAt: ['$department', 0]
            }
          }
        }
      ]);
      console.log('Fetched schedules with query:', query, 'Count:', schedules.length); // Debug log
      return schedules;
    } catch (error) {
      console.error('Schedules fetch error:', error);
      throw new Error('Failed to fetch schedules');
    }
  }

  static async getSchedulesByYearAndTerm(academicYear, termId) {
    try {
      console.log('🔄 Model: Fetching schedules for:', { academicYear, termId })

      const pipeline = [
        {
          $match: {
            isActive: true,
            term: new mongoose.Types.ObjectId(termId)
          }
        },
        {
          $lookup: {
            from: 'terms',
            localField: 'term',
            foreignField: '_id',
            as: 'termInfo'
          }
        },
        { $unwind: '$termInfo' },
        {
          $match: {
            'termInfo.academicYear': academicYear
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
        { $unwind: { path: '$section' } },
        {
          $lookup: {
            from: 'subjects',
            localField: 'subject',
            foreignField: '_id',
            as: 'subject'
          }
        },
        { $unwind: { path: '$subject' } },
        {
          $lookup: {
            from: 'users',
            localField: 'faculty',
            foreignField: '_id',
            as: 'faculty'
          }
        },
        {
          $addFields: {
            faculty: { $arrayElemAt: ['$faculty', 0] }
          }
        },
        {
          $lookup: {
            from: 'rooms',
            localField: 'scheduleSlots.room',
            foreignField: '_id',
            as: 'rooms'
          }
        },
        {
          $addFields: {
            'scheduleSlots': {
              $map: {
                input: '$scheduleSlots',
                as: 'slot',
                in: {
                  days: '$$slot.days',
                  timeFrom: '$$slot.timeFrom',
                  timeTo: '$$slot.timeTo',
                  room: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$rooms',
                          as: 'room',
                          cond: { $eq: ['$$room._id', '$$slot.room'] }
                        }
                      },
                      0
                    ]
                  }
                }
              }
            }
          }
        },
        {
          $project: {
            _id: 1,
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
              $cond: {
                if: { $eq: ['$faculty', null] },
                then: null,
                else: {
                  _id: '$faculty._id',
                  firstName: '$faculty.firstName',
                  lastName: '$faculty.lastName'
                }
              }
            },
            scheduleSlots: 1,
            isPaired: 1,
            term: '$termInfo'
          }
        }
      ]

      console.log('📝 Model: Executing schedule pipeline with match:', {
        academicYear,
        termId
      })

      const schedules = await Schedules.aggregate(pipeline)

      console.log('✅ Model: Schedules found:', {
        total: schedules.length,
        bySection: schedules.reduce((acc, s) => {
          const section = s.section?.sectionName
          acc[section] = (acc[section] || 0) + 1
          return acc
        }, {}),
        sample: schedules[0] ? {
          section: schedules[0].section?.sectionName,
          subject: schedules[0].subject?.subjectCode,
          slots: schedules[0].scheduleSlots.map(slot => ({
            days: slot.days,
            time: `${slot.timeFrom}-${slot.timeTo}`,
            room: slot.room?.roomCode || 'No Room'
          }))
        } : 'No schedules'
      })

      return JSON.parse(JSON.stringify(schedules))
    } catch (error) {
      console.error('❌ Model: Error in getSchedulesByYearAndTerm:', error)
      throw error
    }
  }

  static async getRoomSchedules(roomId) {
    try {
      if (!roomId) {
        throw new Error('Room ID is required');
      }

      const roomObjectId = new mongoose.Types.ObjectId(roomId);

      const schedules = await Schedules.aggregate([
        {
          $match: {
            isActive: true,
            'scheduleSlots.room': roomObjectId
          }
        },
        { $unwind: '$scheduleSlots' },
        {
          $match: {
            'scheduleSlots.room': roomObjectId
          }
        },
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
            as: 'facultyData'
          }
        },
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
        {
          $group: {
            _id: '$_id',
            term: { $first: '$term' },
            section: { $first: '$section' },
            subject: { $first: '$subject' },
            classLimit: { $first: '$classLimit' },
            studentType: { $first: '$studentType' },
            isPaired: { $first: '$isPaired' },
            scheduleType: { $first: '$scheduleSlots.scheduleType' },
            faculty: {
              $first: {
                $cond: {
                  if: { $eq: [{ $size: '$facultyData' }, 0] },
                  then: null,
                  else: {
                    _id: { $arrayElemAt: ['$facultyData._id', 0] },
                    firstName: { $arrayElemAt: ['$facultyData.firstName', 0] },
                    lastName: { $arrayElemAt: ['$facultyData.lastName', 0] }
                  }
                }
              }
            },
            scheduleSlots: {
              $push: {
                days: '$scheduleSlots.days',
                timeFrom: '$scheduleSlots.timeFrom',
                timeTo: '$scheduleSlots.timeTo',
                room: { $arrayElemAt: ['$roomsData', 0] },
                scheduleType: '$scheduleSlots.scheduleType'
              }
            }
          }
        },
        {
          $project: {
            _id: 1,
            term: 1,
            section: 1,
            subject: 1,
            classLimit: 1,
            studentType: 1,
            isPaired: 1,
            scheduleType: 1,
            faculty: 1,
            scheduleSlots: 1
          }
        }
      ]);
      console.log('Fetched Schedules:', schedules);
      return schedules;
    } catch (error) {
      console.error('Error fetching room schedules:', error);
      throw new Error('Failed to fetch room schedules');
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

      // Format section display name consistently with create function
      const sectionDisplay = Array.isArray(schedule.section)
        ? schedule.section.map(s => s.sectionName).join(', ')
        : schedule.section.sectionName || 'Unknown Section';

      // Add notification with populated data and properly formatted section name
      await createNotification({
        userId: schedule.faculty._id,
        title: 'Schedule Deleted',
        message: `Your schedule for ${schedule.subject.subjectCode} - ${schedule.subject.subjectName} for section ${sectionDisplay} has been removed`,
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

      // Only check conflicts if force flag is not set
      if (!scheduleData.force) {
        const conflicts = await this.checkScheduleConflicts(scheduleData, scheduleId);
        if (conflicts.hasConflicts) {
          return { conflicts };
        }
      }

      // If force flag is set, handle schedule trimming
      if (scheduleData.force) {
        await this.handleScheduleTrimming(scheduleData);
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
        section: Array.isArray(scheduleData.section)
          ? scheduleData.section.map(s => new mongoose.Types.ObjectId(s))
          : [new mongoose.Types.ObjectId(scheduleData.section)],
        // Handle faculty field - can be null
        faculty: scheduleData.faculty ? new mongoose.Types.ObjectId(scheduleData.faculty) : null,
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
        { path: 'section', populate: { path: 'course' } },
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
        sectionConflicts: [],
        durationConflicts: [],
        adminHoursConflicts: [],
        subjectFrequencyConflicts: [] // Add new conflict type
      };

      const calculateDuration = (timeFrom, timeTo) => {
        const [fromTime, fromPeriod] = timeFrom.split(' ');
        const [toTime, toPeriod] = timeTo.split(' ');

        let [fromHour, fromMinute] = fromTime.split(':').map(Number);
        let [toHour, toMinute] = toTime.split(':').map(Number);

        if (fromPeriod === 'PM' && fromHour !== 12) fromHour += 12;
        if (fromPeriod === 'AM' && fromHour === 12) fromHour = 0;
        if (toPeriod === 'PM' && toHour !== 12) toHour += 12;
        if (toPeriod === 'AM' && toHour === 12) toHour = 0;

        const minutes = (toHour * 60 + toMinute) - (fromHour * 60 + fromMinute);
        return minutes > 0 ? minutes : minutes + (24 * 60);
      };

      // Check duration limits for each slot
      const checkDurationLimits = (slot) => {
        const duration = calculateDuration(slot.timeFrom, slot.timeTo);
        const maxDuration = 240; // 4 hours in minutes
        const minDuration = 120; // 2 hours in minutes

        if (duration > maxDuration) {
          conflicts.hasConflicts = true;
          conflicts.durationConflicts.push({
            timeFrom: slot.timeFrom,
            timeTo: slot.timeTo,
            duration,
            type: 'exceeded',
            message: `Schedule duration (${Math.floor(duration / 60)} hours ${duration % 60} minutes) exceeds maximum allowed (4 hours)`
          });
        } else if (duration < minDuration) {
          conflicts.hasConflicts = true;
          conflicts.durationConflicts.push({
            timeFrom: slot.timeFrom,
            timeTo: slot.timeTo,
            duration,
            type: 'insufficient',
            message: `Schedule duration (${Math.floor(duration / 60)} hours ${duration % 60} minutes) is less than minimum required (2 hours)`
          });
        }
      };

      // Add isTimeOverlap helper function
      const isTimeOverlap = (slot1, slot2) => {
        const timeFrom1 = moment(slot1.timeFrom, 'h:mm A');
        const timeTo1 = moment(slot1.timeTo, 'h:mm A');
        const timeFrom2 = moment(slot2.timeFrom || slot2.startTime, 'h:mm A');
        const timeTo2 = moment(slot2.timeTo || slot2.endTime, 'h:mm A');

        return !(timeTo1.isSameOrBefore(timeFrom2) || timeFrom1.isSameOrAfter(timeTo2));
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

      // Check duration for main schedule
      checkDurationLimits(allSlots[0]);

      if (scheduleData.isPaired && scheduleData.pairedSchedule) {
        const pairedSlot = {
          days: Array.isArray(scheduleData.pairedSchedule.days)
            ? scheduleData.pairedSchedule.days
            : [scheduleData.pairedSchedule.days],
          timeFrom: scheduleData.pairedSchedule.timeFrom,
          timeTo: scheduleData.pairedSchedule.timeTo,
          room: scheduleData.pairedSchedule.room
        };
        allSlots.push(pairedSlot);
        // Check duration for paired schedule
        checkDurationLimits(pairedSlot);
      }

      // If there are duration conflicts, return early
      if (conflicts.durationConflicts.length > 0) {
        return conflicts;
      }

      // Modify admin hours conflict check
      if (scheduleData.faculty) {
        const AdminHours = mongoose.models.AdminHours || mongoose.model('AdminHours', require('../../../db/schema').AdminHourSchema);
        const Users = mongoose.models.Users || mongoose.model('Users', require('../../../db/schema').UserSchema);
        
        // Get approved admin hours and faculty info
        const [adminHours, facultyInfo] = await Promise.all([
          AdminHours.findOne({
            user: new mongoose.Types.ObjectId(scheduleData.faculty),
            term: new mongoose.Types.ObjectId(scheduleData.term),
            isActive: true,
            'slots.status': 'approved'
          }),
          Users.findById(scheduleData.faculty).select('firstName lastName')
        ]);

        if (adminHours && facultyInfo) {
          // Check each schedule slot against admin hours
          for (const slot of allSlots) {
            const scheduleDay = Array.isArray(slot.days) ? slot.days[0] : slot.days;
            const facultyName = `${facultyInfo.lastName}, ${facultyInfo.firstName}`;

            // Check against each approved admin hour slot
            const conflictingAdminSlots = adminHours.slots.filter(adminSlot => {
              if (adminSlot.status !== 'approved' || adminSlot.day !== scheduleDay) {
                return false;
              }

              // Convert admin hours to same format
              const adminSlotFormatted = {
                timeFrom: adminSlot.startTime,
                timeTo: adminSlot.endTime
              };

              return isTimeOverlap(slot, adminSlotFormatted);
            });

            if (conflictingAdminSlots.length > 0) {
              conflicts.hasConflicts = true;
              conflicts.adminHoursConflicts.push({
                day: scheduleDay,
                timeFrom: slot.timeFrom,
                timeTo: slot.timeTo,
                faculty: facultyName,
                conflictingSlots: conflictingAdminSlots.map(adminSlot => ({
                  day: adminSlot.day,
                  startTime: adminSlot.startTime,
                  endTime: adminSlot.endTime,
                  type: adminSlot.type || 'Administrative'
                }))
              });
            }
          }
        }
      }

      // Add subject frequency check right after admin hours check and before room checks
      const sections = Array.isArray(scheduleData.section) 
        ? scheduleData.section 
        : [scheduleData.section];

      for (const sectionId of sections) {
        // Get existing schedules for this section and subject
        const existingSubjectSchedules = await Schedules.find({
          isActive: true,
          term: new mongoose.Types.ObjectId(scheduleData.term),
          section: new mongoose.Types.ObjectId(sectionId),
          subject: new mongoose.Types.ObjectId(scheduleData.subject),
          _id: { $ne: scheduleIdToExclude ? new mongoose.Types.ObjectId(scheduleIdToExclude) : null }
        }).populate('subject', 'subjectCode subjectName');

        // Count weekly occurrences
        let weeklyOccurrences = existingSubjectSchedules.reduce((count, schedule) => {
          return count + schedule.scheduleSlots.reduce((slotCount, slot) => {
            return slotCount + (Array.isArray(slot.days) ? slot.days.length : 1);
          }, 0);
        }, 0);

        // Add current schedule's occurrences
        const newOccurrences = (Array.isArray(scheduleData.days) ? scheduleData.days.length : 1) +
          (scheduleData.isPaired && scheduleData.pairedSchedule ? 
            (Array.isArray(scheduleData.pairedSchedule.days) ? 
              scheduleData.pairedSchedule.days.length : 1) : 0);

        weeklyOccurrences += newOccurrences;

        if (weeklyOccurrences > 2) {
          const section = await mongoose.model('Sections').findById(sectionId);
          const subject = await mongoose.model('Subjects').findById(scheduleData.subject);
          
          conflicts.hasConflicts = true;
          conflicts.subjectFrequencyConflicts.push({
            section: section.sectionName,
            subject: subject.subjectCode,
            currentCount: weeklyOccurrences - newOccurrences,
            attemptedAdd: newOccurrences,
            maxAllowed: 2,
            message: `${subject.subjectCode} is already scheduled ${weeklyOccurrences - newOccurrences} times this week for section ${section.sectionName}`
          });
        }
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

          // 2. Check for faculty conflicts - Only if faculty is provided
          if (scheduleData.faculty) {
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
          }

          // 3. Check for section conflicts - Modified for multiple sections
          const sections = Array.isArray(scheduleData.section)
            ? scheduleData.section
            : [scheduleData.section];

          for (const sectionId of sections) {
            const sectionConflicts = await Schedules.aggregate([
              {
                $match: {
                  ...baseQuery,
                  section: new mongoose.Types.ObjectId(sectionId)
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
      }

      console.log('Final conflict check result:', conflicts);
      return conflicts;
    } catch (error) {
      console.error('Schedule conflict check error:', error);
      throw new Error('Failed to check schedule conflicts: ' + error.message);
    }
  }

  static async calculateFacultyLoad(facultyId, termId) {
    try {
      const facultyInfo = await mongoose.model('Users').findById(facultyId);
      if (!facultyInfo) {
        throw new Error('Faculty not found');
      }

      const isFullTime = facultyInfo.employmentType === 'full-time';
      const maxHours = isFullTime ? 40 : 24;

      // Get all active schedules with subject info
      const schedules = await Schedules.aggregate([
        {
          $match: {
            faculty: new mongoose.Types.ObjectId(facultyId),
            term: new mongoose.Types.ObjectId(termId),
            isActive: true
          }
        },
        {
          $lookup: {
            from: 'subjects',
            localField: 'subject',
            foreignField: '_id',
            as: 'subjectInfo'
          }
        },
        { $unwind: '$subjectInfo' },
        { $unwind: '$scheduleSlots' }
      ]);

      // Get admin hours using findOne instead of aggregate
      const adminHoursModel = mongoose.models.AdminHours || mongoose.model('AdminHours', require('../../../db/schema').AdminHourSchema);
      const adminHours = await adminHoursModel.findOne({
        user: new mongoose.Types.ObjectId(facultyId),
        term: new mongoose.Types.ObjectId(termId),
        isActive: true
      });

      // Calculate actual admin hours from approved slots
      let actualAdminHours = 0;
      if (adminHours && adminHours.slots) {
        adminHours.slots.forEach(slot => {
          if (slot.status === 'approved') {
            // Parse times using moment
            const start = moment(slot.startTime, 'h:mm A');
            const end = moment(slot.endTime, 'h:mm A');
            
            // Handle case where end time is on next day
            let duration = end.diff(start, 'hours', true);
            if (duration < 0) {
              duration += 24;
            }
            
            actualAdminHours += duration;

            // Debug logging
            console.log('Admin Hours Slot:', {
              day: slot.day,
              start: slot.startTime,
              end: slot.endTime,
              duration,
              runningTotal: actualAdminHours
            });
          }
        });
      }

      // Calculate teaching hours
      let totalTeachingHours = 0;
      const subjectCodes = new Set();

      schedules.forEach(schedule => {
        const timeFrom = moment(schedule.scheduleSlots.timeFrom, 'h:mm A');
        const timeTo = moment(schedule.scheduleSlots.timeTo, 'h:mm A');
        const durationHours = timeTo.diff(timeFrom, 'minutes') / 60;
        totalTeachingHours += durationHours * schedule.scheduleSlots.days.length;
        subjectCodes.add(schedule.subjectInfo.subjectCode);
      });

      // Calculate potential admin hours
      const potentialAdminHours = isFullTime ? Math.max(0, maxHours - totalTeachingHours - actualAdminHours) : 0;

      // Debug logging
      console.log('Faculty Load Calculation:', {
        faculty: facultyId,
        employmentType: facultyInfo.employmentType,
        totalTeaching: totalTeachingHours,
        potentialAdmin: potentialAdminHours,
        actualAdmin: actualAdminHours
      });

      return {
        employmentType: facultyInfo.employmentType || 'N/A',
        totalHours: maxHours,
        teachingHours: Math.round(totalTeachingHours * 100) / 100,
        adminHours: Math.round(potentialAdminHours * 100) / 100,
        actualAdminHours: Math.round(actualAdminHours * 100) / 100,
        subjectCodes: Array.from(subjectCodes)
      };
    } catch (error) {
      console.error('Error calculating faculty load:', error);
      return {
        employmentType: 'N/A',
        totalHours: 0,
        teachingHours: 0,
        adminHours: 0,
        actualAdminHours: 0,
        subjectCodes: []
      };
    }
  }
}
