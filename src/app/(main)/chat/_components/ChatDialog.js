'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { initSocket, getSocket } from '@/lib/socket';
import useAuthStore from '@/store/useAuthStore';
import { sendMessage, getMessages } from '../_actions';
import MessageInput from './MessageInput';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function ChatDialog({ user, onClose }) {
  const { user: currentUser } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    if (currentUser?._id) {
      const socketInstance = initSocket(currentUser._id);
      setSocket(socketInstance);

      return () => {
        socketInstance?.disconnect();
      };
    }
  }, [currentUser?._id]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      console.log('Received new message:', newMessage);
      setMessages(prev => [...prev, {
        _id: newMessage._id || Date.now().toString(),
        text: newMessage.content || newMessage.text,
        sender: newMessage.sender || newMessage.senderId,
        timestamp: newMessage.timestamp || newMessage.createdAt || new Date().toISOString()
      }]);
    };

    socket.on('message', handleNewMessage);
    socket.on('typing', ({ senderId }) => {
      if (senderId === user._id) {
        setIsTyping(true);
        const timer = setTimeout(() => setIsTyping(false), 2000);
        return () => clearTimeout(timer);
      }
    });

    return () => {
      socket.off('message', handleNewMessage);
      socket.off('typing');
    };
  }, [socket, user._id]);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentUser?._id || !user?._id) return;
      
      try {
        const chatMessages = await getMessages(currentUser._id, user._id);
        setMessages(chatMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [user._id, currentUser?._id]);

  const handleSend = async (message) => {
    if (!message.trim() || !currentUser?._id || !user?._id) return;
    
    try {
      const messageData = {
        senderId: currentUser._id,
        receiverId: user._id,
        content: message,
        timestamp: new Date().toISOString()
      };

      // Send via socket first for immediate delivery
      if (socket) {
        socket.emit('message', messageData);
      }

      // Save to database
      const result = await sendMessage(messageData);
      if (!result) {
        console.error('Failed to save message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = useCallback(() => {
    if (socket) {
      socket.emit('typing', {
        senderId: currentUser._id,
        receiverId: user._id
      });
    }
  }, [socket, currentUser?._id, user._id]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-sm font-medium">
              {user.firstName[0]}{user.lastName[0]}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-sm text-gray-500">{user.role}</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message._id} // Changed from message.id to message._id
            message={{
              id: message._id,
              text: message.text || message.content, // Handle both text and content fields
              timestamp: message.timestamp || message.createdAt, // Handle both timestamp formats
              sender: message.sender
            }}
            isSender={message.sender === currentUser._id}
          />
        ))}
        {isTyping && <TypingIndicator />}
      </div>
      
      <MessageInput onSend={handleSend} onTyping={handleTyping} />
    </div>
  );
}

