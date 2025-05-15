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
      let chat;
      
      // Try to find by ID first
      if (mongoose.Types.ObjectId.isValid(chatId)) {
        chat = await Chat.findById(chatId)
          .populate('participants', 'firstName lastName email')
          .populate('messages.sender', 'firstName lastName email');
      }
      
      // If not found, try to find by participants
      if (!chat) {
        chat = await Chat.findOne({
          participants: { $all: [chatId] }
        })
        .populate('participants', 'firstName lastName email')
        .populate('messages.sender', 'firstName lastName email');
      }

      return chat ? JSON.parse(JSON.stringify(chat)) : null;
    } catch (error) {
      console.error('Error fetching chat:', error);
      throw error;
    }
  }

  async findOrCreateChat(participants) {
    try {
      const Chat = await this.initModel();
      
      // Sort participants to ensure consistent order
      const sortedParticipants = [...participants].sort();
      
      // Try to find existing chat with participants in any order
      let chat = await Chat.findOne({
        $and: [
          { participants: { $size: 2 } }, // Only look for 1-on-1 chats
          { participants: { $all: sortedParticipants } }, // Must contain both participants
          { isGroup: false } // Ensure it's not a group chat
        ]
      })
      .populate('participants', 'firstName lastName email')
      .populate('messages.sender', 'firstName lastName email');

      // Create new chat only if none exists
      if (!chat) {
        console.log('No existing chat found, creating new chat');
        chat = await Chat.create({
          participants: sortedParticipants,
          messages: [],
          lastMessage: null,
          isGroup: false,
          isActive: true
        });

        // Populate the newly created chat
        chat = await chat.populate([
          { path: 'participants', select: 'firstName lastName email' },
          { path: 'messages.sender', select: 'firstName lastName email' }
        ]);
      } else {
        console.log('Found existing chat:', chat._id);
      }

      return JSON.parse(JSON.stringify(chat));
    } catch (error) {
      console.error('Error in findOrCreateChat:', error);
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
      // First get all users
      const users = await usersModel.getAllUsers();
      
      // Then get all chats with only the last message
      const Chat = await this.initModel();
      const chats = await Chat.find({}, {
        participants: 1,
        'messages': { $slice: -1 }
      })
      .populate('messages.sender', 'firstName lastName email')
      .sort({ 'messages.createdAt': -1 });

      // Map users with their last messages
      const usersWithLastMessage = users.map(user => {
        // Find all chats where this user is a participant
        const userChats = chats.filter(chat => 
          chat.participants.some(participant => 
            participant.toString() === user._id.toString()
          )
        );

        // Get the most recent message from all user's chats
        let lastMessage = null;
        userChats.forEach(chat => {
          const lastChatMessage = chat.messages[0]; // Since we're only fetching the last message
          if (lastChatMessage && (!lastMessage || new Date(lastChatMessage.createdAt) > new Date(lastMessage.createdAt))) {
            lastMessage = {
              content: lastChatMessage.content,
              createdAt: lastChatMessage.createdAt,
              sender: {
                _id: lastChatMessage.sender._id,
                firstName: lastChatMessage.sender.firstName,
                lastName: lastChatMessage.sender.lastName,
                email: lastChatMessage.sender.email
              }
            };
          }
        });

        // Return user with minimal necessary fields
        return {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          department: user.department,
          role: user.role,
          lastMessage
        };
      });

      return JSON.parse(JSON.stringify(usersWithLastMessage));
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const chatsModel = new ChatsModel();
export default chatsModel;