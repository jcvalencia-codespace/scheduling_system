'use server';

import usersModel from '@/app/models/Users';
import chatUsersModel from '@/app/models/ChatUsers';

export async function getAvailableUsers(currentUserId) {
  try {
    if (!currentUserId) {
      console.error('currentUserId is required');
      return [];
    }

    console.log('Fetching users for currentUserId:', currentUserId);
    const users = await usersModel.find();
    
    if (!users || users.length === 0) {
      console.log('No users found in database');
      return [];
    }

    const filteredUsers = users.filter(user => user._id !== currentUserId);
    
    // Map to ensure all data is serialized
    const serializedUsers = filteredUsers.map(user => ({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      department: user.department
    }));

    console.log('Filtered users count:', serializedUsers.length);
    return serializedUsers;
  } catch (error) {
    console.error('Error in getAvailableUsers:', error);
    return [];
  }
}

export async function getMessages(senderId, receiverId) {
  try {
    if (!senderId || !receiverId) {
      throw new Error('Both sender and receiver IDs are required');
    }
    const messages = await chatUsersModel.getChatMessages(senderId, receiverId);
    return messages.map(msg => ({
      _id: msg._id,
      text: msg.content,
      sender: msg.sender,
      timestamp: msg.createdAt
    }));
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
}

export async function sendMessage(messageData) {
  try {
    const result = await chatUsersModel.sendMessage(messageData);
    if (!result) throw new Error('Failed to send message');
    
    return {
      _id: result._id,
      text: result.content,
      sender: result.sender,
      timestamp: result.createdAt
    };
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
}

export async function getRecentChats(userId) {
  try {
    if (!userId) throw new Error('User ID is required');
    const chats = await chatUsersModel.getRecentChats(userId);
    
    // Enrich chat data with user details
    const enrichedChats = await Promise.all(
      chats.map(async (chat) => {
        try {
          const userDetails = await usersModel.findById(chat._id);
          if (!userDetails) return null;

          return {
            _id: chat._id,
            name: `${userDetails.firstName} ${userDetails.lastName}`,
            firstName: userDetails.firstName,
            lastName: userDetails.lastName,
            email: userDetails.email,
            role: userDetails.role,
            department: userDetails.department,
            lastMessage: chat.lastMessage
          };
        } catch (error) {
          console.error('Error enriching chat:', error);
          return null;
        }
      })
    );

    return enrichedChats.filter(Boolean);
  } catch (error) {
    console.error('Error fetching recent chats:', error);
    return [];
  }
}

export async function markMessageAsRead(messageId) {
  try {
    if (!messageId) throw new Error('Message ID is required');
    await chatUsersModel.markMessageAsRead(messageId);
    return true;
  } catch (error) {
    console.error('Error marking message as read:', error);
    return false;
  }
}
