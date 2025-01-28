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
    const feedback = await Feedback.find({ submittedBy: userId, isActive: true })
      .sort({ createdAt: -1 });
    return JSON.parse(JSON.stringify(feedback));
  }

  async getAllFeedback() {
    const Feedback = await this.initModel();
    const feedback = await Feedback.find({ isActive: true })
      .sort({ createdAt: -1 })
      .populate('submittedBy', 'firstName lastName email');
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
