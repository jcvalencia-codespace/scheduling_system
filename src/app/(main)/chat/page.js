'use client';
import { useEffect, useState } from 'react';
import { Chat } from 'reachat';
import useAuthStore from '@/store/useAuthStore';
import UserList from './_components/UserList';
import ChatDialog from './_components/ChatDialog';
import { getAvailableUsers, getRecentChats } from './_actions';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
    const { user } = useAuthStore();
    const [messages, setMessages] = useState([]);
    const [showUserList, setShowUserList] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showChatDialog, setShowChatDialog] = useState(false);
    const [recentChats, setRecentChats] = useState([]);
    const router = useRouter();

    useEffect(() => {
        if (user) {
            fetchAvailableUsers();
            fetchRecentChats();
        }
    }, [user]);

    const fetchAvailableUsers = async () => {
        if (!user?._id) return;
        try {
            const users = await getAvailableUsers(user._id);
            setAvailableUsers(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            setAvailableUsers([]);
        }
    };

    const fetchRecentChats = async () => {
        if (!user?._id) return;
        try {
            const chats = await getRecentChats(user._id);
            setRecentChats(chats || []);
        } catch (error) {
            console.error('Error fetching chats:', error);
            setRecentChats([]);
        }
    };

    const handleChatSelect = (selectedUser) => {
        router.push(`/chat/${selectedUser._id}`);
        setShowUserList(false);
    };

    if (!user) return null;

    return (
        <div className="flex h-[calc(100vh-64px)]">
            {/* Left Sidebar - User Suggestions & Chat List */}
            <div className="w-[350px] border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Suggested Users</h3>
                </div>
                
                {/* Suggested Users */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col gap-3">
                        {availableUsers.slice(0, 5).map((user) => (
                            <div 
                                key={user._id}
                                onClick={() => handleChatSelect(user)}
                                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                                <div className="flex-1">
                                    <h4 className="font-medium">{user.name}</h4>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Chats Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Recent Chats</h3>
                </div>

                {/* Recent Chats List */}
                <div className="flex-1 overflow-y-auto">
                    {recentChats.map((chat) => (
                        <div 
                            key={chat._id}
                            onClick={() => handleChatSelect(chat)}
                            className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 
                                ${selectedUser?._id === chat._id ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                        >
                            <div className="flex items-center">
                                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 mr-3" />
                                <div className="flex-1">
                                    <h3 className="font-medium">{chat.name}</h3>
                                    {chat.lastMessage && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                            {chat.lastMessage.message}
                                        </p>
                                    )}
                                </div>
                                {chat.lastMessage && (
                                    <span className="text-xs text-gray-500">
                                        {new Date(chat.lastMessage.createdAt).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Side - Chat Area */}
            <div className="flex-1 bg-gray-50 dark:bg-gray-900">
                {selectedUser ? (
                    <ChatDialog
                        user={selectedUser}
                        onClose={() => setShowChatDialog(false)}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-4">
                        <div className="text-center text-gray-500">
                            <h3 className="text-xl font-medium mb-2">Your Messages</h3>
                            <p>Select a chat to start messaging</p>
                        </div>
                        <button 
                            onClick={() => setShowUserList(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Start New Chat
                        </button>
                    </div>
                )}
            </div>

            {/* User List Modal */}
            {showUserList && (
                <UserList 
                    users={availableUsers}
                    onSelect={handleChatSelect}
                    onClose={() => setShowUserList(false)}
                />
            )}
        </div>
    );
}
