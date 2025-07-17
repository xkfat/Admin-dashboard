import React, { useState } from 'react';
import { X, Send, CheckCircle, AlertCircle, User } from 'lucide-react';
import API from '../api';

// Success Dialog Component with dark theme
const SuccessDialog = ({ isOpen, onClose, title, message, type = 'success' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl transform transition-all border dark:border-gray-700">
        <div className="flex items-center justify-center mb-4">
          {type === 'success' ? (
            <div className="w-16 h-16 bg-findthem-light dark:bg-findthem-teal/20 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-findthem-darkGreen dark:text-findthem-light" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
            </div>
          )}
        </div>

        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>

          <button
            onClick={onClose}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              type === 'success'
                ? 'bg-findthem-darkGreen dark:bg-findthem-light hover:bg-findthem-teal dark:hover:bg-findthem-teal text-white dark:text-gray-900'
                : 'bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 text-white'
            }`}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

const OneCaseUpdateModal = ({ 
  isOpen, 
  onClose, 
  caseData,
  onUpdateAdded 
}) => {
  const [updateMessage, setUpdateMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Success Dialog State
  const [successDialog, setSuccessDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  const handleSendUpdate = async () => {
    if (!updateMessage.trim()) {
      setSuccessDialog({
        isOpen: true,
        title: 'Missing Information',
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

      await API.cases.addCaseUpdate(caseData.id, updateData);
      
      if (onUpdateAdded) {
        onUpdateAdded();
      }
      
      setSuccessDialog({
        isOpen: true,
        title: 'Update Added! ✅',
        message: `Case update has been added and notification sent to ${caseData.reporter || 'the reporter'}.`,
        type: 'success'
      });

      // Reset form and close after 2 seconds
      setTimeout(() => {
        setUpdateMessage('');
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
    onClose();
  };

  const closeSuccessDialog = () => {
    setSuccessDialog({ ...successDialog, isOpen: false });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border dark:border-gray-700">
          
          {/* Header */}
          <div className="p-6 border-b dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add Case Update</h3>
               
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            
            {/* Case Summary */}
            <div className="bg-findthem-light dark:bg-findthem-teal/20 border border-findthem-teal dark:border-findthem-light rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                {caseData?.photo ? (
                  <img
                    src={caseData.photo}
                    alt={caseData.full_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-sm"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-findthem-teal to-findthem-darkGreen rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                )}
                <div className="w-12 h-12 bg-gradient-to-br from-findthem-teal to-findthem-darkGreen rounded-full flex items-center justify-center" style={{display: 'none'}}>
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">{caseData?.full_name}</h4>
                  <p className="text-findthem-darkGreen dark:text-findthem-light text-sm font-medium">
                    Case #{caseData?.id} • Reporter: {caseData?.reporter || 'Anonymous'}
                  </p>
                </div>
              </div>
            </div>

            {/* Update Form */}
            <div className="space-y-6">
              
              {/* Update Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Update Message
                </label>
                <textarea
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows="5"
                  placeholder="Enter the update message that will be sent to the case reporter..."
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {updateMessage.length}/500 characters
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-between items-center border-t dark:border-gray-600">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors text-sm font-medium"
            >
              Cancel
            </button>

            <button
              onClick={handleSendUpdate}
              disabled={loading || !updateMessage.trim()}
              className="px-6 py-2 bg-findthem-darkGreen dark:bg-findthem-light text-white dark:text-gray-900 rounded-lg hover:bg-green-800 dark:hover:bg-findthem-teal disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-gray-900"></div>
                  <span>Adding Update...</span>
                </>
              ) : (
                <>
                  <span>Add Update</span>
                </>
              )}
            </button>
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

export default OneCaseUpdateModal;