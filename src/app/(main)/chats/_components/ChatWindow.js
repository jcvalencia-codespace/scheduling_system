'use client';

import { useEffect, useRef, useState } from 'react';
import { useChat } from '@/app/context/ChatContext';
import moment from 'moment';
import useAuthStore from '@/store/useAuthStore';

export default function ChatWindow({ selectedUser }) {
  const {
    messages,
    isTyping,
    sendMessage,
    markAsRead,
    triggerTyping,
    activeConversation
  } = useChat();
  const { user } = useAuthStore();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isScrolledToBottom) {
      scrollToBottom();
    }
  }, [messages, isScrolledToBottom]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
    setIsScrolledToBottom(isBottom);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    const { error } = await sendMessage(newMessage.trim());
    if (!error) {
      setNewMessage('');
      setIsScrolledToBottom(true);
    }
  };

  // Debounced typing indicator to prevent too many server calls
  const handleTyping = () => {
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set a new timeout to trigger typing after a short delay
    typingTimeoutRef.current = setTimeout(() => {
      triggerTyping();
    }, 300);
  };

  // Add this helper function to check if there are messages
  const hasMessages = messages && messages.length > 0;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Chat Header remains the same */}
      {selectedUser && (
        <div className="p-4 border-b bg-blue-50">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedUser.firstName} {selectedUser.lastName}
          </h3>
          <p className="text-sm text-gray-600">{selectedUser.email}</p>
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
      >
        {hasMessages ? (
          // Updated message filtering logic
          messages
            .filter(message => 
              // No need to filter by receiver, messages are already scoped to the chat
              message.sender && (
                message.sender._id === user?._id || 
                message.sender._id === selectedUser._id
              )
            )
            .map((message) => (
              <div
                key={message._id}
                className={`flex ${message.sender._id === user?._id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] break-words rounded-lg px-4 py-2 ${
                    message.sender._id === user?._id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {moment(message.createdAt).format('HH:mm')}
                  </p>
                </div>
              </div>
            ))
        ) : (
          // Empty state when no messages exist
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm mt-2">Start the conversation with {selectedUser.firstName}!</p>
          </div>
        )}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}