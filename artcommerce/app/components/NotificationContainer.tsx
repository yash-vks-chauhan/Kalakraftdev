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
      {/* Background overlay to ensure blur effect visibility */}
      <div className="fixed inset-0 -z-10 opacity-30" style={{
        backgroundImage: `
          radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.1) 0%, transparent 50%),
          linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.6) 100%)
        `
      }} />
      
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
          {/* True iOS glassmorphism with enhanced blur effect */}
          <div className="
            notification-glassmorphism
            bg-gradient-to-br from-white/85 to-white/75
            backdrop-filter backdrop-blur-[25px] backdrop-saturate-[180%] backdrop-brightness-[1.1]
            -webkit-backdrop-filter -webkit-backdrop-blur-[25px] -webkit-backdrop-saturate-[180%] -webkit-backdrop-brightness-[1.1]
            border border-white/40
            rounded-3xl
            shadow-[0_8px_32px_rgba(0,0,0,0.2),0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.1)]
            p-4 sm:p-5
            before:absolute
            before:bottom-0
            before:left-0
            before:h-1
            before:bg-gradient-to-r
            before:from-blue-500/80
            before:to-blue-400/60
            before:rounded-b-3xl
            before:animate-progressBar
            relative
            overflow-hidden
            supports-[backdrop-filter]:bg-white/20
          "
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(25px) saturate(180%) brightness(1.1)',
            WebkitBackdropFilter: 'blur(25px) saturate(180%) brightness(1.1)'
          }}>
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
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl overflow-hidden bg-black/10 border border-white/30 shadow-sm">
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
                <div className="text-sm sm:text-[15px] md:text-[16px] font-semibold text-black/90 leading-tight">
                  {note.title}
                </div>
                {note.body && (
                  <div className="text-xs sm:text-[13px] md:text-[14px] text-black/80 mt-1 leading-relaxed">
                    {note.body}
                  </div>
                )}
                {/* Show product name if available */}
                {note.productData?.name && (
                  <div className="text-xs text-black/75 mt-1 font-medium truncate">
                    {note.productData.name}
                  </div>
                )}
              </div>
            </div>

            {/* True glassmorphism close button */}
            <button
              onClick={() => removeNotification(note.id)}
              className="
                absolute top-3 right-3
                text-black/90 hover:text-black
                transition-all duration-200 ease-out
                rounded-full p-1.5
                hover:bg-white/95
                bg-gradient-to-br from-white/90 to-white/80
                backdrop-filter backdrop-blur-[20px] backdrop-saturate-[180%]
                -webkit-backdrop-filter -webkit-backdrop-blur-[20px] -webkit-backdrop-saturate-[180%]
                w-7 h-7 flex items-center justify-center
                hover:scale-105
                shadow-[0_2px_12px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.6)]
                border border-white/50
                supports-[backdrop-filter]:bg-white/30
              "
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)'
              }}
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
@supports (backdrop-filter: blur(1px)) {
  .notification-glassmorphism {
    background: rgba(255, 255, 255, 0.2) !important;
  }
}

@supports not (backdrop-filter: blur(1px)) {
  .notification-glassmorphism {
    background: rgba(255, 255, 255, 0.8) !important;
  }
}

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