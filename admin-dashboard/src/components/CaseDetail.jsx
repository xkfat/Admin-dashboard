import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Save, X, Calendar, MapPin, Phone, User, AlertCircle, CheckCircle, Clock, Eye, Upload } from 'lucide-react';
import API from '../api';
import CaseDialog from './DialogCase';
import CaseNotificationModal from './CaseNotificationModal';

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({});
  const [newPhoto, setNewPhoto] = useState(null); // For handling new photo uploads
  const [photoPreview, setPhotoPreview] = useState(null); // For photo preview
  
  // Dialog state
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: null,
    showCancel: false
  });

  // Notification modal state
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Helper function to show dialog
  const showDialog = (type, title, message, onConfirm = null, showCancel = false) => {
    setDialog({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      showCancel
    });
  };

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  // Handle notification sent
  const handleNotificationSent = (response) => {
    console.log('Notification sent:', response);
    // Show success message via dialog if needed
    showDialog(
      'success',
      'Notification Sent! 📨',
      `Case notification has been sent to ${caseData.reporter || 'the reporter'} successfully.`
    );
  };
  // Fetch case data
  useEffect(() => {
    if (id) {
      fetchCaseData();
    }
  }, [id]);

  const fetchCaseData = async () => {
    try {
      setLoading(true);
      const data = await API.cases.getById(id);
      setCaseData(data);
      setEditData(data);
      setPhotoPreview(data.photo); // Set initial preview to existing photo
    } catch (err) {
      setError('Failed to load case details');
      console.error('Error fetching case:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({ ...caseData });
    setNewPhoto(null);
    setPhotoPreview(caseData.photo);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({ ...caseData });
    setNewPhoto(null);
    setPhotoPreview(caseData.photo);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Prepare update data - only include fields that have changed
      const updateData = {};
      
      // Compare each field and only include if changed
      if (editData.first_name !== caseData.first_name) {
        updateData.first_name = editData.first_name;
      }
      if (editData.last_name !== caseData.last_name) {
        updateData.last_name = editData.last_name;
      }
      if (editData.age !== caseData.age) {
        updateData.age = parseInt(editData.age);
      }
      if (editData.gender !== caseData.gender) {
        updateData.gender = editData.gender;
      }
      if (editData.status !== caseData.status) {
        updateData.status = editData.status;
      }
      if (editData.submission_status !== caseData.submission_status) {
        updateData.submission_status = editData.submission_status;
      }
      if (editData.last_seen_date !== caseData.last_seen_date) {
        updateData.last_seen_date = editData.last_seen_date;
      }
      if (editData.last_seen_location !== caseData.last_seen_location) {
        updateData.last_seen_location = editData.last_seen_location;
      }
      if (editData.contact_phone !== caseData.contact_phone) {
        updateData.contact_phone = editData.contact_phone;
      }
      if (editData.description !== caseData.description) {
        updateData.description = editData.description;
      }
      
      // Only include photo if a new file was uploaded
      if (newPhoto) {
        updateData.photo = newPhoto;
      }

      console.log('Sending update data:', updateData);

      const updatedCase = await API.cases.update(id, updateData);
      setCaseData(updatedCase);
      setIsEditing(false);
      setNewPhoto(null);
      setPhotoPreview(updatedCase.photo);
      
      // Show success dialog
      showDialog(
        'success',
        'Success! 🎉',
        'Case has been updated successfully!'
      );
    } catch (err) {
      console.error('Error updating case:', err);
      showDialog(
        'error',
        'Update Failed',
        'Failed to update case. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPhoto(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'missing':
        return 'bg-red-100 text-red-800';
      case 'found':
        return 'bg-green-100 text-green-800';
      case 'under_investigation':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubmissionStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading case details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500">Case not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/cases')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Cases</span>
          </button>
          
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit Case
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Photo and Basic Info Section */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Photo */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <img
                    src={photoPreview || '/default-avatar.png'}
                    alt={caseData.full_name}
                    className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-4 border-white shadow-lg"
                    onError={(e) => { e.target.src = '/default-avatar.png'; }}
                  />
                  {isEditing && (
                    <div className="absolute -bottom-2 -right-2">
                      <label className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg cursor-pointer transition-colors">
                        <Upload className="h-5 w-5" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                  {!isEditing && (
                    <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                </div>
                {isEditing && newPhoto && (
                  <p className="text-xs text-green-600 mt-2 text-center">
                    New photo selected
                  </p>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1 text-center md:text-left">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={editData.first_name || ''}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        className="text-2xl font-bold p-2 border rounded-lg"
                        placeholder="First Name"
                      />
                      <input
                        type="text"
                        value={editData.last_name || ''}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        className="text-2xl font-bold p-2 border rounded-lg"
                        placeholder="Last Name"
                      />
                    </div>
                  </div>
                ) : (
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {caseData.full_name}
                  </h1>
                )}

                {/* Tags */}
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
                  <span className="bg-white px-4 py-2 rounded-full text-sm font-medium text-gray-700 shadow">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editData.age || ''}
                        onChange={(e) => handleInputChange('age', e.target.value)}
                        className="w-16 p-1 border rounded text-center"
                        min="0"
                        max="150"
                      />
                    ) : (
                      `${caseData.current_age} years old`
                    )}
                  </span>

                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(editData.status || caseData.status)}`}>
                    {isEditing ? (
                      <select
                        value={editData.status || ''}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="bg-transparent border-none outline-none"
                      >
                        <option value="missing">Missing</option>
                        <option value="found">Found</option>
                        <option value="under_investigation">Investigating</option>
                      </select>
                    ) : (
                      caseData.status?.replace('_', ' ') || 'Unknown'
                    )}
                  </span>

                  <span className="bg-white px-4 py-2 rounded-full text-sm font-medium text-gray-700 shadow">
                    {isEditing ? (
                      <select
                        value={editData.gender || ''}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="bg-transparent border-none outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    ) : (
                      caseData.gender
                    )}
                  </span>
                </div>

                {/* Missing Alert */}
                {(editData.status || caseData.status) === 'missing' && (
                  <div className="bg-red-100 border border-red-300 rounded-lg p-3 inline-flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-red-800 font-medium">
                      Missing for {caseData.days_missing} days
                    </span>
                  </div>
                )}

                {/* Submission Status */}
                <div className="mt-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${getSubmissionStatusColor(editData.submission_status || caseData.submission_status)}`}>
                    {isEditing ? (
                      <select
                        value={editData.submission_status || ''}
                        onChange={(e) => handleInputChange('submission_status', e.target.value)}
                        className="bg-transparent border-none outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="in_progress">In Progress</option>
                        <option value="closed">Closed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    ) : (
                      `Submission: ${caseData.submission_status?.replace('_', ' ')}`
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Case Information */}
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Eye className="h-6 w-6" />
              Case Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Last seen date */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Last seen date</h3>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editData.last_seen_date || ''}
                        onChange={(e) => handleInputChange('last_seen_date', e.target.value)}
                        className="mt-1 p-2 border rounded-lg w-full"
                      />
                    ) : (
                      <p className="text-blue-600 font-medium">{formatDate(caseData.last_seen_date)}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Last seen location */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Last seen location</h3>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.last_seen_location || ''}
                        onChange={(e) => handleInputChange('last_seen_location', e.target.value)}
                        className="mt-1 p-2 border rounded-lg w-full"
                        placeholder="Enter location"
                      />
                    ) : (
                      <p className="text-green-600 font-medium">{caseData.last_seen_location}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Phone */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Phone className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Contact Phone</h3>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editData.contact_phone || ''}
                        onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                        className="mt-1 p-2 border rounded-lg w-full"
                        placeholder="Phone number"
                      />
                    ) : (
                      <p className="text-purple-600 font-medium">{caseData.contact_phone || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Reporter */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <User className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Reported by</h3>
                    <p className="text-orange-600 font-medium">{caseData.reporter || 'Anonymous'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
              {isEditing ? (
                <textarea
                  value={editData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full p-4 border rounded-lg h-32 resize-none"
                  placeholder="Enter description..."
                />
              ) : (
                <div className="bg-gray-50 rounded-xl p-6">
                  <p className="text-gray-700 leading-relaxed">
                    {caseData.description || 'No description provided.'}
                  </p>
                </div>
              )}
            </div>

            {/* Case Updates */}
            {caseData.updates && caseData.updates.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Case Updates
                </h3>
                <div className="space-y-3">
                  {caseData.updates.map((update, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <p className="text-blue-800">{update.message}</p>
                        <span className="text-blue-600 text-sm font-medium">{update.formatted_date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Actions */}
            {!isEditing && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Admin Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    Add Case Update
                  </button>
                  <button 
                    onClick={() => setIsNotificationModalOpen(true)}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Send Notification
                  </button>
               <button 
  onClick={() => navigate(`/reports?case_id=${id}`)}
  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
>
  View Reports
</button>
               <button 
  onClick={() => showDialog(
    'warning',
    'Delete Case?',
    'Are you sure you want to delete this case? This action cannot be undone.',
    async () => {
      try {
        // Call the delete API
        await API.cases.delete(id);
        
        // Show success message briefly
        showDialog('success', 'Case Deleted', 'The case has been successfully deleted.');
        
        // Navigate back to cases table after a short delay
        setTimeout(() => {
          navigate('/cases');
        }, 1000);
        
      } catch (error) {
        console.error('Error deleting case:', error);
        showDialog('error', 'Delete Failed', 'Failed to delete the case. Please try again.');
      }
    },
    true
  )}
  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
>
  Delete Case
</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <CaseDialog
          isOpen={dialog.isOpen}
          onClose={closeDialog}
          type={dialog.type}
          title={dialog.title}
          message={dialog.message}
          onConfirm={dialog.onConfirm}
          showCancel={dialog.showCancel}
        />

        {/* Case Notification Modal */}
        <CaseNotificationModal
          isOpen={isNotificationModalOpen}
          onClose={() => setIsNotificationModalOpen(false)}
          caseData={caseData}
          onSend={handleNotificationSent}
        />
      </div>
    </div>
  );
}