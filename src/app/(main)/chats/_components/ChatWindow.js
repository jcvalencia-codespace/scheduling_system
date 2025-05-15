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
    activeConversation,
    loadPreviousMessages,
    hasMoreMessages
  } = useChat();
  const { user } = useAuthStore();
  const [newMessage, setNewMessage] = useState('');
  const [temporaryMessage, setTemporaryMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const typingTimeoutRef = useRef(null);
  const prevMessagesLengthRef = useRef(messages?.length || 0);
  const prevSelectedUserRef = useRef(selectedUser?._id);
  const [loadingStatus, setLoadingStatus] = useState({
    isLoading: false,
    isLoadingPrevious: false
  });

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const scrollToBottomInstant = () => {
    scrollToBottom('instant');
  };

  useEffect(() => {
    const currentLength = messages?.length || 0;
    if (
      currentLength > prevMessagesLengthRef.current &&
      selectedUser?._id === prevSelectedUserRef.current &&
      !loadingStatus.isLoadingPrevious
    ) {
      scrollToBottomInstant();
    }
    prevMessagesLengthRef.current = currentLength;
  }, [messages, selectedUser, loadingStatus.isLoadingPrevious]);

  useEffect(() => {
    scrollToBottomInstant();
  }, [selectedUser?._id]);

  const handleScroll = async (e) => {
    const container = e.target;
    const { scrollTop, scrollHeight, clientHeight } = container;

    if (!loadingStatus.isLoadingPrevious) {
      if (scrollTop < 100 && hasMoreMessages) {
        setLoadingStatus((prev) => ({ ...prev, isLoadingPrevious: true }));

        const oldScrollHeight = scrollHeight;
        const oldScrollTop = scrollTop;

        await loadPreviousMessages(activeConversation);

        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight;
          const scrollDiff = newScrollHeight - oldScrollHeight;
          container.scrollTop = oldScrollTop + scrollDiff;
        });

        setLoadingStatus((prev) => ({ ...prev, isLoadingPrevious: false }));
      }

      const isBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
      setIsScrolledToBottom(isBottom);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    const messageContent = newMessage.trim();
    const tempMessage = {
      _id: Date.now(),
      content: messageContent,
      sender: user,
      createdAt: new Date(),
      isTemporary: true
    };
    setTemporaryMessage(tempMessage);
    setNewMessage('');
    scrollToBottomInstant();

    const { error } = await sendMessage(messageContent);
    if (error) {
      setTemporaryMessage(null);
    } else {
      setTemporaryMessage(null);
    }
  };

  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      triggerTyping();
    }, 300);
  };

  const hasMessages = messages && messages.length > 0;

  const allMessages = temporaryMessage
    ? [...(messages || []), temporaryMessage]
    : messages;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {selectedUser && (
        <div className="p-4 border-b bg-[#35408E]">
          <h3 className="text-lg font-semibold text-white">
            {selectedUser.firstName} {selectedUser.lastName}
          </h3>
          <p className="text-sm text-gray-50">{selectedUser.email}</p>
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
      >
        {loadingStatus.isLoadingPrevious && (
          <div className="text-center py-2">
            <div className="flex items-center justify-center text-sm text-gray-500">
              <div className="animate-spin mr-2 h-4 w-4 text-blue-500">
                <svg
                  className="h-full w-full"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
              Loading previous messages...
            </div>
          </div>
        )}

        {hasMessages || temporaryMessage ? (
          allMessages
            .filter(
              (message) =>
                message.sender &&
                (message.sender._id === user?._id ||
                  message.sender._id === selectedUser._id)
            )
            .map((message) => (
              <div
                key={message._id}
                className={`flex ${
                  message.sender._id === user?._id
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] break-words rounded-lg px-4 py-2 ${
                    message.sender._id === user?._id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70 flex items-center gap-1">
                    Sent at {moment(message.createdAt).format('h:mm A')}
                    {message.sender._id === user?._id &&
                      (message.isTemporary ? (
                        <span className="text-xs italic">sending...</span>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ))}
                  </p>
                </div>
              </div>
            ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-sm mt-2">
              Start the conversation with {selectedUser.firstName}!
            </p>
          </div>
        )}
        {isTyping && selectedUser?._id !== user?._id && (
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