import mongoose from 'mongoose';
import { AdminHourSchema } from '../../../db/schema';
import connectDB from '../../../lib/mongo';
import moment from 'moment';

class AdminHoursModel {
  constructor() {
    this.MODEL = null;
  }

  async initModel() {
    if (!this.MODEL) {
      await connectDB();
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

  async saveAdminHours(userId, termId, slots, creatorId, role) {
    try {
      await connectDB();
      console.log('Saving admin hours with term:', termId); // Debug log

      const AdminHours = await this.initModel();
      const User = mongoose.models.User || mongoose.model('User', require('../../../db/schema').UserSchema);

      // Validate term ID
      if (!mongoose.Types.ObjectId.isValid(termId)) {
        throw new Error('Invalid term ID provided');
      }

      // Convert term ID to ObjectId
      const termObjectId = new mongoose.Types.ObjectId(termId);

      // Get user info
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      if (user.employmentType !== 'full-time') throw new Error('Only full-time employees can have admin hours');

      // Check for schedule conflicts
      const Schedule = mongoose.models.Schedule || mongoose.model('Schedule', require('../../../db/schema').ScheduleSchema);
      const schedules = await Schedule.find({
        faculty: userId,
        term: termObjectId,
        isActive: true
      });

      // Convert teaching schedules to time ranges for comparison
      const teachingSlots = schedules.flatMap(schedule => 
        schedule.scheduleSlots.flatMap(slot => ({
          day: slot.days[0],
          start: moment(slot.timeFrom, 'h:mm A'),
          end: moment(slot.timeTo, 'h:mm A')
        }))
      );

      // Check for conflicts
      for (const slot of slots) {
        const slotStart = moment(slot.startTime, 'h:mm A');
        const slotEnd = moment(slot.endTime, 'h:mm A');
        
        const conflict = teachingSlots.find(teaching => 
          teaching.day === slot.day &&
          slotStart.isBefore(teaching.end) &&
          slotEnd.isAfter(teaching.start)
        );

        if (conflict) {
          throw new Error(`Time slot conflicts with existing teaching schedule on ${slot.day}`);
        }
      }

      // Determine if approval is needed based on role and creator
      const needsApproval = !(
        role === 'Administrator' || 
        role === 'Dean' || 
        (role === 'Dean' && userId === creatorId)
      );

      const updateData = {
        user: userId,
        term: termObjectId, // Use the converted ObjectId
        slots,
        status: needsApproval ? 'pending' : 'approved',
        needsApproval,
        createdBy: creatorId,
        approvedBy: !needsApproval ? creatorId : null,
        approvalDate: !needsApproval ? new Date() : null,
        isActive: true
      };

      const result = await AdminHours.findOneAndUpdate(
        { 
          user: new mongoose.Types.ObjectId(userId), 
          term: termObjectId 
        },
        updateData,
        { upsert: true, new: true }
      );

      return result;
    } catch (error) {
      console.error('Error saving admin hours:', error);
      throw new Error(error.message || 'Failed to save admin hours');
    }
  }

  async approveAdminHours(adminHoursId, approverId, approved, rejectionReason = null) {
    try {
      const AdminHours = await this.initModel();
      
      const update = {
        status: approved ? 'approved' : 'rejected',
        approvedBy: approverId,
        approvalDate: new Date(),
        ...(rejectionReason && { rejectionReason })
      };

      const result = await AdminHours.findByIdAndUpdate(
        adminHoursId,
        update,
        { new: true }
      );

      return result;
    } catch (error) {
      console.error('Error updating admin hours approval:', error);
      throw new Error('Failed to update admin hours approval');
    }
  }

  async cancelAdminHours(adminHoursId) {
    try {
      const AdminHours = await this.initModel();
      
      // Convert string ID to ObjectId if it's not already
      const objectId = mongoose.Types.ObjectId.isValid(adminHoursId) 
        ? new mongoose.Types.ObjectId(adminHoursId)
        : null;

      if (!objectId) {
        throw new Error('Invalid admin hours ID format');
      }

      console.log('Cancelling admin hours with ID:', objectId.toString());

      const result = await AdminHours.findByIdAndUpdate(
        objectId,
        { 
          isActive: false,
          status: 'cancelled',
          $push: {
            updateHistory: {
              action: 'cancelled',
              updatedAt: new Date(),
              updatedBy: objectId
            }
          }
        },
        { new: true }
      );

      if (!result) {
        throw new Error('Admin hours record not found');
      }

      console.log('Successfully cancelled admin hours:', result._id);
      return result;
    } catch (error) {
      console.error('Error in cancelAdminHours:', error);
      throw new Error(
        error.message === 'Invalid admin hours ID format' || error.message === 'Admin hours record not found'
          ? error.message
          : 'Failed to cancel admin hours'
      );
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
}

// Export a singleton instance
export default new AdminHoursModel();
