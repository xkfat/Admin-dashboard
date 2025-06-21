import React, { useState } from 'react';
import { X, Send, CheckCircle, AlertCircle, User } from 'lucide-react';
import API from '../api';

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
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="p-6 border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Add Case Update</h3>
               
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            
            {/* Case Summary */}
            <div className="bg-findthem-light border border-findthem-teal rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                {caseData?.photo ? (
                  <img
                    src={caseData.photo}
                    alt={caseData.full_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
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
                  <h4 className="text-lg font-bold text-gray-900">{caseData?.full_name}</h4>
                  <p className="text-findthem-darkGreen text-sm font-medium">
                    Case #{caseData?.id} • Reporter: {caseData?.reporter || 'Anonymous'}
                  </p>
                </div>
              </div>
            </div>

            {/* Update Form */}
            <div className="space-y-6">
              
              {/* Update Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Update Message
                </label>
                <textarea
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal resize-none"
                  rows="5"
                  placeholder="Enter the update message that will be sent to the case reporter..."
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-2">
                  {updateMessage.length}/500 characters
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>

            <button
              onClick={handleSendUpdate}
              disabled={loading || !updateMessage.trim()}
              className="px-6 py-2 bg-findthem-darkGreen text-white rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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