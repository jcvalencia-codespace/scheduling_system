'use server';

import { pusherServer } from '@/utils/pusher';
import chatsModel from '@/app/models/Chats';

export async function sendMessage({ content, senderId, conversationId }) {
  try {
    if (!senderId || !conversationId) {
      throw new Error('Invalid sender or conversation ID');
    }

    // Sort participants to ensure consistent lookup
    const participants = [senderId, conversationId].sort();
    
    // Find or create chat with exact participant match
    let chat = await chatsModel.findOrCreateChat(participants);
    if (!chat) {
      throw new Error('Failed to find or create chat');
    }

    const messageData = {
      sender: senderId,
      content,
      createdAt: new Date(),
      readBy: []
    };

    const updatedChat = await chatsModel.addMessage(chat._id, messageData);

    if (updatedChat) {
      const newMessage = updatedChat.messages[updatedChat.messages.length - 1];
      
      // Trigger to both participants
      await Promise.all([
        pusherServer.trigger(
          `user-${senderId}`,
          'new-message',
          { message: newMessage, chatId: chat._id }
        ),
        pusherServer.trigger(
          `user-${conversationId}`,
          'new-message',
          { message: newMessage, chatId: chat._id }
        )
      ]);

      return { message: newMessage, chatId: chat._id, error: null };
    }
    throw new Error('Failed to send message');
  } catch (error) {
    console.error('Error sending message:', error);
    return { message: null, error: error.message };
  }
}
// Add this new server action for typing indicators
export async function triggerTypingIndicator({ userId, conversationId }) {
  try {
    // Get the chat first to ensure we have the correct chat ID
    const chat = await chatsModel.findOrCreateChat([userId, conversationId]);
    
    await pusherServer.trigger(
      `chat-${chat._id}`,
      'typing',
      { userId }
    );
    return { success: true, error: null };
  } catch (error) {
    console.error('Error triggering typing indicator:', error);
    return { success: false, error: error.message };
  }
}

export async function getMessages(conversationId, page = 1, limit = 50) {
  try {
    const chat = await chatsModel.getChatById(conversationId);
    if (!chat || !chat.messages) return { messages: [], hasMore: false };

    // Calculate pagination
    const startIndex = Math.max(0, chat.messages.length - (page * limit));
    const endIndex = Math.min(chat.messages.length, startIndex + limit);
    const messages = chat.messages.slice(startIndex, endIndex);
    const hasMore = startIndex > 0;

    return { messages, hasMore };
  } catch (error) {
    console.error('Error fetching messages:', error);
    return { messages: [], hasMore: false, error: error.message };
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