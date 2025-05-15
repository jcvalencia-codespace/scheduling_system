import mongoose from 'mongoose';
import { AdminHourSchema, DepartmentSchema, ScheduleSchema } from '../../../db/schema';  // Add ScheduleSchema
import connectDB from '../../../lib/mongo';
import moment from 'moment';
import { pusherServer } from '@/utils/pusher';
import { createNotification } from '../(main)/schedules/_actions/notifications';

class AdminHoursModel {
  constructor() {
    this.MODEL = null;
    this.DEPARTMENT_MODEL = null;
    this.USER_MODEL = null;
  }

  async initModel() {
    if (!this.MODEL || !this.DEPARTMENT_MODEL || !this.USER_MODEL) {
      await connectDB();
      
      // Initialize models in correct order
      this.DEPARTMENT_MODEL = mongoose.models.Departments || mongoose.model('Departments', DepartmentSchema);
      this.USER_MODEL = mongoose.models.Users || mongoose.model('Users', require('../../../db/schema').UserSchema);
      this.MODEL = mongoose.models.AdminHours || mongoose.model('AdminHours', AdminHourSchema);
    }
    return this.MODEL;
  }

  async getAdminHours(userId, termId) {
    try {
      const AdminHours = await this.initModel();
      const hours = await AdminHours.findOne({
        user: new mongoose.Types.ObjectId(userId),
        term: new mongoose.Types.ObjectId(termId),
        isActive: true
      });
      // Add _id to the response even when wrapping empty slots
      return hours || { _id: null, slots: [], status: null };
    } catch (error) {
      console.error('Error fetching admin hours:', error);
      throw new Error('Failed to fetch admin hours');
    }
  }

