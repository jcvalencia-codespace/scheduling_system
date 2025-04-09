'use server';

import { pusherServer } from '@/utils/pusher';
import chatsModel from '@/app/models/Chats';

export async function sendMessage({ content, senderId, conversationId }) {
  try {
    const messageData = {
      sender: senderId,
      content
    };

    const updatedChat = await chatsModel.addMessage(conversationId, messageData);

    // Trigger Pusher event for real-time updates
    if (updatedChat) {
      const newMessage = updatedChat.messages[updatedChat.messages.length - 1];
      await pusherServer.trigger(
        `chat-${conversationId}`,
        'new-message',
        newMessage
      );

      return { message: newMessage, error: null };
    }
    throw new Error('Failed to send message');
  } catch (error) {
    console.error('Error sending message:', error);
    return { message: null, error: error.message };
  }
}

export async function getMessages(conversationId, limit = 50) {
  try {
    const chat = await chatsModel.getChatById(conversationId);
    const messages = chat ? chat.messages.slice(-limit) : [];
    return { messages, error: null };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { messages: [], error: error.message };
  }
}

export async function markMessageRead(messageId, chatId, userId) {
  try {
    const updatedChat = await chatsModel.markMessageAsRead(chatId, messageId, userId);
    return { success: !!updatedChat, error: null };
  } catch (error) {
    console.error('Error marking message as read:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteChat(chatId) {
  try {
    const deletedChat = await chatsModel.deleteChat(chatId);
    return { success: !!deletedChat, error: null };
  } catch (error) {
    console.error('Error deleting message:', error);
    return { success: false, error: error.message };
  }
}

export async function getUsers() {
  try {
    const users = await chatsModel.getAllUsers();
    return { users, error: null };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { users: [], error: error.message };
  }
}