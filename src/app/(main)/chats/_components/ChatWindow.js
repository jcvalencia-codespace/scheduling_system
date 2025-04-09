'use client';

import { useEffect, useRef, useState } from 'react';
import { useChat } from '@/app/context/ChatContext';
import moment from 'moment';

export default function ChatWindow() {
  const {
    messages,
    isTyping,
    sendMessage,
    markAsRead,
    triggerTyping,
    activeConversation
  } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

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

  const handleTyping = () => {
    triggerTyping();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
      >
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex ${message.sender._id === activeConversation ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[70%] break-words rounded-lg px-4 py-2 ${message.sender._id === activeConversation
                ? 'bg-gray-100'
                : 'bg-blue-500 text-white'
                }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {moment(message.createdAt).format('HH:mm')}
              </p>
            </div>
          </div>
        ))}
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