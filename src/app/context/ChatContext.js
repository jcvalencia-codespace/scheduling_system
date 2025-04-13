'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { pusherClient } from '@/utils/pusher';
import { getMessages, sendMessage, markMessageRead, triggerTypingIndicator } from '../(main)/chats/_actions';
import useAuthStore from '@/store/useAuthStore';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [lastMessages, setLastMessages] = useState({});
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const { user } = useAuthStore();

  // Single useEffect for user-specific channel
  useEffect(() => {
    if (!user?._id) return;

    // Subscribe to user's personal channel for all their chats
    const channel = pusherClient.subscribe(`user-${user._id}`);
    
    channel.bind('new-message', ({ message, chatId }) => {
      // Update messages if it's the active conversation
      setMessages(prev => {
        // Check if message already exists to prevent duplicates
        const messageExists = prev.some(m => m._id === message._id);
        if (messageExists) return prev;
        
        // Sort messages by date
        const newMessages = [...prev, message].sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        return newMessages;
      });

      // Update last message for the chat
      setLastMessages(prev => ({
        ...prev,
        [chatId]: message
      }));
    });
  
    return () => {
      pusherClient.unsubscribe(`user-${user._id}`);
    };
  }, [user?._id]);

  // Single useEffect for fetching messages and chat-specific channel
  useEffect(() => {
    if (!activeConversation) return;

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const { messages: conversationMessages, error } = await getMessages(activeConversation);
        if (!error && conversationMessages) {
          // Sort messages by date
          const sortedMessages = conversationMessages.sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          );
          setMessages(sortedMessages);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();

    // Subscribe to chat-specific channel
    const chatChannel = pusherClient.subscribe(`chat-${activeChatId}`);
    chatChannel.bind('new-message', ({ message }) => {
      setMessages(prev => {
        const messageExists = prev.some(m => m._id === message._id);
        if (messageExists) return prev;
        return [...prev, message];
      });
    });

    return () => {
      if (activeChatId) {
        pusherClient.unsubscribe(`chat-${activeChatId}`);
      }
    };
  }, [activeConversation, activeChatId]);

  const sendChatMessage = async (content) => {
    if (!user?._id || !activeConversation) return;
    
    try {
      const result = await sendMessage({
        content,
        senderId: user._id,
        conversationId: activeConversation
      });
      
      if (result.chatId) {
        setActiveChatId(result.chatId);
      }
      
      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      return { error: error.message };
    }
  };

  const markAsRead = async (messageId) => {
    const { error } = await markMessageRead(messageId);
    if (!error) {
      setMessages(prev =>
        prev.map(m =>
          m._id === messageId ? { ...m, isRead: true } : m
        )
      );
    }
  };



  const triggerTyping = async () => {
    if (!user?._id || !activeConversation) return;
    
    try {
      await triggerTypingIndicator({
        userId: user._id,
        conversationId: activeChatId || activeConversation
      });
    } catch (error) {
      console.error('Error triggering typing indicator:', error);
    }
  };

  return (
    <ChatContext.Provider value={{
      messages,
      activeConversation,
      setActiveConversation,
      isTyping,
      sendMessage: sendChatMessage,
      markAsRead,
      triggerTyping,
      lastMessages,
      isLoadingMessages,
      isLoadingUsers,
      setIsLoadingUsers
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);