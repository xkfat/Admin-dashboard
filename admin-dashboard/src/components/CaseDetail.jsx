import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Save, X, Calendar, MapPin, Phone, User, 
  AlertCircle, CheckCircle, Clock, Eye, Upload, Plus, 
  Bell, FileText, Trash2, ChevronDown, ChevronUp, Check
} from 'lucide-react';
import API from '../api';
import CaseDialog from './DialogCase';
import CaseNotificationModal from './CaseNotificationModal';
import OneCaseUpdateModal from './OneCaseUpdateModal';

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({});
  const [newPhoto, setNewPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isOneCaseUpdateModalOpen, setIsOneCaseUpdateModalOpen] = useState(false);
  const [showUpdates, setShowUpdates] = useState(true);

  const handleUpdateAdded = () => {
    fetchCaseData();
    showDialog(
      'success',
      'Update Added Successfully! ✨',
      'The case update has been added and is now visible to all stakeholders.'
    );
  };
  
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
    showDialog(
      'success',
      'Notification Sent Successfully! 📨',
      `Case notification has been delivered to ${caseData.reporter || 'the reporter'}.`
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
      setPhotoPreview(data.photo);
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
      
      const updateData = {};
      
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
      
      if (newPhoto) {
        updateData.photo = newPhoto;
      }

      const updatedCase = await API.cases.update(id, updateData);
      setCaseData(updatedCase);
      setIsEditing(false);
      setNewPhoto(null);
      setPhotoPreview(updatedCase.photo);
      
      showDialog(
        'success',
        'Case Updated Successfully! ✨',
        'All changes have been saved and are now visible.'
      );
    } catch (err) {
      console.error('Error updating case:', err);
      showDialog(
        'error',
        'Update Failed',
        'Unable to save changes. Please check your connection and try again.'
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
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'missing':
        return { 
          bg: 'bg-gradient-to-r from-red-500 to-red-600', 
          text: 'text-white',
          icon: AlertCircle,
          pulse: true
        };
      case 'found':
        return { 
          bg: 'bg-gradient-to-r from-green-500 to-green-600', 
          text: 'text-white',
          icon: CheckCircle,
          pulse: false
        };
      case 'under_investigation':
        return { 
          bg: 'bg-gradient-to-r from-yellow-500 to-orange-500', 
          text: 'text-white',
          icon: Clock,
          pulse: false
        };
      default:
        return { 
          bg: 'bg-gradient-to-r from-gray-400 to-gray-500', 
          text: 'text-white',
          icon: AlertCircle,
          pulse: false
        };
    }
  };

  const getSubmissionStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' };
      case 'in_progress':
        return { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' };
      case 'closed':
        return { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700', dot: 'bg-gray-500' };
      case 'rejected':
        return { bg: 'bg-red-50 border-red-200', text: 'text-red-700', dot: 'bg-red-500' };
      default:
        return { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700', dot: 'bg-gray-500' };
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-pulse"></div>
              </div>
              <p className="text-slate-600 font-medium">Loading case details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-3 text-red-500" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">Case not found</p>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(editData.status || caseData.status);
  const StatusIcon = statusConfig.icon;
  const submissionConfig = getSubmissionStatusConfig(editData.submission_status || caseData.submission_status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-6 shadow-lg">
          <button
            onClick={() => navigate('/cases')}
            className="flex items-center gap-3 text-slate-600 hover:text-slate-800 transition-all duration-200 hover:translate-x-1 group"
          >
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="font-medium text-lg">Back to Cases</span>
          </button>
          
          <div className="flex items-center gap-4">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                <Edit className="h-5 w-5" />
                Edit Case
              </button>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 bg-slate-500 text-white px-6 py-3 rounded-xl hover:bg-slate-600 transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Save className="h-5 w-5" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Header Section */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="relative bg-white text-gray-900 p-10">
            <div className="relative">
              <div className="flex flex-col lg:flex-row items-center gap-12">
                
                {/* Photo Section */}
                <div className="flex-shrink-0">
                  <div className="relative group">
                    <div className="w-48 h-48 rounded-3xl overflow-hidden ring-6 ring-gray-200 shadow-2xl">
                      <img
                        src={photoPreview || '/default-avatar.png'}
                        alt={caseData.full_name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => { e.target.src = '/default-avatar.png'; }}
                      />
                    </div>
                    {isEditing && (
                      <label className="absolute -bottom-3 -right-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg cursor-pointer transition-all duration-200 hover:scale-110">
                        <Upload className="h-6 w-6" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                    )}
                    {newPhoto && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                        New
                      </div>
                    )}
                  </div>
                </div>

                {/* Name and Status Section */}
                <div className="flex-1 text-center lg:text-left space-y-6">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input
                          type="text"
                          value={editData.first_name || ''}
                          onChange={(e) => handleInputChange('first_name', e.target.value)}
                          className="text-3xl font-bold p-4 border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          placeholder="First Name"
                        />
                        <input
                          type="text"
                          value={editData.last_name || ''}
                          onChange={(e) => handleInputChange('last_name', e.target.value)}
                          className="text-3xl font-bold p-4 border-2 border-gray-300 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          placeholder="Last Name"
                        />
                      </div>
                    </div>
                  ) : (
                    <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
                      {caseData.full_name}
                    </h1>
                  )}

                  {/* Status Pills */}
                  <div className="flex flex-wrap justify-center lg:justify-start gap-8">
                    {/* Age */}
                    <div className="bg-gray-100 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-gray-300">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editData.age || ''}
                          onChange={(e) => handleInputChange('age', e.target.value)}
                          className="w-20 bg-transparent text-gray-900 text-center border-none outline-none text-lg font-semibold"
                          min="0"
                          max="150"
                        />
                      ) : (
                        <span className="text-gray-900 font-semibold text-lg">{caseData.current_age} years old</span>
                      )}
                    </div>

                    {/* Gender */}
                    <div className="bg-gray-100 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-gray-300">
                      {isEditing ? (
                        <select
                          value={editData.gender || ''}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          className="bg-transparent text-gray-900 border-none outline-none text-lg font-semibold"
                        >
                          <option value="Male" className="text-slate-800">Male</option>
                          <option value="Female" className="text-slate-800">Female</option>
                        </select>
                      ) : (
                        <span className="text-gray-900 font-semibold text-lg">{caseData.gender}</span>
                      )}
                    </div>

                    <div className={`${statusConfig.bg} px-6 py-3 rounded-full shadow-xl ${statusConfig.pulse ? 'animate-pulse' : ''}`}>
                      <div className="flex items-center gap-3">
                        <StatusIcon className="h-5 w-5 text-white" />
                        {isEditing ? (
                          <select
                            value={editData.status || ''}
                            onChange={(e) => handleInputChange('status', e.target.value)}
                            className="bg-transparent border-none outline-none text-white text-lg font-bold"
                          >
                            <option value="missing" className="text-slate-800">Missing</option>
                            <option value="found" className="text-slate-800">Found</option>
                            <option value="under_investigation" className="text-slate-800">Investigating</option>
                          </select>
                        ) : (
                          <span className="font-bold text-lg text-white">
                            {caseData.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Missing Alert */}
                  {(editData.status || caseData.status) === 'missing' && (
                    <div className="inline-flex items-center gap-4 bg-red-100 border-2 border-red-200 rounded-xl px-8 py-4">
                      <AlertCircle className="h-7 w-7 text-red-500" />
                      <span className="text-red-800 font-bold text-xl">
                        Missing for {caseData.days_missing} days
                      </span>
                    </div>
                  )}

                  {/* Submission Status */}
                  <div>
                    <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 ${submissionConfig.bg} ${submissionConfig.text}`}>
                      <div className={`w-3 h-3 rounded-full ${submissionConfig.dot}`}></div>
                      {isEditing ? (
                        <select
                          value={editData.submission_status || ''}
                          onChange={(e) => handleInputChange('submission_status', e.target.value)}
                          className="bg-transparent border-none outline-none font-semibold"
                        >
                          <option value="active">Active</option>
                          <option value="in_progress">In Progress</option>
                          <option value="closed">Closed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      ) : (
                        <span className="font-semibold text-lg">
                          Submission: {caseData.submission_status?.replace('_', ' ').toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Case Details */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Case Info */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-6">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Eye className="h-6 w-6 text-blue-600" />
                  </div>
                  Case Information
                </h2>

                {/* Info Cards */}
                <div className="space-y-4">
                  {/* Last seen date */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-500 p-3 rounded-xl shadow-lg">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800 mb-2">Last Seen Date</h3>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editData.last_seen_date || ''}
                            onChange={(e) => handleInputChange('last_seen_date', e.target.value)}
                            className="p-2 border border-blue-200 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-blue-700 font-semibold text-lg">{formatDate(caseData.last_seen_date)}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Last seen location */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-4">
                      <div className="bg-green-500 p-3 rounded-xl shadow-lg">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800 mb-2">Last Seen Location</h3>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.last_seen_location || ''}
                            onChange={(e) => handleInputChange('last_seen_location', e.target.value)}
                            className="p-2 border border-green-200 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Enter location"
                          />
                        ) : (
                          <p className="text-green-700 font-semibold text-lg">{caseData.last_seen_location}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Phone */}
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-100 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-4">
                      <div className="bg-purple-500 p-3 rounded-xl shadow-lg">
                        <Phone className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800 mb-2">Contact Phone</h3>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={editData.contact_phone || ''}
                            onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                            className="p-2 border border-purple-200 rounded-lg w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Phone number"
                          />
                        ) : (
                          <p className="text-purple-700 font-semibold text-lg">{caseData.contact_phone || 'Not provided'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reporter */}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-4">
                      <div className="bg-orange-500 p-3 rounded-xl shadow-lg">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800 mb-2">Reported By</h3>
                        <p className="text-orange-700 font-semibold text-lg">{caseData.reporter || 'Anonymous'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Description & Updates */}
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Description
                  </h3>
                  {isEditing ? (
                    <textarea
                      value={editData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full p-4 border border-slate-200 rounded-xl h-40 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter description..."
                    />
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                      <p className="text-slate-700 leading-relaxed text-lg">
                        {caseData.description || 'No description provided.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Case Updates */}
                {caseData.updates && caseData.updates.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Case Updates ({caseData.updates.length})
                      </h3>
                      <button
                        onClick={() => setShowUpdates(!showUpdates)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors duration-200"
                      >
                        {showUpdates ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {showUpdates ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {showUpdates && (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {caseData.updates.map((update, index) => (
                          <div key={index} className="bg-blue-50 border border-blue-200 rounded-xl p-4 hover:shadow-sm transition-shadow duration-200">
                            <div className="flex justify-between items-start gap-4">
                              <p className="text-blue-800 font-medium flex-1">{update.message}</p>
                              <span className="text-blue-600 text-sm font-semibold whitespace-nowrap bg-blue-100 px-2 py-1 rounded-lg">
                                {update.formatted_date}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Admin Actions */}
            {!isEditing && (
              <div className="mt-12 pt-8 border-t border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => setIsOneCaseUpdateModalOpen(true)}
                    className="flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="font-semibold">Add Update</span>
                  </button>

                  <button 
                    onClick={() => setIsNotificationModalOpen(true)}
                    className="flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-600 to-amber-600 text-white p-4 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="font-semibold">Send Notification</span>
                  </button>

                  <button 
                    onClick={() => navigate(`/reports?case_id=${id}`)}
                    className="flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white p-4 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    <FileText className="h-5 w-5" />
                    <span className="font-semibold">View Reports</span>
                  </button>

                  <button 
                    onClick={() => showDialog(
                      'warning',
                      'Delete Case?',
                      'Are you sure you want to delete this case? This action cannot be undone and all associated data will be permanently lost.',
                      async () => {
                        try {
                          await API.cases.delete(id);
                          showDialog('success', 'Case Deleted Successfully', 'The case has been permanently removed from the system.');
                          setTimeout(() => {
                            navigate('/cases');
                          }, 1500);
                        } catch (error) {
                          console.error('Error deleting case:', error);
                          showDialog('error', 'Delete Failed', 'Unable to delete the case. Please try again or contact support.');
                        }
                      },
                      true
                    )}
                    className="flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    <Trash2 className="h-5 w-5" />
                    <span className="font-semibold">Delete Case</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <CaseDialog
          isOpen={dialog.isOpen}
          onClose={closeDialog}
          type={dialog.type}
          title={dialog.title}
          message={dialog.message}
          onConfirm={dialog.onConfirm}
          showCancel={dialog.showCancel}
        />

        <CaseNotificationModal
          isOpen={isNotificationModalOpen}
          onClose={() => setIsNotificationModalOpen(false)}
          caseData={caseData}
          onSend={handleNotificationSent}
        />

        <OneCaseUpdateModal
          isOpen={isOneCaseUpdateModalOpen}
          onClose={() => setIsOneCaseUpdateModalOpen(false)}
          caseId={id}
          caseData={caseData}
          onUpdateAdded={handleUpdateAdded}
        />
      </div>
    </div>
  );
}