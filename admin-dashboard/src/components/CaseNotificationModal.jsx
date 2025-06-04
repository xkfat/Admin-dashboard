// src/components/CaseNotificationModal.jsx
import React, { useState } from 'react';
import { X, Send, CheckCircle, AlertCircle } from 'lucide-react';
import API from '../api';

// Success Dialog Component (reusing the existing one but with findthem styling)
const SuccessDialog = ({ isOpen, onClose, title, message, type = 'success' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all animate-in zoom-in duration-200">
        
        {/* Header with Icon */}
        <div className="bg-findthem-bg rounded-t-2xl p-6 text-center relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          {/* Icon */}
          <div className={`w-16 h-16 ${type === 'success' ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg`}>
            {type === 'success' ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <AlertCircle className="h-8 w-8 text-red-600" />
            )}
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-2">
            {title}
          </h3>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 text-center leading-relaxed mb-6">
            {message}
          </p>
          
          {/* Action Button */}
          <button
            onClick={onClose}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-colors shadow-lg ${
              type === 'success'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            Got it!
          </button>
        </div>
        
        {/* Decorative bottom border */}
        <div className="h-1 bg-gradient-to-r from-findthem-light via-findthem-button to-findthem-bg rounded-b-2xl"></div>
      </div>
    </div>
  );
};

const CaseNotificationModal = ({ isOpen, onClose, caseData, onSend }) => {
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState('case_update');
  const [pushTitle, setPushTitle] = useState('Case Update - FindThem');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Success Dialog State
  const [successDialog, setSuccessDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  // Pre-defined message templates
  const messageTemplates = [
    {
      value: 'status_update',
      label: 'Case Status Update',
      message: `Hi! We have an update regarding the missing person case for ${caseData?.full_name}. Please check the latest information in the app.`
    },
    {
      value: 'investigation',
      label: 'Investigation Progress',
      message: `We're actively investigating the case of ${caseData?.full_name}. Our team is following up on new leads and will keep you informed.`
    },
    {
      value: 'info_needed',
      label: 'Additional Information Needed',
      message: `We need some additional information to help with the search for ${caseData?.full_name}. Please contact us when convenient.`
    },
    {
      value: 'resolution',
      label: 'Case Resolution',
      message: `Great news! We have positive developments in the case of ${caseData?.full_name}. Please check the app for details.`
    }
  ];

  const handleTemplateChange = (templateValue) => {
    setSelectedTemplate(templateValue);
    if (templateValue) {
      const template = messageTemplates.find(t => t.value === templateValue);
      if (template) {
        setMessage(template.message);
      }
    } else {
      setMessage('');
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      setSuccessDialog({
        isOpen: true,
        title: 'Missing Information',
        message: 'Please enter a notification message before sending.',
        type: 'error'
      });
      return;
    }

    if (!caseData?.reporter) {
      setSuccessDialog({
        isOpen: true,
        title: 'No Reporter Found',
        message: 'This case has no associated reporter to send the notification to.',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    
    try {
      // Get the reporter's user ID - you might need to adjust this based on your API
      // If reporter is just a username, you might need to fetch user details first
      const payload = {
        message: message.trim(),
        notification_type: notificationType,
        push_title: pushTitle.trim(),
        receiver: 'specific', // Assuming we're sending to a specific user
        target_user: caseData.reporter // You might need to adjust this field name
      };

      const data = await API.notifications.sendCustom(payload);
      onSend?.(data);
      
      setSuccessDialog({
        isOpen: true,
        title: 'Notification Sent! 🎉',
        message: `Notification successfully sent to ${caseData.reporter} regarding ${caseData.full_name}'s case.`,
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
    setNotificationType('case_update');
    setPushTitle('Case Update - FindThem');
    setSelectedTemplate('');
    onClose();
  };

  const closeSuccessDialog = () => {
    setSuccessDialog({ ...successDialog, isOpen: false });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
          
          {/* Header */}
          <div className="bg-findthem-bg p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Send Case Notification</h3>
                <p className="text-findthem-light mt-1">
                  Notify the case reporter about updates
                </p>
              </div>
              <button 
                onClick={handleClose}
                className="text-white hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[calc(90vh-250px)] overflow-y-auto">
            
            {/* Quick Templates Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Templates (Optional)
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-findthem-button focus:border-findthem-button"
              >
                <option value="">Select a template or write your own message</option>
                {messageTemplates.map((template) => (
                  <option key={template.value} value={template.value}>
                    {template.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Message *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-findthem-button focus:border-findthem-button resize-none"
                rows="4"
                placeholder="Enter your message to the case reporter..."
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                {message.length}/500 characters
              </div>
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
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-findthem-button focus:border-findthem-button"
                placeholder="FindThem - Case Update"
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
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-findthem-button focus:border-findthem-button"
              >
                <option value="case_update">Case Update</option>
                <option value="missing_person">Missing Person Alert</option>
                <option value="system">System Notification</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-2xl">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Sending to: <span className="font-medium text-findthem-bg">
                  {caseData?.reporter || 'Case Reporter'}
                </span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={loading || !message.trim()}
                  className="px-6 py-2 bg-findthem-button text-white rounded-xl hover:bg-findthem-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center shadow-lg"
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

export default CaseNotificationModal;