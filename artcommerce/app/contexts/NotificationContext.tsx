'use client'

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from 'react'

export interface Notification {
  id: string;
  title: string;
  body: string;
  category: 'user' | 'system';
  severity: 'info' | 'success' | 'warning' | 'error';
  productData?: {
    id: number;
    name: string;
    price?: number;
    imageUrl?: string;
  };
}

export interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string, isPuffEffect?: boolean) => void;
}

export const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);

    // Auto remove after 5 seconds with dramatic puff animation
    setTimeout(() => {
      removeNotification(id, true); // Pass true for auto-removal puff effect
    }, 5000);
  };

  const removeNotification = (id: string, isPuffEffect: boolean = false) => {
    // Add different animation classes based on removal type
    const element = document.querySelector(`[data-notification-id="${id}"]`);
    if (element) {
      if (isPuffEffect) {
        element.classList.add('animate-puffExplosion');
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }, 800); // Longer duration for dramatic puff effect
      } else {
        element.classList.add('animate-poofOut');
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }, 500); // Standard poof animation duration
      }
    } else {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error(
      'useNotificationContext must be used within a NotificationProvider'
    )
  }
  return ctx
}

// NotificationToast component moved to its own file: app/components/NotificationToast.tsx

// Removed global style injection as it will be handled by NotificationToast.tsx 