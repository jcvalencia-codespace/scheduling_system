'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@/app/context/ChatContext';
import ChatWindow from './_components/ChatWindow';
import UserList from './_components/UserList';
import useAuthStore from '@/store/useAuthStore';
import { getUsers } from './_actions';
import { useLoading } from '@/app/context/LoadingContext';
import { pusherClient } from '@/utils/pusher';
import { UserListSkeleton, ChatWindowSkeleton } from './_components/Skeleton';

export default function ChatsPage() {
  const { user } = useAuthStore();
  const { setActiveConversation, messages, lastMessages, isLoadingMessages, setIsLoadingUsers } = useChat();
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const { setIsLoading } = useLoading();

  // Fetch users only when user changes
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const { users: fetchedUsers, error } = await getUsers();
        if (!error && fetchedUsers) {
          // Filter out current user and map with lastMessages
          const filteredUsers = fetchedUsers.filter(
            u => u._id !== user?._id
          ).map(u => ({
            ...u,
            lastMessage: lastMessages[u._id] || u.lastMessage
          }));
          setUsers(filteredUsers);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchUsers();
    }
  }, [user, setIsLoading]);

  // Update users and unread counts when new messages arrive
  useEffect(() => {
    if (!user?._id) return;

    const channel = pusherClient.subscribe(`user-${user._id}`);
    
    channel.bind('new-message', ({ message, chatId }) => {
      // Update unread counts only for received messages
      if (message.sender._id !== user._id) {
        setUnreadCounts(prev => ({
          ...prev,
          [message.sender._id]: (prev[message.sender._id] || 0) + 1
        }));
      }

      // Update users list with new last message for both sender and receiver
      setUsers(prev => prev.map(u => {
        // For sender: update recipient's last message
        // For receiver: update sender's last message
        if ((message.sender._id === user._id && u._id === chatId) ||
            (message.sender._id !== user._id && u._id === message.sender._id)) {
          return {
            ...u,
            lastMessage: message
          };
        }
        return u;
      }));
    });

    return () => {
      pusherClient.unsubscribe(`user-${user._id}`);
    };
  }, [user]);

  const handleUserSelect = (selectedUser) => {
    setSelectedUser(selectedUser);
    setActiveConversation(selectedUser._id);
    // Clear unread count for selected user
    setUnreadCounts(prev => ({
      ...prev,
      [selectedUser._id]: 0
    }));
  };

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-4rem)]">
      <div className="flex h-full gap-4">
        <div className="w-1/3 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {users.length === 0 ? (
            <UserListSkeleton />
          ) : (
            <UserList 
              users={users} 
              onUserSelect={handleUserSelect} 
              activeUser={selectedUser?._id}
              unreadCounts={unreadCounts}
            />
          )}
        </div>

        {/* Chat Window */}
        <div className="flex-1">
          {selectedUser ? (
            isLoadingMessages ? (
              <ChatWindowSkeleton />
            ) : (
              <ChatWindow selectedUser={selectedUser} />
            )
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