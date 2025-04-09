'use client';

import { useEffect, useState } from 'react';
import { useLoading } from '@/app/context/LoadingContext';
import { getUsers } from '../_actions';

export default function UserList({ onUserSelect }) {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { setIsLoading } = useLoading();

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await getUsers();
        if (response.error) {
          throw new Error(response.error);
        }
        setUsers(response.users || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [setIsLoading]);

  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => onUserSelect(user._id)}
            className="w-full p-4 flex items-center space-x-4 hover:bg-blue-50 rounded-xl transition-all duration-200 border border-transparent hover:border-blue-200"
          >
            <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-lg">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              <p className="text-xs text-blue-600 font-medium mt-1">{user.role}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}