'use client'

import { useNotificationContext } from '../contexts/NotificationContext'
import { X } from 'lucide-react'
import GlassSurface from '../../components/GlassSurface'

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotificationContext()

  // Filter to only show user notifications since system ones might be handled elsewhere
  const userNotifications = notifications.filter(note => note.category === 'user')

  if (userNotifications.length === 0) return null

  return (
    <div className="fixed top-[60px] sm:top-[72px] left-1/2 -translate-x-1/2 z-[999999] flex flex-col gap-2 sm:gap-3 pointer-events-none px-3 sm:px-4 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
      {userNotifications.map((note) => (
        <div
          key={note.id}
          data-notification-id={note.id}
          className="
            pointer-events-auto
            relative
            animate-slideIn
            w-full
            min-w-[350px]
            sm:min-w-[400px]
            md:min-w-[450px]
            lg:min-w-[500px]
          "
          style={{
            animation: 'slideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
          }}
        >
          {/* Glass Surface notification card */}
          <GlassSurface
            width="100%"
            height="auto"
            borderRadius={50}
            blur={40}
            backgroundOpacity={0.05}
            saturation={1.3}
            borderWidth={0.1}
            brightness={60}
            opacity={0.95}
            displace={0.8}
            distortionScale={-220}
            redOffset={5}
            greenOffset={15}
            blueOffset={25}
            className="
              p-4 sm:p-5 md:p-6
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
              min-h-[80px]
            "
          >
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
            <div className="flex items-start gap-4">
              {/* Product image for wishlist notifications */}
              {note.productData?.imageUrl && (
                <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/5 border border-white/20">
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
              <div className="flex-1 pr-10 sm:pr-12">
                <div className="text-base sm:text-lg md:text-xl font-semibold text-black/90 leading-tight mb-2">
                  {note.title}
                </div>
                {note.body && (
                  <div className="text-sm sm:text-base md:text-lg text-black/75 leading-relaxed mb-2">
                    {note.body}
                  </div>
                )}
                {/* Show product name and price if available */}
                {note.productData?.name && (
                  <div className="space-y-1">
                    <div className="text-sm sm:text-base text-black/70 font-medium">
                      {note.productData.name}
                    </div>
                    {note.productData.price && (
                      <div className="text-sm sm:text-base text-black/60 font-semibold">
                        ₹{note.productData.price.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Close button */}
            <GlassSurface
              width={32}
              height={32}
              borderRadius={50}
              blur={40}
              backgroundOpacity={0.05}
              saturation={1.3}
              borderWidth={0.1}
              brightness={60}
              opacity={0.95}
              displace={0.8}
              distortionScale={-220}
              redOffset={5}
              greenOffset={15}
              blueOffset={25}
              className="absolute top-3 right-3"
            >
              <button
                onClick={() => removeNotification(note.id)}
                className="
                  w-full h-full
                  text-black/70 hover:text-black/90
                  transition-all duration-200 ease-out
                  rounded-full
                  flex items-center justify-center
                  hover:bg-white/20
                "
                aria-label="Close notification"
              >
                <X size={16} className="sm:w-4 sm:h-4" />
              </button>
            </GlassSurface>
          </GlassSurface>
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