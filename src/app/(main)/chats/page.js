'use client';

import { useState } from 'react';
import { useChat } from '@/app/context/ChatContext';
import ChatModel from './_components/ChatModel';
import UserList from './_components/UserList';
import useAuthStore from '@/store/useAuthStore';

export default function ChatsPage() {
  const { user } = useAuthStore();
  const { setActiveConversation } = useChat();
  const [selectedUser, setSelectedUser] = useState(null);

  const handleUserSelect = (userId) => {
    setSelectedUser(userId);
    setActiveConversation(userId);
  };

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-4rem)]">
      <div className="flex h-full gap-4">
        {/* Users List */}
        <div className="w-1/3 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <UserList onUserSelect={handleUserSelect} />
        </div>

        {/* Chat Window */}
        <div className="flex-1">
          {selectedUser ? (
            <ChatModel selectedUser={selectedUser} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg font-medium">Select a user to start chatting</p>
              <p className="text-gray-400 text-sm mt-2">Choose from the list of users on the left</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}