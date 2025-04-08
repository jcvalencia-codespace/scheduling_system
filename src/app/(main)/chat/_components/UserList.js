'use client';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';

export default function UserList({ users, onSelect, onClose }) {
  const modalContent = (
    <>
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={onClose}
        style={{ zIndex: 100000 }}
      />
      <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 100001 }}>
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl w-full max-w-lg">
            <div className="absolute right-0 top-0 pr-4 pt-4">
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white mb-4">
                  Start New Chat
                </h3>
                <div className="mt-2 max-h-[60vh] overflow-y-auto">
                  {users.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => onSelect(user)}
                      className="w-full p-3 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <div className="flex-shrink-0">
                        {user.profileImage ? (
                          <img 
                            src={user.profileImage} 
                            alt={`${user.firstName} ${user.lastName}`}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                              {user.firstName[0]}{user.lastName[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <span>{user.role}</span>
                          {user.department && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{user.department}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const modalRoot = document.getElementById('modal-root');
  return modalRoot ? createPortal(modalContent, modalRoot) : null;
}
