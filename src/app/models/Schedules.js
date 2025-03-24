import { ScheduleSchema } from '../../../db/schema';
import connectDB from '../../../lib/mongo';
import mongoose from 'mongoose';

class SchedulesModel {
  constructor() {
    this.MODEL = null;
  }

  async initModel() {
    if (!this.MODEL) {
      await connectDB();
      this.MODEL = mongoose.models.Schedules || mongoose.model("Schedules", ScheduleSchema);
    }
    return this.MODEL;
  }

  async createSchedule(scheduleData) {
    const Schedule = await this.initModel();
    
    // Validate time slot availability before creating
    const isSlotAvailable = await this.checkTimeSlotAvailability(
      scheduleData.roomId,
      scheduleData.days,
      scheduleData.timeFrom,
      scheduleData.timeTo,
      scheduleData.termId
    );

    if (!isSlotAvailable) {
      throw new Error('Time slot is not available for this room');
    }

    // Validate faculty availability
    const isFacultyAvailable = await this.checkFacultyAvailability(
      scheduleData.facultyId,
      scheduleData.days,
      scheduleData.timeFrom,
      scheduleData.timeTo,
      scheduleData.termId
    );

    if (!isFacultyAvailable) {
      throw new Error('Faculty is not available during this time slot');
    }

    const schedule = new Schedule(scheduleData);
    const savedSchedule = await schedule.save();
    return this.populateSchedule(savedSchedule);
  }

  async getAllSchedules(termId) {
    const Schedule = await this.initModel();
    const schedules = await Schedule.find({ 
      termId,
      isActive: true 
    });
    return Promise.all(schedules.map(schedule => this.populateSchedule(schedule)));
  }

  async getSchedulesBySection(sectionId, termId) {
    const Schedule = await this.initModel();
    const schedules = await Schedule.find({ 
      sectionId,
      termId,
      isActive: true 
    });
    return Promise.all(schedules.map(schedule => this.populateSchedule(schedule)));
  }

  async getSchedulesByFaculty(facultyId, termId) {
    const Schedule = await this.initModel();
    const schedules = await Schedule.find({ 
      facultyId,
      termId,
      isActive: true 
    });
    return Promise.all(schedules.map(schedule => this.populateSchedule(schedule)));
  }

  async updateSchedule(scheduleId, updateData) {
    const Schedule = await this.initModel();
    
    // If updating time or room, validate availability
    if (updateData.roomId || updateData.days || updateData.timeFrom || updateData.timeTo) {
      const schedule = await Schedule.findById(scheduleId);
      const isSlotAvailable = await this.checkTimeSlotAvailability(
        updateData.roomId || schedule.roomId,
        updateData.days || schedule.days,
        updateData.timeFrom || schedule.timeFrom,
        updateData.timeTo || schedule.timeTo,
        schedule.termId,
        scheduleId // exclude current schedule from check
      );

      if (!isSlotAvailable) {
        throw new Error('Time slot is not available for this room');
      }
    }

    const updatedSchedule = await Schedule.findByIdAndUpdate(
      scheduleId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    return this.populateSchedule(updatedSchedule);
  }

  async deleteSchedule(scheduleId) {
    const Schedule = await this.initModel();
    const schedule = await Schedule.findByIdAndUpdate(
      scheduleId,
      { $set: { isActive: false } },
      { new: true }
    );
    return schedule ? this.populateSchedule(schedule) : null;
  }

  async checkTimeSlotAvailability(roomId, days, timeFrom, timeTo, termId, excludeScheduleId = null) {
    const Schedule = await this.initModel();
    
    const conflictingSchedule = await Schedule.findOne({
      _id: { $ne: excludeScheduleId },
      roomId,
      termId,
      days: { $in: days },
      isActive: true,
      $or: [
        {
          timeFrom: { $lt: timeTo },
          timeTo: { $gt: timeFrom }
        }
      ]
    });

    return !conflictingSchedule;
  }

  async checkFacultyAvailability(facultyId, days, timeFrom, timeTo, termId, excludeScheduleId = null) {
    const Schedule = await this.initModel();
    
    const conflictingSchedule = await Schedule.findOne({
      _id: { $ne: excludeScheduleId },
      facultyId,
      termId,
      days: { $in: days },
      isActive: true,
      $or: [
        {
          timeFrom: { $lt: timeTo },
          timeTo: { $gt: timeFrom }
        }
      ]
    });

    return !conflictingSchedule;
  }

  async populateSchedule(schedule) {
    if (!schedule) return null;
    
    await schedule.populate([
      { path: 'facultyId', select: 'firstName lastName email' },
      { path: 'sectionId', select: 'sectionName courseCode' },
      { path: 'subjectId', select: 'subjectCode subjectName' },
      { path: 'roomId', select: 'roomCode roomName' },
      { path: 'termId', select: 'academicYear term' }
    ]);

    return JSON.parse(JSON.stringify(schedule));
  }
}

const schedulesModel = new SchedulesModel();
export default schedulesModel; 