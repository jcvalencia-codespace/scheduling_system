'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
import ChatDialog from '../_components/ChatDialog';
import { getAvailableUsers } from '../_actions';

export default function ChatRoom() {
  const { id } = useParams();
  const { user: currentUser } = useAuthStore();
  const [chatUser, setChatUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      if (!currentUser?._id || !id) return;
      
      try {
        const users = await getAvailableUsers(currentUser._id);
        const user = users.find(u => u._id === id);
        if (user) {
          setChatUser(user);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };

    loadUser();
  }, [id, currentUser?._id]);

  if (!chatUser) return null;

  return (
    <div className="h-[calc(100vh-64px)]">
      <ChatDialog
        user={chatUser}
        onClose={() => window.history.back()}
      />
    </div>
  );
}
