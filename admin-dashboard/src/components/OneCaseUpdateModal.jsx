import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle, AlertCircle, MessageSquare, FileText } from 'lucide-react';
import API from '../api';

const OneCaseUpdateModal = ({ 
  isOpen, 
  onClose, 
  caseData,
  onUpdateAdded 
}) => {
  const [updateMessage, setUpdateMessage] = useState('');
  const [messageType, setMessageType] = useState('manual');
  const [autoUpdateType, setAutoUpdateType] = useState('active');
  const [submissionStatus, setSubmissionStatus] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Success Dialog State
  const [successDialog, setSuccessDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  // Auto update messages mapping
  const autoUpdateMessages = {
    active: "We have started investigating your case and are actively working on it.",
    in_progress: "We're currently reviewing and verifying the details of your case.",
    closed: "Your case has been closed. Thank you for using our service.",
    rejected: "Your case submission has been rejected after review.",
    investigating: "Your case is now under active investigation by our team.",
    found: "Great news! The missing person in your case has been found."
  };

  // Update message when auto type changes
  useEffect(() => {
    if (messageType === 'auto') {
      setUpdateMessage(autoUpdateMessages[autoUpdateType] || '');
    } else if (messageType === 'manual') {
      setUpdateMessage('');
    }
  }, [messageType, autoUpdateType]);

  const handleSendUpdate = async () => {
    if (!updateMessage.trim()) {
      setSuccessDialog({
        isOpen: true,
        title: 'Missing Message',
        message: 'Please enter an update message.',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    
    try {
      const updateData = {
        message: updateMessage.trim(),
        ...(submissionStatus && { submission_status: submissionStatus })
      };

      await API.cases.addCaseUpdate(caseData.id, updateData);
      
      if (onUpdateAdded) {
        onUpdateAdded();
      }
      
      setSuccessDialog({
        isOpen: true,
        title: 'Update Added! ✅',
        message: 'The case update has been successfully added.',
        type: 'success'
      });

      // Reset form and close after 2 seconds
      setTimeout(() => {
        setUpdateMessage('');
        setMessageType('manual');
        setAutoUpdateType('active');
        setSubmissionStatus('');
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error adding case update:', error);
      setSuccessDialog({
        isOpen: true,
        title: 'Update Failed',
        message: 'Failed to add case update. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUpdateMessage('');
    setMessageType('manual');
    setAutoUpdateType('active');
    setSubmissionStatus('');
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
          <div className="bg-findthem-teal text-white p-4">

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold">Add Case Update</h3>
              </div>
              <button 
                onClick={handleClose}
                className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white hover:bg-opacity-10 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-4 overflow-y-auto" style={{ height: 'calc(90vh - 140px)' }}>
            {/* Case Summary */}
            <div className="bg-findthem-light border border-findthem-darkGreen rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3">
                {caseData.photo ? (
                  <img
                    src={caseData.photo}
                    alt={caseData.full_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 bg-findthem-light rounded-full flex items-center justify-center shadow-sm">
                    <User className="h-6 w-6 text-white" />
                  </div>
                )}
                <div>
                  <h4 className="text-lg font-bold text-gray-900">{caseData.full_name}</h4>
                  <p className="text-findthem-darkGreen text-sm font-medium">
                    Case #{caseData.id} • {caseData.status.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Update Form */}
            <div className="space-y-4">
              {/* Message Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Choose Update Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                    messageType === 'manual' ? 'border-findthem-light bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      value="manual"
                      checked={messageType === 'manual'}
                      onChange={(e) => setMessageType(e.target.value)}
                      className="sr-only"
                    />
                    <MessageSquare className="h-5 w-5 mr-2 text-findthem-darkGreen" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Manual Message</span>
                      <p className="text-xs text-gray-600">Write your own update</p>
                    </div>
                  </label>
                  
                  <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                    messageType === 'auto' ? 'border-findthem-light bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      value="auto"
                      checked={messageType === 'auto'}
                      onChange={(e) => setMessageType(e.target.value)}
                      className="sr-only"
                    />
                    <FileText className="h-5 w-5 mr-2 text-findthem-darkGreen" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Auto Message</span>
                      <p className="text-xs text-gray-600">Use pre-written messages</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Template Selection */}
              {messageType === 'auto' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Select message type
                  </label>
                  <select
                    value={autoUpdateType}
                    onChange={(e) => setAutoUpdateType(e.target.value)}
                    className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-findthem-teal focus:border-findthem-button"
                  >
                    <option value="active">Case Active - Investigation Started</option>
                    <option value="in_progress">In Progress - Under Review</option>
                    <option value="investigating">Under Investigation</option>
                    <option value="found">Person Found - Good News!</option>
                    <option value="closed">Case Closed</option>
                    <option value="rejected">Case Rejected</option>
                  </select>
                </div>
              )}

              {/* Submission Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Update Case Status (Optional)
                </label>
                <select
                  value={submissionStatus}
                  onChange={(e) => setSubmissionStatus(e.target.value)}
                  className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Keep Current Status</option>
                  <option value="active">Set to Active</option>
                  <option value="in_progress">Set to In Progress</option>
                  <option value="closed">Set to Closed</option>
                  <option value="rejected">Set to Rejected</option>
                </select>
              </div>

              {/* Message Textarea */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Update Message
                </label>
                <textarea
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  className="w-full h-32 p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Enter your update message here..."
                  disabled={messageType === 'auto'}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    {updateMessage.length}/500 characters
                  </p>
                  {messageType === 'auto' && (
                    <p className="text-xs text-findthem-teal font-medium">Using auto message</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 flex justify-end gap-3 border-t">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSendUpdate}
              disabled={loading || !updateMessage.trim()}
              className="px-6 py-2 bg-findthem-teal text-white rounded-lg hover:bg-findthem-darkGreen disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Add Update</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Dialog */}
      {successDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl transform transition-all">
            <div className="flex items-center justify-center mb-4">
              {successDialog.type === 'success' ? (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              )}
            </div>
            
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{successDialog.title}</h3>
              <p className="text-gray-600 mb-6">{successDialog.message}</p>
              
              <button
                onClick={closeSuccessDialog}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  successDialog.type === 'success'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OneCaseUpdateModal;