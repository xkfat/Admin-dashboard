import React, { useState, useEffect } from 'react';
import { X, Send, Search, User, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import API from '../api';

// Success Dialog Component
const SuccessDialog = ({ isOpen, onClose, title, message, type = 'success' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full p-6 shadow-2xl transform transition-all">
        <div className="flex items-center justify-center mb-4">
          {type === 'success' ? (
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          )}
        </div>
        
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
          
          <button
            onClick={onClose}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              type === 'success'
                ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white'
                : 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white'
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
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [casesLoading, setCasesLoading] = useState(false);
  
  // Success Dialog State
  const [successDialog, setSuccessDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  // Fetch cases when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCasesForUpdates();
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

const fetchCasesForUpdates = async () => {
  setCasesLoading(true);
  try {
    // Fetch all cases using the existing API
    const data = await API.cases.fetchAll(1, {});
    const allCases = data.results || [];
    
    // Filter cases to only include those with valid reporters (React-side filtering)
    const casesWithValidReporters = allCases.filter(caseItem => {
      // Must have a reporter
      if (!caseItem.reporter) {
        console.log(`❌ Excluding case ${caseItem.id}: No reporter`);
        return false;
      }
      
      // Exclude cases where reporter is empty string or just whitespace
      if (typeof caseItem.reporter === 'string' && caseItem.reporter.trim() === '') {
        console.log(`❌ Excluding case ${caseItem.id}: Empty reporter name`);
        return false;
      }
      
      if (caseItem.status === 'found') {
        console.log(`❌ Excluding case ${caseItem.id}: Case already found`);
        return false;
      }
      // Exclude anonymous reporters (case insensitive)
      const reporterLower = caseItem.reporter.toLowerCase();
      if (reporterLower.includes('anonymous') || reporterLower.includes('anon')) {
        console.log(`❌ Excluding case ${caseItem.id}: Anonymous reporter (${caseItem.reporter})`);
        return false;
      }
      
      // Exclude common admin usernames
      const adminKeywords = ['admin', 'administrator', 'staff', 'system'];
      if (adminKeywords.some(keyword => reporterLower.includes(keyword))) {
        console.log(`❌ Excluding case ${caseItem.id}: Admin reporter (${caseItem.reporter})`);
        return false;
      }
      
      // Exclude test users
      const testKeywords = ['test', 'demo', 'sample'];
      if (testKeywords.some(keyword => reporterLower.includes(keyword))) {
        console.log(`❌ Excluding case ${caseItem.id}: Test user (${caseItem.reporter})`);
        return false;
      }
      
      console.log(`✅ Including case ${caseItem.id}: Valid reporter (${caseItem.reporter})`);
      return true;
    });
    
    console.log(`📋 Total cases: ${allCases.length}, Cases with valid reporters: ${casesWithValidReporters.length}`);
    
    // If no valid cases found, show a helpful message
    if (casesWithValidReporters.length === 0 && allCases.length > 0) {
      setSuccessDialog({
        isOpen: true,
        title: 'No Valid Cases',
        message: 'No cases with user reporters found. Only cases reported by regular users can receive updates.',
        type: 'error'
      });
    }
    
    setCases(casesWithValidReporters);
    setFilteredCases(casesWithValidReporters);
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
        message: updateMessage.trim()
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
    setSearchTerm('');
    onClose();
  };

  const closeSuccessDialog = () => {
    setSuccessDialog({ ...successDialog, isOpen: false });
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'missing': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700';
      case 'found': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700';
      case 'under_investigation': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Send Case Update</h3>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6 bg-white dark:bg-gray-800">
            {!showUpdateForm ? (
              /* Case Selection View */
              <div>
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Select Case</h4>
                </div>
                
                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Search by case name, or reporter..."
                  />
                </div>

                {/* Cases List */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {casesLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-findthem-teal mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-300">Loading cases...</p>
                    </div>
                  ) : filteredCases.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <User className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-500" />
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">No cases found</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Try adjusting your search terms</p>
                    </div>
                  ) : (
                    filteredCases.map((caseItem) => (
                      <div
                        key={caseItem.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                          selectedCase?.id === caseItem.id 
                            ? 'border-findthem-teal bg-findthem-light dark:bg-findthem-teal/20 shadow-md' 
                            : 'border-gray-200 dark:border-gray-600 hover:border-findthem-teal bg-white dark:bg-gray-700'
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
                                className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-sm"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center shadow-sm">
                                <User className="h-6 w-6 text-white" />
                              </div>
                            )}
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center shadow-sm" style={{display: 'none'}}>
                              <User className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          
                          {/* Case Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{caseItem.full_name}</h5>
                            </div>
                            
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(caseItem.status)}`}>
                                {caseItem.status.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                Reporter: {caseItem.reporter}
                              </span>
                            </div>
                            
                            {caseItem.last_seen_location && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
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
                {/* Back Button */}
                <div className="mb-4">
                  <button
                    onClick={() => setShowUpdateForm(false)}
                    className="flex items-center gap-2 text-findthem-teal dark:text-findthem-light hover:text-findthem-darkGreen dark:hover:text-findthem-teal transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm font-medium">Back to case selection</span>
                  </button>
                </div>

                {/* Selected Case Summary */}
                <div className="bg-findthem-light dark:bg-findthem-teal/20 border border-findthem-teal dark:border-findthem-light rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    {selectedCase.photo ? (
                      <img
                        src={selectedCase.photo}
                        alt={selectedCase.full_name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-findthem-teal to-findthem-darkGreen rounded-full flex items-center justify-center shadow-sm">
                        <User className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">{selectedCase.full_name}</h4>
                      <p className="text-findthem-darkGreen dark:text-findthem-light text-sm font-medium">Reporter: {selectedCase.reporter}</p>
                    </div>
                  </div>
                </div>

                {/* Update Form */}
                <div>
                  {/* Message Textarea */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Update Message
                    </label>
                    <textarea
                      value={updateMessage}
                      onChange={(e) => setUpdateMessage(e.target.value)}
                      className="w-full h-32 p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter your update message here..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-between items-center border-t dark:border-gray-700">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            
            {!showUpdateForm ? (
              <button
                onClick={handleContinue}
                disabled={!selectedCase}
                className="px-6 py-2 bg-findthem-teal dark:bg-findthem-light text-white dark:text-gray-900 rounded-lg hover:bg-findthem-darkGreen dark:hover:bg-findthem-teal disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSendUpdate}
                disabled={loading || !updateMessage.trim()}
                className="px-6 py-2 bg-findthem-darkGreen dark:bg-green-700 text-white rounded-lg hover:bg-green-800 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send Update</span>
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