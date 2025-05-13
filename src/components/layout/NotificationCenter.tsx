
import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Mock notifications for demo
const mockNotifications = [
  {
    id: '1',
    title: 'Approval Required',
    message: 'Invoice #INV-2023-04-27 requires your approval',
    read: false,
    time: '2 minutes ago',
    type: 'approval'
  },
  {
    id: '2',
    title: 'Processing Completed',
    message: 'Batch processing of 5 documents completed successfully',
    read: true,
    time: '1 hour ago',
    type: 'success'
  },
  {
    id: '3',
    title: 'Error Detected',
    message: 'Failed to match PO for invoice #INV-2023-04-26',
    read: false,
    time: '3 hours ago',
    type: 'error'
  },
  {
    id: '4',
    title: 'New Email',
    message: 'New invoice received from vendor@example.com',
    read: true,
    time: '1 day ago',
    type: 'info'
  }
];

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [open, setOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-status-rejected text-white text-[10px] flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        
        <div className="max-h-[350px] overflow-auto">
          {notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={cn(
                    "p-4 cursor-pointer hover:bg-secondary transition-colors",
                    !notification.read && "bg-secondary/50"
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{notification.title}</h4>
                    <span className="text-xs text-muted-foreground">{notification.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                  {!notification.read && (
                    <div className="mt-2 flex justify-end">
                      <div className="h-2 w-2 rounded-full bg-status-processing"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No notifications
            </div>
          )}
        </div>
        
        <div className="p-4 border-t text-center">
          <Button variant="outline" size="sm" className="w-full">View all notifications</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
