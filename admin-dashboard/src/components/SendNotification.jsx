import React, { useState, useEffect } from 'react';
import { X, Send, Search, Users, User, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import API from '../api'; // Make sure this path is correct

// Success Dialog Component
const SuccessDialog = ({ isOpen, onClose, title, message, type = 'success' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl transform transition-all">
        <div className="flex items-center justify-center mb-4">
          {type === 'success' ? (
            <div className="w-16 h-16 bg-findthem-light rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-findthem-darkGreen" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          )}
        </div>
        
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          
          <button
            onClick={onClose}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              type === 'success'
                ? 'bg-findthem-darkGreen hover:bg-findthem-teal text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

const NotificationModal = ({ isOpen, onClose, onSend }) => {
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState('system');
  const [pushTitle, setPushTitle] = useState('FindThem');
  const [recipients, setRecipients] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Success Dialog State
  const [successDialog, setSuccessDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  // Fetch users when modal opens and recipients is set to specific
  useEffect(() => {
    if (isOpen && recipients === 'specific') {
      fetchUsers();
    }
  }, [isOpen, recipients]);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setSearchLoading(true);
    try {
      const data = await API.users.fetchAll();
      
      // 🐛 DEBUG: Log the user data to see what we're getting
      console.log('Users data:', data);
      console.log('First user:', data[0]);
      console.log('Profile photo of first user:', data[0]?.profile_photo);
      
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setSuccessDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to fetch users. Please try again.',
        type: 'error'
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUserToggle = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers([...filteredUsers]);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      setSuccessDialog({
        isOpen: true,
        title: 'Missing Information',
        message: 'Please enter a notification message.',
        type: 'error'
      });
      return;
    }

    if (recipients === 'specific' && selectedUsers.length === 0) {
      setSuccessDialog({
        isOpen: true,
        title: 'No Recipients Selected',
        message: 'Please select at least one user to send the notification to.',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        message: message.trim(),
        notification_type: notificationType,
        push_title: pushTitle.trim() || 'FindThem',
        receiver: recipients === 'all' ? 'all' : selectedUsers.map(u => u.id)
      };

      const data = await API.notifications.sendCustom(payload);
      onSend?.(data);
      
      // Show beautiful success dialog
      let successMessage;
      if (recipients === 'all') {
        successMessage = `Notification sent successfully to all users! 🎉`;
      } else if (recipients === 'staff') {
        successMessage = `Notification sent successfully to all staff members! 👥`;
      } else {
        const count = selectedUsers.length;
        successMessage = `Notification sent successfully to ${count} user${count > 1 ? 's' : ''}! 📱`;
      }

      setSuccessDialog({
        isOpen: true,
        title: 'Notification Sent! ✅',
        message: successMessage,
        type: 'success'
      });

      // Close the main modal after showing success
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error) {
      console.error('Error sending notification:', error);
      setSuccessDialog({
        isOpen: true,
        title: 'Send Failed',
        message: 'Failed to send notification. Please check your connection and try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setNotificationType('system');
    setPushTitle('FindThem');
    setRecipients('all');
    setSelectedUsers([]);
    setSearchTerm('');
    onClose();
  };

  const closeSuccessDialog = () => {
    setSuccessDialog({ ...successDialog, isOpen: false });
  };

  const getRecipientCount = () => {
    if (recipients === 'all') return 'All Users';
    return `${selectedUsers.length} Selected`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <h3 className="text-xl font-semibold text-gray-900">Send Notification</h3>
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal resize-none"
                rows="4"
                placeholder="Enter notification message..."
                required
              />
            </div>

            {/* Push Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Push Notification Title
              </label>
              <input
                type="text"
                value={pushTitle}
                onChange={(e) => setPushTitle(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal"
                placeholder="FindThem"
              />
            </div>

            {/* Notification Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Type
              </label>
              <select
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal"
              >
                <option value="system">System Notification</option>
                <option value="missing_person">Missing Person</option>
                <option value="report">Report</option>
                <option value="location_request">Location Request</option>
                <option value="location_response">Location Response</option>
                <option value="case_update">Case Update</option>
                <option value="location_alert">Location Alert</option>
              </select>
            </div>

            {/* Recipients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send to
              </label>
              <select
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal"
              >
                <option value="all">All Users</option>
                <option value="specific">Specific Users</option>
              </select>
            </div>

            {/* User Selection - Only show when 'specific' is selected */}
            {recipients === 'specific' && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Select Users</h4>
                  <div className="text-sm text-gray-500">
                    {selectedUsers.length} of {filteredUsers.length} selected
                  </div>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal"
                    placeholder="Search users..."
                  />
                </div>

                {/* Select All Button */}
                <div className="flex justify-between items-center mb-3">
                  <button
                    onClick={handleSelectAll}
                    className="text-findthem-teal hover:text-findthem-darkGreen text-sm font-medium"
                  >
                    {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-sm text-gray-500">
                    {filteredUsers.length} users found
                  </span>
                </div>

                {/* Users List */}
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded">
                  {searchLoading ? (
                    <div className="p-4 text-center text-gray-500">
                      Loading users...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No users found
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center p-3 hover:bg-findthem-light border-b border-gray-100 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.find(u => u.id === user.id) !== undefined}
                          onChange={() => handleUserToggle(user)}
                          className="mr-3 h-4 w-4 text-findthem-teal focus:ring-findthem-teal border-gray-300 rounded"
                        />
                        <div className="flex items-center flex-1">
                          <div className="flex-shrink-0 mr-3">
                            {user.profile_photo ? (
                              <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                <img
                                  src={user.profile_photo}
                                  alt={user.username}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="h-full w-full bg-gray-300 rounded-full flex items-center justify-center" style={{display: 'none'}}>
                                  <User className="h-4 w-4 text-gray-500" />
                                </div>
                              </div>
                            ) : (
                              <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.first_name && user.last_name 
                                  ? `${user.first_name} ${user.last_name}` 
                                  : user.username}
                              </p>
                              {user.role === 'admin' && (
                                <Shield className="h-3 w-3 text-findthem-teal ml-1" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              @{user.username} • {user.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              Sending to: <span className="font-medium">{getRecipientCount()}</span>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={loading || !message.trim()}
                className="px-6 py-2 bg-findthem-darkGreen text-white rounded-lg hover:bg-findthem-teal disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Notification
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Dialog */}
      <SuccessDialog
        isOpen={successDialog.isOpen}
        onClose={closeSuccessDialog}
        title={successDialog.title}
        message={successDialog.message}
        type={successDialog.type}
      />
    </>
  );
};

export default NotificationModal;