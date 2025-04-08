'use client';
import { useState, useCallback } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

export default function MessageInput({ onSend, onTyping }) {
  const [message, setMessage] = useState('');
  
  const handleTyping = useCallback(() => {
    onTyping?.();
  }, [onTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message..."
          className="flex-1 min-w-0 rounded-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
}
