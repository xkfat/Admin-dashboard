import React, { useState, useEffect } from 'react';
import { X, Send, Search, User, CheckCircle, AlertCircle, MessageSquare, FileText } from 'lucide-react';
import API from '../api';

// Success Dialog Component
const SuccessDialog = ({ isOpen, onClose, title, message, type = 'success' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl transform transition-all">
        <div className="flex items-center justify-center mb-4">
          {type === 'success' ? (
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
          <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          
          <button
            onClick={onClose}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              type === 'success'
                ? 'bg-green-600 hover:bg-green-700 text-white'
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

const AddCaseUpdateModal = ({ isOpen, onClose, onUpdateSent }) => {
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [updateMessage, setUpdateMessage] = useState('');
  const [messageType, setMessageType] = useState('manual');
  const [autoUpdateType, setAutoUpdateType] = useState('active');
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [casesLoading, setCasesLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState('');
  
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

  // Fetch cases when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCases();
    }
  }, [isOpen]);

  // Filter cases based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCases(cases);
    } else {
      const filtered = cases.filter(caseItem => 
        caseItem.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caseItem.id.toString().includes(searchTerm) ||
        caseItem.last_seen_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (caseItem.reporter && caseItem.reporter.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCases(filtered);
    }
  }, [searchTerm, cases]);

  // Update message when auto type changes
  useEffect(() => {
    if (messageType === 'auto') {
      setUpdateMessage(autoUpdateMessages[autoUpdateType] || '');
    } else if (messageType === 'manual') {
      setUpdateMessage('');
    }
  }, [messageType, autoUpdateType]);

  const fetchCases = async () => {
    setCasesLoading(true);
    try {
      const data = await API.cases.fetchAll(1, {});
      const casesWithReporters = data.results || [];
      setCases(casesWithReporters);
      setFilteredCases(casesWithReporters);
    } catch (error) {
      console.error('Error fetching cases for updates:', error);
      setSuccessDialog({
        isOpen: true,
        title: 'Error',
        message: 'Failed to fetch cases. Please try again.',
        type: 'error'
      });
    } finally {
      setCasesLoading(false);
    }
  };

  const handleCaseSelect = (caseItem) => {
    setSelectedCase(caseItem);
  };

  const handleContinue = () => {
    if (!selectedCase) {
      setSuccessDialog({
        isOpen: true,
        title: 'No Case Selected',
        message: 'Please select a case before continuing.',
        type: 'error'
      });
      return;
    }
    setShowUpdateForm(true);
  };

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

      await API.cases.addCaseUpdate(selectedCase.id, updateData);
      
      onUpdateSent?.({
        caseId: selectedCase.id,
        caseName: selectedCase.full_name,
        message: updateMessage.trim()
      });
      
      setSuccessDialog({
        isOpen: true,
        title: 'Update Sent! ✅',
        message: `Update sent to ${selectedCase.full_name}'s reporter!`,
        type: 'success'
      });

      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error) {
      console.error('Error sending case update:', error);
      setSuccessDialog({
        isOpen: true,
        title: 'Send Failed',
        message: 'Failed to send case update. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowUpdateForm(false);
    setSelectedCase(null);
    setUpdateMessage('');
    setMessageType('manual');
    setAutoUpdateType('active');
    setSubmissionStatus('');
    setSearchTerm('');
    onClose();
  };

  const closeSuccessDialog = () => {
    setSuccessDialog({ ...successDialog, isOpen: false });
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'missing': return 'bg-red-100 text-red-800 border-red-200';
      case 'found': return 'bg-green-100 text-green-800 border-green-200';
      case 'under_investigation': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
          {/* Simple Header */}
          <div className="bg-gradient-to-r from-findthem-teal to-findthem-darkGreen text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
             
                <h3 className="text-lg font-bold">Send Case Update</h3>
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
            {!showUpdateForm ? (
              /* Case Selection View */
              <div>
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">Select Case</h4>
                  <p className="text-xs text-gray-600">Choose the case you want to send an update for</p>
                </div>
                
                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal transition-colors"
                    placeholder="Search by case name, ID, or reporter..."
                  />
                </div>

                {/* Cases List */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {casesLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading cases...</p>
                    </div>
                  ) : filteredCases.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm font-medium text-gray-500 mb-1">No cases found</p>
                      <p className="text-xs text-gray-400">Try adjusting your search terms</p>
                    </div>
                  ) : (
                    filteredCases.map((caseItem) => (
                      <div
                        key={caseItem.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                          selectedCase?.id === caseItem.id 
                            ? 'border-findthem-teal bg-findthem-light shadow-md' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        onClick={() => handleCaseSelect(caseItem)}
                      >
                        <div className="flex items-center space-x-3">
                          {/* Case Photo */}
                          <div className="relative">
                            {caseItem.photo ? (
                              <img
                                src={caseItem.photo}
                                alt={caseItem.full_name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center shadow-sm">
                                <User className="h-6 w-6 text-white" />
                              </div>
                            )}
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center shadow-sm" style={{display: 'none'}}>
                              <User className="h-6 w-6 text-white" />
                            </div>
                            
                            {selectedCase?.id === caseItem.id && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-findthem-teal rounded-full flex items-center justify-center shadow-sm">
                                <CheckCircle className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          
                          {/* Case Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-semibold text-sm text-gray-900 truncate">{caseItem.full_name}</h5>
                              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                #{caseItem.id}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(caseItem.status)}`}>
                                {caseItem.status.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-600">
                                Reporter: {caseItem.reporter}
                              </span>
                            </div>
                            
                            {caseItem.last_seen_location && (
                              <p className="text-xs text-gray-600 truncate">
                                📍 {caseItem.last_seen_location}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Update Form View */
              <div>
                {/* Selected Case Summary */}
                <div className="bg-gradient-to-r from-findthem-light to-findthem-light border border-findthem-teal rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-3">
                    {selectedCase.photo ? (
                      <img
                        src={selectedCase.photo}
                        alt={selectedCase.full_name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-findthem-teal to-findthem-darkGreen rounded-full flex items-center justify-center shadow-sm">
                        <User className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{selectedCase.full_name}</h4>
                      <p className="text-findthem-darkGreen text-sm font-medium">Case #{selectedCase.id} • Reporter: {selectedCase.reporter}</p>
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
                        messageType === 'manual' ? 'border-findthem-teal bg-findthem-light' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          value="manual"
                          checked={messageType === 'manual'}
                          onChange={(e) => setMessageType(e.target.value)}
                          className="sr-only"
                        />
                        <MessageSquare className="h-5 w-5 mr-2 text-findthem-teal" />
                        <div>
                          <span className="text-sm font-medium text-gray-900">Custom Message</span>
                          <p className="text-xs text-gray-600">Write your own update</p>
                        </div>
                      </label>
                      
                      <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                        messageType === 'auto' ? 'border-findthem-teal bg-findthem-light' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          value="auto"
                          checked={messageType === 'auto'}
                          onChange={(e) => setMessageType(e.target.value)}
                          className="sr-only"
                        />
                        <FileText className="h-5 w-5 mr-2 text-findthem-teal" />
                        <div>
                          <span className="text-sm font-medium text-gray-900">Auto Messages</span>
                          <p className="text-xs text-gray-600">Use pre-written messages</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Template Selection */}
                  {messageType === 'auto' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Select Message
                      </label>
                      <select
                        value={autoUpdateType}
                        onChange={(e) => setAutoUpdateType(e.target.value)}
                        className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal"
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
                      className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal"
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
                      className="w-full h-32 p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal resize-none"
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
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-t">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            
            {!showUpdateForm ? (
              <button
                onClick={handleContinue}
                disabled={!selectedCase}
                className="px-6 py-2 bg-gradient-to-r from-findthem-teal to-findthem-darkGreen text-white rounded-lg hover:from-findthem-darkGreen hover:to-findthem-teal disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-lg"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSendUpdate}
                disabled={loading || !updateMessage.trim()}
                className="px-6 py-2 bg-gradient-to-r from-findthem-teal to-findthem-darkGreen text-white rounded-lg hover:from-findthem-darkGreen hover:to-findthem-teal disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center space-x-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Send Update</span>
                  </>
                )}
              </button>
            )}
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

export default AddCaseUpdateModal;