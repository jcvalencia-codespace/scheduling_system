import mongoose from 'mongoose';
import { AdminHourSchema } from '../../../db/schema';
import connectDB from '../../../lib/mongo';

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
      // Get active term
      const Term = mongoose.models.Term || mongoose.model('Term', require('../../../db/schema').TermSchema);
      const activeTerm = await Term.findOne({ status: 'Active' });
      if (!activeTerm) {
        throw new Error('No active term found');
      }
      termId = activeTerm._id;

      const AdminHours = await this.initModel();
      const hours = await AdminHours.findOne({
        user: new mongoose.Types.ObjectId(userId),
        term: new mongoose.Types.ObjectId(termId),
        isActive: true
      });
      return hours || { slots: [] };
    } catch (error) {
      console.error('Error fetching admin hours:', error);
      throw new Error('Failed to fetch admin hours');
    }
  }

  async saveAdminHours(userId, termId, slots) {
    try {
      // Get active term first for academicYear
      const Term = mongoose.models.Term || mongoose.model('Term', require('../../../db/schema').TermSchema);
      const activeTerm = await Term.findOne({ status: 'Active' });
      if (!activeTerm) {
        throw new Error('No active term found');
      }

      // Use active term's ID instead of passed termId
      termId = activeTerm._id;

      const AdminHours = await this.initModel();
      const existingHours = await AdminHours.findOne({ 
        user: new mongoose.Types.ObjectId(userId),
        term: new mongoose.Types.ObjectId(termId)
      });
      
      const updateData = {
        user: new mongoose.Types.ObjectId(userId),
        term: new mongoose.Types.ObjectId(termId),
        slots,
        isActive: true,
        $push: {
          updateHistory: {
            updatedBy: new mongoose.Types.ObjectId(userId),
            updatedAt: new Date(),
            action: existingHours ? 'updated' : 'created',
            academicYear: activeTerm.academicYear
          }
        }
      };

      const result = await AdminHours.findOneAndUpdate(
        { 
          user: new mongoose.Types.ObjectId(userId),
          term: new mongoose.Types.ObjectId(termId)
        },
        updateData,
        { 
          upsert: true, 
          new: true,
          setDefaultsOnInsert: true 
        }
      );

      return result;
    } catch (error) {
      console.error('Error saving admin hours:', error);
      throw new Error('Failed to save admin hours');
    }
  }
}

// Export a singleton instance
export default new AdminHoursModel();
