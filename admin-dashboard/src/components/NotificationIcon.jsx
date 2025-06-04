// src/components/NotificationIcon.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Eye, Users, FileText, Bot, X, Trash2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const NotificationIcon = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  // Show desktop notification for new notifications
  const showDesktopNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: body,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: 'admin-notification',
        requireInteraction: false,
        silent: false
      });

      setTimeout(() => {
        notification.close();
      }, 5000);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  };

  // Add CSS for notification badge animations
  useEffect(() => {
    if (!document.querySelector('#notification-badge-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-badge-styles';
      style.textContent = `
        @keyframes notification-bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-3px);
          }
          60% {
            transform: translateY(-1px);
          }
        }
        
        @keyframes notification-glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(239, 68, 68, 0.5);
          }
          50% {
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.8), 0 0 30px rgba(239, 68, 68, 0.4);
          }
        }
        
        .notification-badge {
          animation: notification-bounce 2s infinite, notification-glow 2s infinite;
        }
        
        .notification-pulse-ring {
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Enhanced fetch notifications with better real-time detection
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching current admin notifications...');
      
      // Use the correct API endpoint for current admin notifications
      const response = await API.notifications.fetchCurrentAdminNotifications();
      console.log('📨 Current admin notifications response:', response);
      
      const allNotifications = response.notifications || response || [];
      console.log('📬 All admin notifications:', allNotifications);
      
      // Sort by date (newest first)
      const sortedNotifications = allNotifications.sort((a, b) => 
        new Date(b.date_created) - new Date(a.date_created)
      );
      
      setNotifications(sortedNotifications);
      
      // Count unread notifications
      const unread = sortedNotifications.filter(notif => !notif.is_read).length;
      console.log('🔴 Current unread count:', unread);
      console.log('📊 Previous unread count:', previousUnreadCount);
      
      // FORCE UPDATE: Always update unread count for testing
      setUnreadCount(unread);
      
      // Check if we have new notifications (more reliable detection)
      const currentTime = Date.now();
      const recentNotifications = sortedNotifications.filter(notif => {
        const notifTime = new Date(notif.date_created).getTime();
        return (currentTime - notifTime) < 60000 && !notif.is_read; // Last minute
      });
      
      if (recentNotifications.length > 0 && previousUnreadCount !== null) {
        console.log('🔔 Recent notifications detected!', recentNotifications);
        
        // Show desktop notification for the latest
        showDesktopNotification(
          'FindThem Admin Alert',
          recentNotifications[0].message
        );
        
        // Add visual effect to bell icon
        const bellButton = document.querySelector('.notification-bell-button');
        if (bellButton) {
          bellButton.classList.add('animate-bounce');
          setTimeout(() => {
            bellButton.classList.remove('animate-bounce');
          }, 1000);
        }
      }
      
      setPreviousUnreadCount(unread);
      console.log('✅ Unread count set to:', unread);
      
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      // Fallback to regular notifications if admin endpoint fails
      try {
        console.log('🔄 Trying fallback method...');
        const fallbackResponse = await API.notifications.fetchAll();
        const fallbackNotifications = fallbackResponse.notifications || fallbackResponse || [];
        
        // Filter for admin-relevant notifications
        const adminNotifications = fallbackNotifications.filter(notif => 
          ['missing_person', 'report', 'system'].includes(notif.notification_type)
        ).sort((a, b) => new Date(b.date_created) - new Date(a.date_created));
        
        setNotifications(adminNotifications);
        const unread = adminNotifications.filter(notif => !notif.is_read).length;
        setUnreadCount(unread);
        
      } catch (fallbackError) {
        console.error('❌ Fallback method also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get unread count using dedicated endpoint
  const fetchUnreadCount = async () => {
    try {
      console.log('🔢 Fetching unread count...');
      const response = await API.notifications.getUnreadCount();
      console.log('📊 Unread count response:', response);
      
      if (response && typeof response.unread_count === 'number') {
        setUnreadCount(response.unread_count);
        console.log('✅ Set unread count to:', response.unread_count);
      }
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
      // If dedicated endpoint fails, count from notifications
      fetchNotifications();
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId, event) => {
    event?.stopPropagation(); // Prevent dropdown from closing
    try {
      console.log('✅ Marking notification as read:', notificationId);
      
      // Use the correct Django endpoint - GET request to view_notification
      await API.notifications.getById(notificationId);
      
      // Update local state immediately for better UX
      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      // Refresh notifications on error
      fetchNotifications();
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async (event) => {
    event?.stopPropagation();
    try {
      console.log('✅ Marking all notifications as read...');
      await API.notifications.markAllAsRead();
      
      // Update local state
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
      setUnreadCount(0);
      
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      fetchNotifications();
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId, event) => {
    event?.stopPropagation();
    try {
      console.log('🗑️ Deleting notification:', notificationId);
      await API.notifications.delete(notificationId);
      
      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      // Update unread count if deleted notification was unread
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      fetchNotifications();
    }
  };

  // Clear all notifications
  const clearAllNotifications = async (event) => {
    event?.stopPropagation();
    if (!window.confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
      return;
    }
    
    try {
      console.log('🗑️ Clearing all notifications...');
      await API.notifications.clearAll();
      
      // Update local state
      setNotifications([]);
      setUnreadCount(0);
      
    } catch (error) {
      console.error('❌ Error clearing all notifications:', error);
      fetchNotifications();
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read if not already read using the correct Django endpoint
    if (!notification.is_read) {
      try {
        // Use getById which calls the view_notification endpoint that marks as read
        await API.notifications.getById(notification.id);
        
        // Update local state
        setNotifications(prev => prev.map(notif => 
          notif.id === notification.id ? { ...notif, is_read: true } : notif
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('❌ Error marking notification as read on click:', error);
      }
    }

    // Navigate based on notification type and content
    // Check for AI/match related notifications first (highest priority)
    if (notification.target_model === 'aimatch' || 
        notification.message.toLowerCase().includes('ai') || 
        notification.message.toLowerCase().includes('match') ||
        notification.message.toLowerCase().includes('potential') ||
        notification.message.toLowerCase().includes('found')) {
      navigate(`/aimatches`);
    } else if (notification.target_model === 'missingperson' && notification.target_id) {
      navigate(`/cases/${notification.target_id}`);
    } else if (notification.target_model === 'report' && notification.target_id) {
      navigate(`/reports`);
    }

    setIsOpen(false);
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'missing_person':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'report':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'system':
        return <Bot className="h-4 w-4 text-purple-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    const now = new Date();
    const notificationTime = new Date(dateString);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationTime.toLocaleDateString();
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    console.log('🚀 Initializing notification system...');
    
    // Initial fetch
    fetchNotifications();
    
    // Poll for new notifications every 10 seconds
    const interval = setInterval(() => {
      console.log('⏰ Polling for new notifications...');
      fetchUnreadCount(); // Use dedicated endpoint for polling
    }, 10000);
    
    return () => {
      console.log('🛑 Cleaning up notification polling');
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Icon */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className={`notification-bell-button relative p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all duration-200 ${
          unreadCount > 0 ? 'animate-pulse' : ''
        }`}
        title={unreadCount > 0 ? `${unreadCount} new notification${unreadCount !== 1 ? 's' : ''}` : 'Notifications'}
      >
        <Bell className={`h-6 w-6 text-white transition-all duration-200 ${
          unreadCount > 0 ? 'drop-shadow-lg' : ''
        }`} />
        
        {/* Red Notification Indicator */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1">
            {/* Pulsing ring effect */}
            <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-60 scale-150"></div>
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-40 scale-125" style={{animationDelay: '0.5s'}}></div>
            
            {/* Main notification badge */}
            <div className="relative bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center shadow-lg border-2 border-white px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="bg-findthem-bg text-white p-4 rounded-t-lg flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Admin Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-white hover:text-gray-200 transition-colors p-1"
                    title="Mark all as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-white hover:text-gray-200 transition-colors p-1"
                    title="Clear all notifications"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {unreadCount > 0 && (
              <p className="text-findthem-light text-sm mt-1">
                {unreadCount} new notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-findthem-button mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => ( // Show max 10 notifications
                <div
                  key={notification.id}
                  className={`group p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.notification_type)}
                    </div>
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(notification.date_created)}
                      </p>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex-shrink-0 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.is_read && (
                        <button
                          onClick={(e) => markAsRead(notification.id, e)}
                          className="text-blue-500 hover:text-blue-600 p-1"
                          title="Mark as read"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={(e) => deleteNotification(notification.id, e)}
                        className="text-red-500 hover:text-red-600 p-1"
                        title="Delete notification"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    
                    {/* Unread indicator */}
                    {!notification.is_read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer - Always visible */}
          <div className="p-3 bg-gray-50 border-t flex-shrink-0 rounded-b-lg">
            <button
              onClick={() => {
                navigate('/notifications');
                setIsOpen(false);
              }}
              className="w-full text-center text-findthem-button hover:text-findthem-darkGreen font-medium text-sm py-2 hover:bg-findthem-light rounded-lg transition-colors"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationIcon;