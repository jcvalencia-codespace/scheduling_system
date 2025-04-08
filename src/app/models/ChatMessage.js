import { ChatMessageSchema } from '../../../db/schema';
import connectDB from '../../../lib/mongo';
import mongoose from 'mongoose';

class ChatMessageModel {
  constructor() {
    this.MODEL = null;
  }

  async initModel() {
    try {
      if (!this.MODEL) {
        await connectDB();
        this.MODEL = mongoose.models.ChatMessages || mongoose.model("ChatMessages", ChatMessageSchema);
      }
      return this.MODEL;
    } catch (error) {
      console.error('Failed to initialize ChatMessage model:', error);
      throw error;
    }
  }

  async getMessages(userId) {
    const ChatMessage = await this.initModel();
    const messages = await ChatMessage.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    })
    .populate('sender', 'firstName lastName email')
    .populate('receiver', 'firstName lastName email')
    .sort({ createdAt: 1 });
    
    return JSON.parse(JSON.stringify(messages));
  }

  async sendMessage(senderId, receiverId, message) {
    const ChatMessage = await this.initModel();
    const newMessage = new ChatMessage({
      sender: senderId,
      receiver: receiverId,
      message,
      read: false
    });
    
    const savedMessage = await newMessage.save();
    return JSON.parse(JSON.stringify(savedMessage));
  }
}

const chatMessageModel = new ChatMessageModel();
export default chatMessageModel;