  async saveAdminHours(userId, termId, newSlots, creatorId, role) {
    try {
      await connectDB();
      const AdminHours = await this.initModel();
      const Schedules = mongoose.models.Schedules || mongoose.model('Schedules', ScheduleSchema);

      // Validate term ID
      if (!mongoose.Types.ObjectId.isValid(termId)) {
        throw new Error('Invalid term ID provided');
      }

      const termObjectId = new mongoose.Types.ObjectId(termId);

      // Get user info and validate
      const user = await this.USER_MODEL.findById(userId);
      if (!user) throw new Error('User not found');
      if (user.employmentType !== 'full-time') throw new Error('Only full-time employees can have admin hours');

      // Enhanced schedule conflict check
      for (const slot of newSlots) {
        // Convert times to 24-hour format for comparison
        const parseTime = (timeStr) => {
          return moment(timeStr, 'h:mm A').format('HH:mm');
        };

        const slotStartTime = parseTime(slot.startTime);
        const slotEndTime = parseTime(slot.endTime);

        // Check against faculty's regular class schedules
        const scheduleConflicts = await Schedules.find({
          isActive: true,
          term: termObjectId,
          faculty: userId,
          'scheduleSlots.days': slot.day
        }).populate(['subject', 'section']);

        for (const schedule of scheduleConflicts) {
          for (const scheduleSlot of schedule.scheduleSlots) {
            if (scheduleSlot.days.includes(slot.day)) {
              const classStartTime = parseTime(scheduleSlot.timeFrom);
              const classEndTime = parseTime(scheduleSlot.timeTo);

              // Check for time overlap
              if (
                (slotStartTime >= classStartTime && slotStartTime < classEndTime) ||
                (slotEndTime > classStartTime && slotEndTime <= classEndTime) ||
                (slotStartTime <= classStartTime && slotEndTime >= classEndTime)
              ) {
                const sectionNames = Array.isArray(schedule.section) 
                  ? schedule.section.map(s => s.sectionName).join(', ')
                  : schedule.section.sectionName;

                throw new Error(
                  `Schedule conflict found for ${slot.day} at ${slot.startTime}-${slot.endTime}. ` +
                  `Conflicts with class schedule: ${schedule.subject.subjectCode} ` +
                  `(${scheduleSlot.timeFrom}-${scheduleSlot.timeTo}) ` +
                  `for section ${sectionNames}`
                );
              }
            }
          }
        }

        // Check against existing admin hours (modified conflict check)
        const adminHoursConflicts = await AdminHours.find({
          user: userId,
          term: termObjectId,
          isActive: true,
          'slots.day': slot.day,
          'slots.status': { $in: ['pending', 'approved'] } // Only check pending and approved slots
        });

        // Filter to only count conflicts with active slots in the current term
        const actualConflicts = adminHoursConflicts.filter(ah => 
          ah.term.toString() === termObjectId.toString() && // Double-check term matching
          ah.slots.some(s => 
            s.day === slot.day && 
            s.status !== 'rejected' && 
            s.status !== 'cancelled' && // Exclude cancelled slots
            s.status !== 'deleted' &&   // Exclude deleted slots
            ((s.startTime <= slot.startTime && s.endTime > slot.startTime) ||
             (s.startTime < slot.endTime && s.endTime >= slot.endTime))
          )
        );

        if (actualConflicts.length > 0) {
          throw new Error(`Admin hours conflict found for ${slot.day} at ${slot.startTime}-${slot.endTime}`);
        }

        // Improved admin hours conflict check
        const slotStartMoment = moment(slot.startTime, 'h:mm A');
        const slotEndMoment = moment(slot.endTime, 'h:mm A');

        // Find existing admin hours that might conflict
        const existingAdminHours = await AdminHours.findOne({
          user: userId,
          term: termObjectId,
          isActive: true,
          slots: {
            $elemMatch: {
              day: slot.day,
              status: { $in: ['pending', 'approved'] },
              $or: [
                // Case 1: New slot starts during an existing slot
                {
                  startTime: { $lte: slot.startTime },
                  endTime: { $gt: slot.startTime }
                },
                // Case 2: New slot ends during an existing slot
                {
                  startTime: { $lt: slot.endTime },
                  endTime: { $gte: slot.endTime }
                },
                // Case 3: New slot completely contains an existing slot
                {
                  startTime: { $gte: slot.startTime },
                  endTime: { $lte: slot.endTime }
                }
              ]
            }
          }
        });

        if (existingAdminHours) {
          // Find the specific conflicting slot(s)
          const conflictingSlots = existingAdminHours.slots.filter(existingSlot => {
            if (existingSlot.day !== slot.day) return false;
            if (!['pending', 'approved'].includes(existingSlot.status)) return false;

            const existingStart = moment(existingSlot.startTime, 'h:mm A');
            const existingEnd = moment(existingSlot.endTime, 'h:mm A');

            // Check for time overlap
            const hasOverlap = (
              (slotStartMoment.isSameOrAfter(existingStart) && slotStartMoment.isBefore(existingEnd)) ||
              (slotEndMoment.isAfter(existingStart) && slotEndMoment.isSameOrBefore(existingEnd)) ||
              (slotStartMoment.isSameOrBefore(existingStart) && slotEndMoment.isSameOrAfter(existingEnd))
            );

            return hasOverlap;
          });

          if (conflictingSlots.length > 0) {
            const conflictDetails = conflictingSlots.map(conflictSlot => 
              `${conflictSlot.day} at ${conflictSlot.startTime}-${conflictSlot.endTime} (${conflictSlot.status})`
            ).join(', ');

            throw new Error(
              `Admin hours conflict found: New slot ${slot.day} (${slot.startTime}-${slot.endTime}) ` +
              `conflicts with existing admin hours: ${conflictDetails}`
            );
          }
        }
      }

      // Find approvers (Administrators and Deans) with debug logging
      console.log('Finding approvers for request from department:', user.department);
      
      let approvers;
      
      if (role === 'Faculty' || role === 'Program Chair') {
        // For faculty and program chairs, get all admins and only the dean of their department
        approvers = await this.USER_MODEL.find({
          $or: [
            { role: 'Administrator' },  // Get all administrators
            {
              role: 'Dean',
              department: user.department // Only get dean from requester's department
            }
          ],
          isActive: { $ne: false },
          _id: { $ne: userId }
        }).select('_id firstName lastName email role department');

        // Debug log each approver's details
        approvers.forEach(approver => {
          console.log('Approver found:', {
            name: `${approver.firstName} ${approver.lastName}`,
            role: approver.role,
            department: approver.department,
            matches: approver.role === 'Dean' ? 
              approver.department.toString() === user.department.toString() : 
              'N/A (Administrator)'
          });
        });
      } else {
        // For dean-level requests, only get administrators
        approvers = await this.USER_MODEL.find({
          role: 'Administrator',
          isActive: { $ne: false },
          _id: { $ne: userId }
        }).select('_id firstName lastName email role');
      }

      // Debug logging
      console.log('Approvers found:', approvers.map(a => ({
        role: a.role,
        department: a.department,
        name: `${a.firstName} ${a.lastName}`
      })));

      // Check if we found any approvers
      if (approvers.length === 0) {
        console.warn('No eligible approvers found. Check user roles and department assignments in the database.');
      }

      // Determine if approval is needed
      const needsApproval = !(
        role === 'Administrator' || 
        role === 'Dean' || 
        (role === 'Dean' && userId === creatorId)
      );

      console.log('Needs approval:', needsApproval);

      // Prepare new slots with status
      const preparedNewSlots = newSlots.map(slot => ({
        ...slot,
        status: needsApproval ? 'pending' : 'approved',
        approvedBy: !needsApproval ? creatorId : undefined,
        approvalDate: !needsApproval ? new Date() : undefined,
        createdAt: new Date()
      }));

      // Find existing admin hours document
      let adminHours = await AdminHours.findOne({
        user: userId,
        term: termObjectId
      });

      if (!adminHours) {
        // Create new document if none exists
        adminHours = await AdminHours.create({
          user: userId,
          term: termObjectId,
          slots: preparedNewSlots,
          needsApproval,
          createdBy: creatorId,
          isActive: true
        });
      } else {
        // Append new slots to existing document
        await AdminHours.findByIdAndUpdate(
          adminHours._id,
          {
            $push: { slots: { $each: preparedNewSlots } },
            needsApproval,
            isActive: true
          },
          { new: true }
        );
      }

      // Get populated result with better population
      const populatedResult = await AdminHours.findById(adminHours._id)
        .populate([{
          path: 'user',
          select: 'firstName lastName department',
          model: 'Users',
          populate: {
            path: 'department',
            model: 'Departments',
            select: 'departmentCode'
          }
        }, {
          path: 'createdBy',
          select: 'firstName lastName',
          model: 'Users'
        }]);

      // Send notifications to approvers if approval is needed
      if (needsApproval && approvers.length > 0) {
        console.log('Creating notifications for approvers...');
        
        // Double-check department matching for deans before sending notifications
        const validApprovers = approvers.filter(approver => {
          if (approver.role === 'Administrator') return true;
          if (approver.role === 'Dean') {
            const isDeanOfDepartment = approver.department.toString() === user.department.toString();
            console.log(`Dean ${approver.firstName} ${approver.lastName} department match:`, isDeanOfDepartment);
            return isDeanOfDepartment;
          }
          return false;
        });

        console.log(`Filtered to ${validApprovers.length} valid approvers`);

        // Format slots for notification message
        const slotsDescription = newSlots.map(slot => 
          `${slot.day} (${slot.startTime} - ${slot.endTime})`
        ).join('\n');

        // Calculate total hours
        const totalHours = newSlots.reduce((acc, slot) => {
          const start = moment(slot.startTime, 'h:mm A');
          const end = moment(slot.endTime, 'h:mm A');
          return acc + (end.diff(start, 'minutes') / 60);
        }, 0).toFixed(1);

        // Create notifications for each approver
        for (const approver of validApprovers) {
          console.log(`Creating notification for approver: ${approver._id}`);
          
          try {
            await createNotification({
              userId: approver._id,
              title: 'Admin Hours Request Requires Review',
              message: `${populatedResult.user.firstName} ${populatedResult.user.lastName} (${populatedResult.user.department.departmentCode}) has submitted new admin hours request.\n\nTime slots:\n${slotsDescription}\n\nTotal hours: ${totalHours}`,
              type: 'info'
            });
            console.log(`Successfully created notification for approver: ${approver._id}`);
          } catch (notifError) {
            console.error(`Failed to create notification for approver ${approver._id}:`, notifError);
          }
        }
      }

      // Trigger Pusher event
      await pusherServer.trigger('admin-hours', 'new-request', {
        request: JSON.parse(JSON.stringify(populatedResult))
      });

      return populatedResult;
    } catch (error) {
      console.error('Error saving admin hours:', error);
      throw new Error(error.message || 'Failed to save admin hours');
    }
  }

