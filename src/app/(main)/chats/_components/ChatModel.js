'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@/app/context/ChatContext';
import { sendMessage, getMessages } from '../_actions';
import useAuthStore from '@/store/useAuthStore';
import { useLoading } from '@/app/context/LoadingContext';

export default function ChatModel({ selectedUser }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const { user } = useAuthStore();
  const { setIsLoading } = useLoading();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedUser) {
      const fetchMessages = async () => {
        setIsLoading(true);
        try {
          const response = await getMessages(selectedUser);
          if (response.error) {
            throw new Error(response.error);
          }
          setMessages(response.messages || []);
        } catch (error) {
          console.error('Error fetching messages:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchMessages();
    }
  }, [selectedUser, setIsLoading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const response = await sendMessage({
        content: message,
        senderId: user._id,
        conversationId: selectedUser._id,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Update messages state with the new message
      if (response.message) {
        setMessages(prevMessages => [...prevMessages, response.message]);
      }
      
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b bg-blue-50">
        <h3 className="text-lg font-semibold text-gray-900">
          {selectedUser?.firstName} {selectedUser?.lastName}
        </h3>
        <p className="text-sm text-gray-600">{selectedUser?.email}</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.sender._id === user._id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <span className="text-xs opacity-75 mt-1 block">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}