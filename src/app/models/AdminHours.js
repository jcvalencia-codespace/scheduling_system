import mongoose from 'mongoose';
import { AdminHourSchema, DepartmentSchema } from '../../../db/schema';
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

      // Validate against schedule conflicts
      for (const slot of newSlots) {
        const scheduleConflicts = await Schedules.find({
          isActive: true,
          term: termObjectId,
          faculty: userId,
          'scheduleSlots.days': slot.day,
          $or: [{
            $and: [
              { 'scheduleSlots.timeFrom': { $lte: slot.startTime } },
              { 'scheduleSlots.timeTo': { $gt: slot.startTime } }
            ]
          }, {
            $and: [
              { 'scheduleSlots.timeFrom': { $lt: slot.endTime } },
              { 'scheduleSlots.timeTo': { $gte: slot.endTime } }
            ]
          }]
        });

        if (scheduleConflicts.length > 0) {
          throw new Error(`Schedule conflict found for ${slot.day} at ${slot.startTime}-${slot.endTime}`);
        }

        // Check for admin hours conflicts
        const adminHoursConflicts = await AdminHours.find({
          user: userId,
          term: termObjectId,
          isActive: true,
          'slots.day': slot.day,
          'slots.status': { $in: ['pending', 'approved'] },
          $or: [{
            $and: [
              { 'slots.startTime': { $lte: slot.startTime } },
              { 'slots.endTime': { $gt: slot.startTime } }
            ]
          }, {
            $and: [
              { 'slots.startTime': { $lt: slot.endTime } },
              { 'slots.endTime': { $gte: slot.endTime } }
            ]
          }]
        });

        if (adminHoursConflicts.length > 0) {
          throw new Error(`Admin hours conflict found for ${slot.day} at ${slot.startTime}-${slot.endTime}`);
        }
      }

      // Find existing admin hours document
      let adminHours = await AdminHours.findOne({
        user: userId,
        term: termObjectId
      });

      // Determine if approval is needed
      const needsApproval = !(
        role === 'Administrator' || 
        role === 'Dean' || 
        (role === 'Dean' && userId === creatorId)
      );

      // Prepare new slots with status
      const preparedNewSlots = newSlots.map(slot => ({
        ...slot,
        status: needsApproval ? 'pending' : 'approved',
        approvedBy: !needsApproval ? creatorId : undefined,
        approvalDate: !needsApproval ? new Date() : undefined,
        createdAt: new Date()
      }));

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

      // Get populated result
      const populatedResult = await AdminHours.findById(adminHours._id)
        .populate({
          path: 'user',
          select: 'firstName lastName department',
          model: 'Users',
          populate: {
            path: 'department',
            model: 'Departments',
            select: 'departmentCode'
          }
        });

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
      
      const objectId = mongoose.Types.ObjectId.isValid(adminHoursId) 
        ? new mongoose.Types.ObjectId(adminHoursId)
        : null;

      if (!objectId) {
        throw new Error('Invalid admin hours ID format');
      }

      // Update only the specific slot
      const result = await AdminHours.findOneAndUpdate(
        { 
          _id: objectId,
          'slots._id': slotId
        },
        {
          $set: {
            'slots.$.status': 'cancelled'
          }
        },
        { new: true }
      );

      if (!result) {
        throw new Error('Admin hours record or slot not found');
      }

      const populatedResult = await AdminHours.findById(result._id)
        .populate({
          path: 'user',
          select: 'firstName lastName department',
          model: 'Users',
          populate: {
            path: 'department',
            model: 'Departments',
            select: 'departmentCode'
          }
        });

      // Trigger Pusher event for cancelled request
      await pusherServer.trigger('admin-hours', 'request-updated', {
        request: JSON.parse(JSON.stringify(populatedResult))
      });

      return populatedResult;
    } catch (error) {
      console.error('Error in cancelAdminHours:', error);
      throw error;
    }
  }

  async getFullTimeUsers() {
    try {
      await connectDB();
      console.log('DB connection established');
      
      const User = mongoose.models.User || mongoose.model('User', require('../../../db/schema').UserSchema);
      console.log('User model initialized');

      // Use lowercase for collection name to match MongoDB collection
      const users = await User.aggregate([
        {
          $match: {
            employmentType: 'full-time',  // Match exact string from schema enum
            role: { $ne: 'Administrator' }
          }
        },
        {
          $lookup: {
            from: 'departments',  // Use lowercase collection name
            localField: 'department',
            foreignField: '_id',
            as: 'departmentInfo'
          }
        },
        {
          $unwind: '$departmentInfo'
        },
        {
          $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            role: 1,
            department: {
              departmentCode: '$departmentInfo.departmentCode'
            }
          }
        },
        {
          $sort: {
            lastName: 1,
            firstName: 1
          }
        }
      ]);

      console.log('Full-time users found:', users.length);
      console.log('Sample user:', users[0]);

      return users;
    } catch (error) {
      console.error('Error in getFullTimeUsers:', error);
      console.error('Error details:', error.stack);
      throw new Error('Failed to fetch users: ' + error.message);
    }
  }

  async getRequests(filter = 'pending') {
    try {
      await this.initModel();
      
      const requests = await this.MODEL.find({ 
        isActive: true,
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
      
      return requests;
    } catch (error) {
      console.error('Error fetching admin hour requests:', error);
      throw new Error('Failed to fetch admin hour requests');
    }
  }
}

// Export a singleton instance
export default new AdminHoursModel();
