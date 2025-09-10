'use client'

import { useNotificationContext } from '../contexts/NotificationContext'
import { X } from 'lucide-react'

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotificationContext()

  // Filter to only show user notifications since system ones might be handled elsewhere
  const userNotifications = notifications.filter(note => note.category === 'user')

  if (userNotifications.length === 0) return null

  return (
    <div className="fixed top-[60px] sm:top-[72px] left-1/2 -translate-x-1/2 z-[999999] flex flex-col gap-2 sm:gap-3 pointer-events-none px-3 sm:px-4 w-full max-w-xs sm:max-w-sm md:max-w-md">
      {userNotifications.map((note) => (
        <div
          key={note.id}
          data-notification-id={note.id}
          className="
            pointer-events-auto
            bg-white
            border border-gray-200
            rounded-lg
            shadow-lg
            w-full
            p-3
            sm:p-4
            relative
            animate-slideIn
            before:absolute
            before:bottom-0
            before:left-0
            before:h-1
            before:bg-gradient-to-r
            before:from-gray-900
            before:to-gray-600
            before:rounded-b-lg
            before:animate-progressBar
            
            /* Mobile responsive */
            sm:min-w-[320px]
            md:min-w-[350px]
            md:max-w-[400px]
          "
          style={{
            animation: 'slideIn 0.3s ease-out forwards'
          }}
        >
          {/* Content */}
          <div className="pr-7 sm:pr-8">
            <div className="text-sm sm:text-[15px] md:text-[16px] font-semibold text-gray-900 leading-tight">
              {note.title}
            </div>
            {note.body && (
              <div className="text-xs sm:text-[13px] md:text-[14px] text-gray-600 mt-1 leading-relaxed">
                {note.body}
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={() => removeNotification(note.id)}
            className="absolute top-2 sm:top-3 right-2 sm:right-3 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-full p-1 hover:bg-gray-100"
            aria-label="Close notification"
          >
            <X size={14} className="sm:w-4 sm:h-4" />
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