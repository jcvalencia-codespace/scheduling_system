'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { pusherClient } from '@/utils/pusher';
import { getMessages, sendMessage, markMessageRead } from '../(main)/chats/_actions';
import useAuthStore from '@/store/useAuthStore';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!activeConversation) return;

    // Fetch existing messages
    const fetchMessages = async () => {
      const { messages: conversationMessages, error } = await getMessages(activeConversation);
      if (!error) {
        setMessages(conversationMessages);
      }
    };

    fetchMessages();

    // Subscribe to Pusher channel
    const channel = pusherClient.subscribe(`chat-${activeConversation}`);
    
    channel.bind('new-message', (newMessage) => {
      setMessages(prev => [newMessage, ...prev]);
    });

    channel.bind('typing', ({ userId }) => {
      if (userId !== user?._id) {
        setIsTyping(true);
        // Reset typing indicator after 2 seconds
        setTimeout(() => setIsTyping(false), 2000);
      }
    });

    return () => {
      pusherClient.unsubscribe(`chat-${activeConversation}`);
    };
  }, [activeConversation, user?._id]);

  const sendChatMessage = async (content) => {
    if (!user?._id || !activeConversation) return;

    const { message, error } = await sendMessage({
      content,
      senderId: user._id,
      conversationId: activeConversation
    });

    if (!error) {
      setMessages(prev => [message, ...prev]);
    }

    return { error };
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

  const triggerTyping = () => {
    if (!user?._id || !activeConversation) return;

    pusherClient.trigger(`chat-${activeConversation}`, 'typing', {
      userId: user._id
    });
  };

  return (
    <ChatContext.Provider value={{
      messages,
      activeConversation,
      setActiveConversation,
      isTyping,
      sendMessage: sendChatMessage,
      markAsRead,
      triggerTyping
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);