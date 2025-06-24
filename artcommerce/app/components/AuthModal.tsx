'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleLogin = () => {
    router.push('/login')
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-modalSlideIn">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <div className="pt-8 pb-6 px-6 text-center">
          <div className="w-24 h-24 mx-auto mb-4 relative">
            <Image
              src="/images/logo.png"
              alt="Kalakraft Logo"
              fill
              className="object-contain"
            />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">Authentication Required</h2>
          <p className="mt-2 text-gray-600">Please log in to add items to your wishlist</p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-8">
          <button
            onClick={handleLogin}
            className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-black/90 
                     transition-colors transform hover:scale-[1.02] active:scale-[0.98] duration-200"
          >
            Log In
          </button>
          <p className="mt-4 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <button
              onClick={() => router.push('/signup')}
              className="text-black font-medium hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  )
} 