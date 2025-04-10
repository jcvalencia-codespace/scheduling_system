'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function UserList({ users, onUserSelect, activeUser, unreadCounts, currentUserId }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredUsers = users?.filter(user => 
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="overflow-y-auto flex-1">
        {filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <div
              key={user._id}
              onClick={() => onUserSelect(user)}
              className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors relative ${
                activeUser === user._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center flex-grow">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </div>
                  </div>
                  <div className="ml-3 min-w-0 flex-grow">
                    <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                    <p className={`text-sm truncate ${unreadCounts?.[user._id] > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                      {user.lastMessage ? (
                        <>
                          {user.lastMessage.senderId === currentUserId ? 'You: ' : ''}
                          {user.lastMessage.content}
                        </>
                      ) : 'No messages yet'}
                    </p>
                  </div>
                </div>
                {unreadCounts?.[user._id] > 0 && (
                  <div className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.25rem] text-center">
                    {unreadCounts[user._id]}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">No users found</div>
        )}
      </div>
    </div>
  );
}