'use client'

import { useNotificationContext } from '../contexts/NotificationContext'
import { X } from 'lucide-react'

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotificationContext()

  // Filter to only show user notifications since system ones might be handled elsewhere
  const userNotifications = notifications.filter(note => note.category === 'user')

  if (userNotifications.length === 0) return null

  return (
    <div className="fixed top-[72px] left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none">
      {userNotifications.map((note) => (
        <div
          key={note.id}
          className="
            pointer-events-auto
            bg-white
            border border-gray-200
            rounded-lg
            shadow-lg
            min-w-[350px]
            max-w-[400px]
            p-4
            relative
            animate-slideIn
            before:absolute
            before:bottom-0
            before:left-0
            before:h-1
            before:bg-gradient-to-r
            before:from-blue-500
            before:to-purple-600
            before:rounded-b-lg
            before:animate-progressBar
          "
          style={{
            animation: 'slideIn 0.3s ease-out forwards'
          }}
        >
          {/* Content */}
          <div className="pr-8">
            <div className="text-[16px] font-semibold text-gray-900 leading-tight">
              {note.title}
            </div>
            {note.body && (
              <div className="text-[14px] text-gray-600 mt-1 leading-relaxed">
                {note.body}
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={() => removeNotification(note.id)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-full p-1 hover:bg-gray-100"
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}

/* Add to your global CSS */
/*
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes progressBar {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

@keyframes poofOut {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
  100% {
    opacity: 0;
    transform: scale(0.9);
  }
}

.animate-slideIn {
  animation: slideIn 0.3s ease-out forwards;
}

.animate-progressBar {
  animation: progressBar 5s linear forwards;
}

.animate-poofOut {
  animation: poofOut 0.4s ease-in forwards;
}
*/