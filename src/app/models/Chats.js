import { ChatSchema } from '../../../db/schema';
import connectDB from '../../../lib/mongo';
import mongoose from 'mongoose';
import usersModel from './Users';

class ChatsModel {
  constructor() {
    this.MODEL = null;
  }

  async initModel() {
    if (!this.MODEL) {
      await connectDB();
      this.MODEL = mongoose.models.Chats || mongoose.model('Chats', ChatSchema);
    }
    return this.MODEL;
  }

  async createChat(chatData) {
    try {
      const Chat = await this.initModel();
      const chat = new Chat(chatData);
      const savedChat = await chat.save();
      return JSON.parse(JSON.stringify(savedChat));
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  async getChats(userId) {
    try {
      const Chat = await this.initModel();
      const chats = await Chat.find({
        participants: userId
      })
      .populate('participants', 'firstName lastName email')
      .populate('messages.sender', 'firstName lastName email')
      .sort({ lastMessage: -1 });
      return JSON.parse(JSON.stringify(chats));
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw error;
    }
  }
  
  async getChatById(chatId) {
    try {
      const Chat = await this.initModel();
      const chat = await Chat.findById(chatId)
        .populate('participants', 'firstName lastName email')
        .populate('messages.sender', 'firstName lastName email');
      return chat ? JSON.parse(JSON.stringify(chat)) : null;
    } catch (error) {
      console.error('Error fetching chat:', error);
      throw error;
    }
  }

  async addMessage(chatId, messageData) {
    try {
      const Chat = await this.initModel();
      const chat = await Chat.findByIdAndUpdate(
        chatId,
        {
          $push: { messages: messageData },
          $set: { lastMessage: new Date() }
        },
        { new: true }
      )
      .populate('participants', 'firstName lastName email')
      .populate('messages.sender', 'firstName lastName email');
      return chat ? JSON.parse(JSON.stringify(chat)) : null;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  async markMessageAsRead(chatId, messageId, userId) {
    try {
      const Chat = await this.initModel();
      const chat = await Chat.findOneAndUpdate(
        { 
          _id: chatId,
          'messages._id': messageId
        },
        {
          $addToSet: { 'messages.$.readBy': { user: userId, readAt: new Date() } }
        },
        { new: true }
      )
      .populate('participants', 'firstName lastName email')
      .populate('messages.sender', 'firstName lastName email');
      return chat ? JSON.parse(JSON.stringify(chat)) : null;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  async deleteChat(chatId) {
    try {
      const Chat = await this.initModel();
      const deletedChat = await Chat.findByIdAndDelete(chatId);
      return deletedChat ? JSON.parse(JSON.stringify(deletedChat)) : null;
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  }

  async getAllUsers() {
    try {
      const users = await usersModel.getAllUsers();
      return users;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const chatsModel = new ChatsModel();
export default chatsModel;