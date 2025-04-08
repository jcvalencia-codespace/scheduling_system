import { ChatMessageSchema } from '../../../db/schema';
import usersModel from './Users';
import connectDB from '../../../lib/mongo';
import mongoose from 'mongoose';

class ChatUsersModel {
  constructor() {
    this.MODEL = null;
  }

  async initModel() {
    if (!this.MODEL) {
      await connectDB();
      this.MODEL = mongoose.models.ChatMessages || mongoose.model("ChatMessages", ChatMessageSchema);
    }
    return this.MODEL;
  }

  async getChatMessages(senderId, receiverId) {
    try {
      const ChatMessages = await this.initModel();
      const messages = await ChatMessages.find({
        $or: [
          { sender: senderId, receiver: receiverId },
          { sender: receiverId, receiver: senderId }
        ]
      })
      .lean()
      .exec();

      // Properly serialize the data
      return messages.map(msg => ({
        _id: msg._id.toString(),
        sender: msg.sender.toString(),
        receiver: msg.receiver.toString(),
        content: msg.content,
        read: msg.read,
        createdAt: msg.createdAt.toISOString(),
        updatedAt: msg.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error getting chat messages:', error);
      return [];
    }
  }

  async getRecentChats(userId) {
    try {
      const ChatMessages = await this.initModel();
      const latestMessages = await ChatMessages.aggregate([
        {
          $match: {
            $or: [
              { sender: new mongoose.Types.ObjectId(userId) },
              { receiver: new mongoose.Types.ObjectId(userId) }
            ]
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
                "$receiver",
                "$sender"
              ]
            },
            lastMessage: { $first: "$$ROOT" }
          }
        }
      ]);

      // Properly serialize the aggregation result
      return latestMessages.map(chat => ({
        _id: chat._id.toString(),
        lastMessage: {
          _id: chat.lastMessage._id.toString(),
          sender: chat.lastMessage.sender.toString(),
          receiver: chat.lastMessage.receiver.toString(),
          content: chat.lastMessage.content,
          createdAt: chat.lastMessage.createdAt.toISOString()
        }
      }));
    } catch (error) {
      console.error('Error in getRecentChats:', error);
      return [];
    }
  }

  async sendMessage(messageData) {
    try {
      const ChatMessages = await this.initModel();
      const { senderId, receiverId, content } = messageData;
      
      const newMessage = new ChatMessages({
        sender: senderId,
        receiver: receiverId,
        content: content,
        read: false
      });

      const savedMessage = await newMessage.save();
      return {
        _id: savedMessage._id.toString(),
        sender: savedMessage.sender.toString(),
        receiver: savedMessage.receiver.toString(),
        content: savedMessage.content,
        createdAt: savedMessage.createdAt
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getAvailableUsers(userId) {
    const users = await usersModel.getAllUsers();
    return users.filter(user => user._id !== userId);
  }
}

const chatUsersModel = new ChatUsersModel();
export default chatUsersModel;
