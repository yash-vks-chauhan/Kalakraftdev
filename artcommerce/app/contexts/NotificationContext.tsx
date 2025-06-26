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
}

export interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

export const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    // Add poof class
    const element = document.querySelector(`[data-notification-id="${id}"]`);
    if (element) {
      element.classList.add('animate-poofOut');
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 400); // Match animation duration
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