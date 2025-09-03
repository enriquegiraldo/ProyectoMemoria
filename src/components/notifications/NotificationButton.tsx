import React, { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import Button  from '../ui/Button';
import { NotificationCenter } from './NotificationCenter';
import { Bell } from 'lucide-react';

export function NotificationButton() {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Button
        onClick={handleToggle}
        variant="ghost"
        size="sm"
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      <NotificationCenter 
        isOpen={isOpen} 
        onClose={handleClose} 
      />
    </>
  );
}

