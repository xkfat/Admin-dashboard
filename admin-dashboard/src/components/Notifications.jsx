// src/components/AdminNotifications.jsx - Direct Delete Version
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Users, FileText, Bot, Eye, Trash2, CheckCircle, 
  AlertCircle, Clock, ChevronLeft, ChevronRight, X 
} from 'lucide-react';
import API from '../api';

// Custom Dialog Component (simplified - only for mark all read and clear all)
const CustomDialog = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info',
  onConfirm = null,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false
}) => {
  if (!isOpen) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-600',
          iconBg: 'bg-green-100',
          buttonColor: 'bg-green-600 hover:bg-green-700'
        };
      case 'error':
        return {
          icon: AlertCircle,
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          iconColor: 'text-yellow-600',
          iconBg: 'bg-yellow-100',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
        };
      default:
        return {
          icon: Bell,
          iconColor: 'text-findthem-button',
          iconBg: 'bg-findthem-light',
          buttonColor: 'bg-findthem-button hover:bg-findthem-bg'
        };
    }
  };

  const config = getTypeConfig();
  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        <div className="bg-findthem-bg rounded-t-2xl p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg`}>
            <IconComponent className={`h-8 w-8 ${config.iconColor}`} />
          </div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 text-center leading-relaxed mb-6">{message}</p>
          
          <div className="flex gap-3 justify-center">
            {showCancel && (
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-400 transition-colors"
              >
                {cancelText}
              </button>
            )}
            
            <button
              onClick={onConfirm || onClose}
              className={`px-6 py-3 ${config.buttonColor} text-white rounded-xl font-medium transition-colors shadow-lg`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [notificationsPerPage] = useState(10);

  // Dialog state (only for mark all read and clear all)
  const [customDialog, setCustomDialog] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    showCancel: false
  });

  // Calculate pagination
  const totalPages = Math.ceil(notifications.length / notificationsPerPage);
  const startIndex = (currentPage - 1) * notificationsPerPage;
  const endIndex = startIndex + notificationsPerPage;
  const currentNotifications = notifications.slice(startIndex, endIndex);

  // Show dialog helper
  const showDialog = (type, title, message, onConfirm = null, showCancel = false) => {
    setCustomDialog({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      showCancel
    });
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await API.notifications.fetchCurrentAdminNotifications();
      
      const allNotifications = response.notifications || response || [];
      
      // Sort by date (newest first)
      const sortedNotifications = allNotifications.sort((a, b) => 
        new Date(b.date_created) - new Date(a.date_created)
      );
      
      setNotifications(sortedNotifications);
      
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await API.notifications.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Show error message without dialog - just console log or toast
    }
  };

  // Delete notification directly (no dialog)
  const deleteNotification = async (notificationId) => {
    try {
      await API.notifications.delete(notificationId);
      
      // Update local state - remove the notification immediately
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Show error message without dialog - just console log or toast
      // You could add a toast notification here if you have a toast system
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      await markAsRead(notification.id);
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
  };

  // Get notification icon
  const getNotificationIcon = (type, message = '') => {
    if (message.includes('AI') || message.includes('match')) {
      return <Bot className="h-5 w-5 text-purple-600" />;
    }
    
    switch (type) {
      case 'missing_person':
        return <Users className="h-5 w-5 text-blue-600" />;
      case 'report':
        return <FileText className="h-5 w-5 text-green-600" />;
      case 'system':
        return <Bot className="h-5 w-5 text-purple-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Pagination helpers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        if (totalPages > 5) {
          pages.push('...');
          pages.push(totalPages);
        }
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        if (totalPages > 5) {
          pages.push('...');
        }
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Mark all as read (still uses dialog for confirmation)
  const markAllAsRead = async () => {
    showDialog(
      'warning',
      'Mark All as Read',
      'Are you sure you want to mark all notifications as read?',
      async () => {
        try {
          await API.notifications.markAllAsRead();
          
          // Update local state
          setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
          
          showDialog('success', 'All Marked as Read!', 'All notifications have been marked as read.');
        } catch (error) {
          console.error('Error marking all as read:', error);
          showDialog('error', 'Error', 'Failed to mark all notifications as read.');
        }
        setCustomDialog(prev => ({ ...prev, isOpen: false }));
      },
      true
    );
  };

  // Clear all notifications (still uses dialog for confirmation)
  const clearAll = async () => {
    showDialog(
      'warning',
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      async () => {
        try {
          await API.notifications.clearAll();
          
          // Update local state
          setNotifications([]);
          
          showDialog('success', 'All Cleared!', 'All notifications have been cleared.');
        } catch (error) {
          console.error('Error clearing all notifications:', error);
          showDialog('error', 'Error', 'Failed to clear all notifications.');
        }
        setCustomDialog(prev => ({ ...prev, isOpen: false }));
      },
      true
    );
  };

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading && notifications.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-findthem-button mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
          <button 
            onClick={fetchNotifications}
            className="ml-4 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Enhanced Notifications Header with Action Buttons */}
          <div className="p-6 border-b bg-gradient-to-br from-findthem-button via-findthem-button to-findthem-bg text-white">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">Notifications</h1>
                <div className="text-sm mt-1">
                  {notifications.filter(n => !n.is_read).length} unread 
                </div>
              </div>
              
              {/* Action Buttons in Notifications Header */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={markAllAsRead}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center border border-white/30"
                  disabled={notifications.length === 0 || notifications.every(n => n.is_read)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark All Read
                </button>
                <button
                  onClick={clearAll}
                  className="bg-red-500/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center border border-red-400/50"
                  disabled={notifications.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {currentNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No notifications found</p>
                <p className="text-sm mt-1">You're all caught up! New notifications will appear here.</p>
              </div>
            ) : (
              currentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.notification_type, notification.message)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {notification.message}
                          </p>
                          {!notification.is_read && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              New
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{formatDate(notification.date_created)}</span>
                          <span className="capitalize">{notification.notification_type.replace('_', ' ')}</span>
                          {notification.target_model && (
                            <span className="text-findthem-button">Click to view details</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                          title="Mark as read"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      
                      {/* Direct delete button - no dialog */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="text-red-600 hover:text-red-800 p-1 rounded transition-colors hover:bg-red-50"
                        title="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, notifications.length)} of {notifications.length} notifications
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>

                  <div className="flex items-center space-x-1">
                    {getPageNumbers().map((page, index) => (
                      <button
                        key={index}
                        onClick={() => typeof page === 'number' && handlePageChange(page)}
                        disabled={page === '...' || page === currentPage}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          page === currentPage
                            ? 'bg-findthem-button text-white'
                            : page === '...'
                            ? 'text-gray-400 cursor-default'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Custom Dialog (only for mark all read and clear all) */}
        <CustomDialog
          isOpen={customDialog.isOpen}
          onClose={() => setCustomDialog(prev => ({ ...prev, isOpen: false }))}
          type={customDialog.type}
          title={customDialog.title}
          message={customDialog.message}
          onConfirm={customDialog.onConfirm}
          showCancel={customDialog.showCancel}
        />
      </div>
    </div>
  );
};

export default AdminNotifications;