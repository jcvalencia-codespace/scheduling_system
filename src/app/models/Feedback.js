import { FeedbackSchema } from '../../../db/schema';
import connectDB from '../../../lib/mongo';
import mongoose from 'mongoose';

class FeedbackModel {
  constructor() {
    this.MODEL = null;
  }

  async initModel() {
    if (!this.MODEL) {
      await connectDB();
      this.MODEL = mongoose.models.Feedback || mongoose.model("Feedback", FeedbackSchema);
    }
    return this.MODEL;
  }

  async createFeedback(feedbackData) {
    const Feedback = await this.initModel();
    const feedback = new Feedback(feedbackData);
    const savedFeedback = await feedback.save();
    return JSON.parse(JSON.stringify(savedFeedback));
  }

  async getFeedbackByUser(userId) {
    const Feedback = await this.initModel();
    const feedback = await Feedback.aggregate([
      { 
        $match: { 
          submittedBy: new mongoose.Types.ObjectId(userId), 
          isActive: true 
        } 
      },
      {
        $lookup: {
          from: 'users',
          localField: 'submittedBy',
          foreignField: '_id',
          as: 'submittedBy'
        }
      },
      { $unwind: '$submittedBy' },
      {
        $project: {
          subject: 1,
          message: 1,
          type: 1,
          priority: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          'submittedBy._id': 1,
          'submittedBy.firstName': 1,
          'submittedBy.lastName': 1,
          'submittedBy.email': 1
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
    return JSON.parse(JSON.stringify(feedback));
  }

  async getAllFeedback() {
    const Feedback = await this.initModel();
    const feedback = await Feedback.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'submittedBy',
          foreignField: '_id',
          as: 'submittedBy'
        }
      },
      { $unwind: '$submittedBy' },
      {
        $project: {
          subject: 1,
          message: 1,
          type: 1,
          priority: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          'submittedBy._id': 1,
          'submittedBy.firstName': 1,
          'submittedBy.lastName': 1,
          'submittedBy.email': 1
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
    return JSON.parse(JSON.stringify(feedback));
  }

  async updateFeedback(feedbackId, updateData) {
    const Feedback = await this.initModel();
    const updatedFeedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      { $set: { ...updateData, updatedAt: new Date() } },
      { new: true }
    );
    return updatedFeedback ? JSON.parse(JSON.stringify(updatedFeedback)) : null;
  }

  async deleteFeedback(feedbackId) {
    const Feedback = await this.initModel();
    const deletedFeedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      { $set: { isActive: false, updatedAt: new Date() } },
      { new: true }
    );
    return deletedFeedback ? JSON.parse(JSON.stringify(deletedFeedback)) : null;
  }
}

// Create and export a singleton instance
const feedbackModel = new FeedbackModel();
export default feedbackModel;