  async approveAdminHours(adminHoursId, slotId, approverId, approved, rejectionReason = null) {
    try {
      const AdminHours = await this.initModel();
      
      const update = {
        $set: {
          'slots.$.status': approved ? 'approved' : 'rejected',
          'slots.$.approvedBy': approverId,
          'slots.$.approvalDate': new Date(),
          'slots.$.rejectionReason': rejectionReason
        }
      };

      const result = await AdminHours.findOneAndUpdate(
        { 
          _id: adminHoursId,
          'slots._id': slotId 
        },
        update,
        { new: true }
      ).populate({
        path: 'user',
        select: 'firstName lastName department _id',
        model: 'Users',
        populate: {
          path: 'department',
          model: 'Departments',
          select: 'departmentCode'
        }
      });

      if (!result) {
        throw new Error('Admin hours record or slot not found');
      }

      // Find the specific slot that was updated
      const updatedSlot = result.slots.find(slot => slot._id.toString() === slotId);
      
      // Create notification for the requester
      await createNotification({
        userId: result.user._id,
        title: `Admin Hours Request ${approved ? 'Approved' : 'Rejected'}`,
        message: approved 
          ? `Your admin hours request for ${updatedSlot.day} (${updatedSlot.startTime} - ${updatedSlot.endTime}) has been approved.`
          : `Your admin hours request for ${updatedSlot.day} (${updatedSlot.startTime} - ${updatedSlot.endTime}) has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
        type: approved ? 'success' : 'error'
      });

      // Trigger Pusher event for updated request
      await pusherServer.trigger('admin-hours', 'request-updated', {
        request: JSON.parse(JSON.stringify(result))
      });

      return result;
    } catch (error) {
      console.error('Error updating admin hours approval:', error);
      throw new Error('Failed to update admin hours approval');
    }
  }

  async cancelAdminHours(adminHoursId, slotId) {
    try {
      const AdminHours = await this.initModel();
      
      // Update only the specific slot
      const result = await AdminHours.findOneAndUpdate(
        { 
          _id: adminHoursId,
          'slots._id': slotId,
          'slots.status': 'pending' // Only allow canceling pending slots
        },
        {
          $set: {
            'slots.$.status': 'cancelled',
            'slots.$.updatedAt': new Date()
          }
        },
        { new: true }
      ).populate({
        path: 'user',
        select: 'firstName lastName department _id',
        model: 'Users',
        populate: {
          path: 'department',
          model: 'Departments',
          select: 'departmentCode'
        }
      });

      if (!result) {
        throw new Error('Admin hours record or slot not found or not in pending status');
      }

      // Find the specific slot that was updated
      const updatedSlot = result.slots.find(slot => slot._id.toString() === slotId);
      
      // Create notification for the requester
      await createNotification({
        userId: result.user._id,
        title: 'Admin Hours Request Cancelled',
        message: `Your admin hours request for ${updatedSlot.day} (${updatedSlot.startTime} - ${updatedSlot.endTime}) has been cancelled.`,
        type: 'info'
      });

      // Trigger Pusher event for cancelled request
      await pusherServer.trigger('admin-hours', 'request-updated', {
        request: JSON.parse(JSON.stringify(result))
      });

      return result;
    } catch (error) {
      console.error('Error in cancelAdminHours:', error);
      throw error;
    }
  }

  async editAdminHours(adminHoursId, slotId, updatedData) {
    try {
      const AdminHours = await this.initModel();

      // Find the admin hours document and the specific slot
      const adminHours = await AdminHours.findOne({
        _id: adminHoursId,
        'slots._id': slotId,
        'slots.status': 'pending' // Only allow editing pending slots
      });

      if (!adminHours) {
        throw new Error('Admin hours record not found or slot is not in pending status');
      }

      // Update the specific slot
      const result = await AdminHours.findOneAndUpdate(
        { 
          _id: adminHoursId,
          'slots._id': slotId
        },
        {
          $set: {
            'slots.$.day': updatedData.day,
            'slots.$.startTime': updatedData.startTime,
            'slots.$.endTime': updatedData.endTime,
          }
        },
        { new: true }
      ).populate({
        path: 'user',
        select: 'firstName lastName department',
        model: 'Users',
        populate: {
          path: 'department',
          model: 'Departments',
          select: 'departmentCode'
        }
      });

      // Trigger Pusher event for updated request
      await pusherServer.trigger('admin-hours', 'request-updated', {
        request: JSON.parse(JSON.stringify(result))
      });

      return result;
    } catch (error) {
      console.error('Error editing admin hours:', error);
      throw new Error('Failed to edit admin hours');
    }
  }

  async editApprovedAdminHours(adminHoursId, slotId, updatedData) {
    try {
      const AdminHours = await this.initModel();
      const Schedules = mongoose.models.Schedules || mongoose.model('Schedules', ScheduleSchema);

      // Convert IDs to ObjectIds if they're strings
      const adminHoursObjectId = typeof adminHoursId === 'string' ? new mongoose.Types.ObjectId(adminHoursId) : adminHoursId;
      const slotObjectId = typeof slotId === 'string' ? new mongoose.Types.ObjectId(slotId) : slotId;

      // Get the existing admin hours document
      const document = await AdminHours.findOne({
        _id: adminHoursObjectId,
        'slots._id': slotObjectId,
        'slots.status': 'approved'
      }).populate('user term');

      if (!document) {
        throw new Error('Admin hours document not found or slot is not in approved status');
      }
      // Find the specific slot
      const slot = document.slots.find(s => s._id.toString() === slotObjectId.toString());
      if (!slot) {
        throw new Error('Admin hours slot not found');
      }

      // Convert times for comparison
      const parseTime = (timeStr) => moment(timeStr, 'h:mm A').format('HH:mm');
      const newStartTime = parseTime(updatedData.startTime);
      const newEndTime = parseTime(updatedData.endTime);

      // First, check for conflicts with existing admin hours
      const existingOverlaps = await AdminHours.find({
        user: document.user._id,
        term: document.term._id,
        isActive: true,
        slots: {
          $elemMatch: {
            day: updatedData.day,
            status: { $in: ['pending', 'approved'] },
            _id: { $ne: slotObjectId },
            $or: [
              { // Case 1: Slot starts during existing
                startTime: { $lte: updatedData.startTime },
                endTime: { $gt: updatedData.startTime }
              },
              { // Case 2: Slot ends during existing
                startTime: { $lt: updatedData.endTime },
                endTime: { $gte: updatedData.endTime }
              },
              { // Case 3: Slot contains existing
                startTime: { $gte: updatedData.startTime },
                endTime: { $lte: updatedData.endTime }
              },
              { // Case 4: Existing slot contains new slot 
                $and: [
                  { startTime: { $lte: updatedData.startTime } },
                  { endTime: { $gte: updatedData.endTime } }
                ]
              }
            ]
          }
        }
      });

      if (existingOverlaps.length > 0) {
        // Find the specific conflicting slots
        const conflicts = existingOverlaps.flatMap(doc => 
          doc.slots.filter(slot => 
            slot._id.toString() !== slotObjectId.toString() &&
            slot.day === updatedData.day &&
            ['pending', 'approved'].includes(slot.status) &&
            moment(slot.startTime, 'h:mm A').isBefore(moment(updatedData.endTime, 'h:mm A')) &&
            moment(slot.endTime, 'h:mm A').isAfter(moment(updatedData.startTime, 'h:mm A'))
          )
        );

        if (conflicts.length > 0) {
          const conflictDetails = conflicts.map(s => 
            `${s.day} at ${s.startTime}-${s.endTime} (${s.status})`
          ).join(', ');

          throw new Error(
            `Time slot conflicts with existing admin hours: ${conflictDetails}`
          );
        }
      }

      // 1. Check for class schedule conflicts
      const scheduleConflicts = await Schedules.find({
        isActive: true,
        term: document.term._id,
        faculty: document.user._id,
        'scheduleSlots.days': updatedData.day
      }).populate(['subject', 'section']);

      for (const schedule of scheduleConflicts) {
        for (const scheduleSlot of schedule.scheduleSlots) {
          if (scheduleSlot.days.includes(updatedData.day)) {
            const classStartTime = parseTime(scheduleSlot.timeFrom);
            const classEndTime = parseTime(scheduleSlot.timeTo);

            if (
              (newStartTime >= classStartTime && newStartTime < classEndTime) ||
              (newEndTime > classStartTime && newEndTime <= classEndTime) ||
              (newStartTime <= classStartTime && newEndTime >= classEndTime)
            ) {
              const sectionNames = Array.isArray(schedule.section) 
                ? schedule.section.map(s => s.sectionName).join(', ')
                : schedule.section.sectionName;

              throw new Error(
                `Schedule conflict found for ${updatedData.day} at ${updatedData.startTime}-${updatedData.endTime}. ` +
                `Conflicts with class schedule: ${schedule.subject.subjectCode} ` +
                `(${scheduleSlot.timeFrom}-${scheduleSlot.timeTo}) ` +
                `for section ${sectionNames}`
              );
            }
          }
        }
      }

      // 2. Check for other admin hours conflicts
      const adminHoursConflicts = await AdminHours.find({
        user: document.user._id,
        term: document.term._id,
        isActive: true,
        'slots.day': updatedData.day,
        'slots.status': { $in: ['pending', 'approved'] },
        'slots._id': { $ne: slotObjectId } // Exclude the current slot
      });

      for (const adminHours of adminHoursConflicts) {
        const conflictingSlots = adminHours.slots.filter(s => 
          s.day === updatedData.day && 
          s.status !== 'rejected' &&
          s.status !== 'cancelled' &&
          s.status !== 'deleted' &&
          s._id.toString() !== slotObjectId.toString() && // Double check exclusion
          ((parseTime(s.startTime) <= newStartTime && parseTime(s.endTime) > newStartTime) ||
           (parseTime(s.startTime) < newEndTime && parseTime(s.endTime) >= newEndTime) ||
           (parseTime(s.startTime) >= newStartTime && parseTime(s.endTime) <= newEndTime))
        );

        if (conflictingSlots.length > 0) {
          const conflictDetails = conflictingSlots.map(s => 
            `${s.day} at ${s.startTime}-${s.endTime} (${s.status})`
          ).join(', ');

          throw new Error(
            `Admin hours conflict found: New slot ${updatedData.day} (${updatedData.startTime}-${updatedData.endTime}) ` +
            `conflicts with existing admin hours: ${conflictDetails}`
          );
        }
      }

      // Add this additional conflict check before proceeding with existing checks
      // Check for conflicts with existing admin hours
      const existingAdminHours = await AdminHours.findOne({
        user: document.user._id,
        term: document.term._id,
        isActive: true,
        slots: {
          $elemMatch: {
            day: updatedData.day,
            status: { $in: ['pending', 'approved'] },
            _id: { $ne: slotObjectId }, // Exclude current slot
            $or: [
              // Case 1: New slot starts during an existing slot
              {
                startTime: { $lte: updatedData.startTime },
                endTime: { $gt: updatedData.startTime }
              },
              // Case 2: New slot ends during an existing slot
              {
                startTime: { $lt: updatedData.endTime },
                endTime: { $gte: updatedData.endTime }
              },
              // Case 3: New slot completely contains an existing slot
              {
                startTime: { $gte: updatedData.startTime },
                endTime: { $lte: updatedData.endTime }
              }
            ]
          }
        }
      });

      if (existingAdminHours) {
        // Find specific conflicting slots
        const conflictingSlots = existingAdminHours.slots.filter(existingSlot => {
          if (existingSlot._id.toString() === slotObjectId.toString()) return false;
          if (existingSlot.day !== updatedData.day) return false;
          if (!['pending', 'approved'].includes(existingSlot.status)) return false;

          const existingStart = moment(existingSlot.startTime, 'h:mm A');
          const existingEnd = moment(existingSlot.endTime, 'h:mm A');
          const newStart = moment(updatedData.startTime, 'h:mm A');
          const newEnd = moment(updatedData.endTime, 'h:mm A');

          // Check for time overlap
          return (
            (newStart.isSameOrAfter(existingStart) && newStart.isBefore(existingEnd)) ||
            (newEnd.isAfter(existingStart) && newEnd.isSameOrBefore(existingEnd)) ||
            (newStart.isSameOrBefore(existingStart) && newEnd.isSameOrAfter(existingEnd))
          );
        });

        if (conflictingSlots.length > 0) {
          const conflictDetails = conflictingSlots.map(s => 
            `${s.day} at ${s.startTime}-${s.endTime} (${s.status})`
          ).join(', ');

          throw new Error(
            `Time slot conflict with existing admin hours: ${conflictDetails}`
          );
        }
      }

      // If no conflicts, proceed with update
      const result = await AdminHours.findOneAndUpdate(
        { 
          _id: adminHoursObjectId,
          'slots._id': slotObjectId,
          'slots.status': 'approved'
        },
        {
          $set: {
            'slots.$.day': updatedData.day,
            'slots.$.startTime': updatedData.startTime,
            'slots.$.endTime': updatedData.endTime,
            'slots.$.updatedAt': new Date()
          }
        },
        { 
          new: true,
          runValidators: true
        }
      ).populate({
        path: 'user',
        select: 'firstName lastName department _id',
        model: 'Users',
        populate: {
          path: 'department',
          model: 'Departments',
          select: 'departmentCode'
        }
      });

      if (!result) {
        throw new Error('Failed to update approved admin hours');
      }

      // Find the specific slot that was updated
      const updatedSlot = result.slots.find(s => s._id.toString() === slotId);

      // Create notification for the requester
      await createNotification({
        userId: result.user._id,
        title: 'Admin Hours Updated',
        message: `Your approved admin hours for ${updatedSlot.day} (${updatedSlot.startTime} - ${updatedSlot.endTime}) has been updated.`,
        type: 'info'
      });

      // Trigger Pusher event for updated request
      await pusherServer.trigger('admin-hours', 'request-updated', {
        request: JSON.parse(JSON.stringify(result))
      });

      return result;
    } catch (error) {
      console.error('Error in editApprovedAdminHours:', error);
      throw error;
    }
  }

  async getFullTimeUsers(userRole, userDepartment) {
    try {
      await connectDB();
      
      const User = mongoose.models.User || mongoose.model('User', require('../../../db/schema').UserSchema);

      // Base match conditions
      const matchConditions = {
        employmentType: 'full-time',
        isActive: { $ne: false },
        role: { $ne: 'Administrator' } // Exclude all administrators by default
      };

      if (userRole === 'Dean' && userDepartment) {
        // For Deans: Show only their department's users and themselves
        matchConditions['$or'] = [
          // Include dean's own account
          {
            _id: new mongoose.Types.ObjectId(userDepartment._id),
            role: 'Dean'
          },
          // Include department's faculty and program chairs
          {
            department: new mongoose.Types.ObjectId(userDepartment),
            role: { $in: ['Faculty', 'Program Chair'] }
          }
        ];
      } else if (userRole === 'Administrator') {
        // For Admins: Show all deans, program chairs, and faculty
        matchConditions['role'] = { 
          $in: ['Dean', 'Program Chair', 'Faculty']
        };
      }

      console.log('User query conditions:', JSON.stringify(matchConditions, null, 2));

      const users = await User.aggregate([
        { $match: matchConditions },
        {
          $lookup: {
            from: 'departments',
            localField: 'department',
            foreignField: '_id',
            as: 'departmentInfo'
          }
        },
        { $unwind: '$departmentInfo' },
        {
          $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            role: 1,
            department: {
              _id: '$departmentInfo._id',
              departmentCode: '$departmentInfo.departmentCode'
            }
          }
        },
        { $sort: { role: 1, lastName: 1, firstName: 1 } }
      ]);

      console.log(`Found ${users.length} eligible users`);
      return users;
    } catch (error) {
      console.error('Error in getFullTimeUsers:', error);
      throw new Error('Failed to fetch users: ' + error.message);
    }
  }

  async getRequests(filter = 'pending', termId, userRole, userDepartment) {
    try {
      await this.initModel();
      
      // Base query conditions
      const baseQuery = { 
        isActive: true,
        term: new mongoose.Types.ObjectId(termId)
      };

      if (userRole === 'Dean' && userDepartment) {
        // For deans, add department filter at the query level
        const requests = await this.MODEL.aggregate([
          { 
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'userInfo'
            }
          },
          { $unwind: '$userInfo' },
          { 
            $lookup: {
              from: 'departments',
              localField: 'userInfo.department',
              foreignField: '_id',
              as: 'departmentInfo'
            }
          },
          { $unwind: '$departmentInfo' },
          {
            $match: {
              ...baseQuery,
              'userInfo.department': new mongoose.Types.ObjectId(userDepartment),
              'slots.status': filter
            }
          },
          {
            $addFields: {
              user: {
                _id: '$userInfo._id',
                firstName: '$userInfo.firstName',
                lastName: '$userInfo.lastName',
                department: {
                  _id: '$departmentInfo._id',
                  departmentCode: '$departmentInfo.departmentCode'
                }
              }
            }
          },
          {
            $project: {
              userInfo: 0,
              departmentInfo: 0
            }
          }
        ]).sort({ createdAt: -1 });

        console.log('Requests for Dean:', requests);
        return requests;
      }

      // For administrators, fetch all requests
      return await this.MODEL.find({
        ...baseQuery,
        'slots.status': filter
      })
      .populate({
        path: 'user',
        select: 'firstName lastName department',
        model: 'Users',
        populate: {
          path: 'department',
          model: 'Departments',
          select: 'departmentCode'
        }
      })
      .sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error fetching admin hour requests:', error);
      throw new Error('Failed to fetch admin hour requests');
    }
  }

  async deleteAdminHours(adminHoursId, slotId) {
    try {
      const AdminHours = await this.initModel();

      // Debug logging
      console.log('Deleting admin hours with IDs:', { adminHoursId, slotId });
      
      // Convert string IDs to ObjectIds if they're not already
      const adminHoursObjectId = typeof adminHoursId === 'string' ? new mongoose.Types.ObjectId(adminHoursId) : adminHoursId;
      const slotObjectId = typeof slotId === 'string' ? new mongoose.Types.ObjectId(slotId) : slotId;

      // Find the document first to verify it exists
      const document = await AdminHours.findOne({
        _id: adminHoursObjectId,
        'slots._id': slotObjectId
      });

      if (!document) {
        throw new Error('Admin hours document not found');
      }

      // Find the specific slot
      const slot = document.slots.find(s => s._id.toString() === slotObjectId.toString());
      
      if (!slot) {
        throw new Error('Admin hours slot not found');
      }

      if (slot.status !== 'approved') {
        throw new Error('Can only delete approved admin hours');
      }

      // Update the slot status
      const result = await AdminHours.findOneAndUpdate(
        {
          _id: adminHoursObjectId,
          'slots._id': slotObjectId,
          'slots.status': 'approved'
        },
        {
          $set: {
            'slots.$.status': 'deleted',
            'slots.$.updatedAt': new Date()
          }
        },
        {
          new: true,
          runValidators: true
        }
      ).populate({
        path: 'user',
        select: 'firstName lastName department _id',
        model: 'Users',
        populate: {
          path: 'department',
          model: 'Departments',
          select: 'departmentCode'
        }
      });

      if (!result) {
        throw new Error('Failed to delete admin hours');
      }

      // Find the specific slot that was updated
      const updatedSlot = result.slots.find(s => s._id.toString() === slotId);
      
      // Create notification for the requester
      await createNotification({
        userId: result.user._id,
        title: 'Admin Hours Deleted',
        message: `Your admin hours for ${updatedSlot.day} (${updatedSlot.startTime} - ${updatedSlot.endTime}) has been deleted.`,
        type: 'info'
      });

      // Trigger Pusher event for deleted request
      await pusherServer.trigger('admin-hours', 'request-updated', {
        request: JSON.parse(JSON.stringify(result))
      });

      return result;
    } catch (error) {
      console.error('Error in deleteAdminHours:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export default new AdminHoursModel();
