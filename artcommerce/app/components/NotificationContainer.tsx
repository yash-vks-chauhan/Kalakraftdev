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
            relative
            animate-slideIn
            w-full
            sm:min-w-[320px]
            md:min-w-[350px]
            md:max-w-[400px]
          "
          style={{
            animation: 'slideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
          }}
        >
          {/* Glassmorphism notification card */}
          <div className="
            bg-white/10 
            backdrop-filter backdrop-blur-[8px] backdrop-saturate-[180%]
            -webkit-backdrop-filter -webkit-backdrop-blur-[8px] -webkit-backdrop-saturate-[180%]
            border border-white/25
            rounded-2xl
            shadow-[0_8px_32px_rgba(0,0,0,0.12),0_4px_16px_rgba(255,255,255,0.15),inset_0_0_60px_rgba(255,255,255,0.2)]
            p-3 sm:p-4
            before:absolute
            before:bottom-0
            before:left-0
            before:h-1
            before:bg-gradient-to-r
            before:from-black/60
            before:to-black/40
            before:rounded-b-2xl
            before:animate-progressBar
            relative
            overflow-hidden
          ">
            {/* Particle effects container for puff animation */}
            <div className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300" data-particles>
              {/* Sparkle particles */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    left: `${20 + Math.random() * 60}%`,
                    animationDelay: `${i * 0.1}s`
                  }}
                  data-particle={i}
                />
              ))}
            </div>
            {/* Content with optional product image */}
            <div className="flex items-center gap-3">
              {/* Product image for wishlist notifications */}
              {note.productData?.imageUrl && (
                <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-black/5 border border-white/20">
                  <img
                    src={note.productData.imageUrl}
                    alt={note.productData.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
              
              {/* Text content */}
              <div className="flex-1 pr-7 sm:pr-8">
                <div className="text-sm sm:text-[15px] md:text-[16px] font-semibold text-black/80 leading-tight">
                  {note.title}
                </div>
                {note.body && (
                  <div className="text-xs sm:text-[13px] md:text-[14px] text-black/70 mt-1 leading-relaxed">
                    {note.body}
                  </div>
                )}
                {/* Show product name if available */}
                {note.productData?.name && (
                  <div className="text-xs text-black/60 mt-1 font-medium truncate">
                    {note.productData.name}
                  </div>
                )}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => removeNotification(note.id)}
              className="
                absolute top-3 right-3
                text-black/70 hover:text-black/90
                transition-all duration-200 ease-out
                rounded-full p-1.5
                hover:bg-white/75
                backdrop-filter backdrop-blur-[80px] backdrop-saturate-[180%]
                -webkit-backdrop-filter -webkit-backdrop-blur-[80px] -webkit-backdrop-saturate-[180%]
              "
              aria-label="Close notification"
            >
              <X size={14} className="sm:w-4 sm:h-4" />
            </button>
          </div>
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
    transform: translateY(-30px) scale(0.9);
    filter: blur(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0px);
  }
}

@keyframes progressBar {
  from {
    width: 100%;
    opacity: 0.8;
  }
  to {
    width: 0%;
    opacity: 0.3;
  }
}

@keyframes poofOut {
  0% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
    filter: blur(0px);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05) rotate(-1deg);
    filter: blur(1px);
  }
  100% {
    opacity: 0;
    transform: scale(0.85) rotate(1deg);
    filter: blur(2px);
  }
}

.animate-slideIn {
  animation: slideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

.animate-progressBar {
  animation: progressBar 5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.animate-poofOut {
  animation: poofOut 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
*/