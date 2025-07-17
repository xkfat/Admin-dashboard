import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Save, X, Calendar, MapPin, Phone, User, 
  AlertCircle, CheckCircle, Clock, Eye, Upload, Plus, 
  FileText, Trash2, ChevronDown, ChevronUp
} from 'lucide-react';
import API from '../api';
import CaseDialog from './DialogCase';
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

  // Smart back navigation handler
  const handleBackNavigation = () => {
    // Check if there's a previous page in history
    if (window.history.length > 1) {
      navigate(-1); // Go back to previous page
    } else {
      // Fallback to cases page if no history
      navigate('/cases');
    }
  };

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

  // Handle view reports with smart check
  const handleViewReports = async () => {
    try {
      // Check if there are any reports for this case
      const reportsData = await API.reports.fetchAll(); // You might need to adjust this API call
      
      // Filter reports for this specific case
      const caseReports = reportsData.filter(report => 
        report.missing_person_id === parseInt(id) || 
        report.case_id === parseInt(id) ||
        report.missing_person === parseInt(id)
      );
      
      if (caseReports.length === 0) {
        // No reports found - show simple dialog matching Reports page design
        setDialog({
          isOpen: true,
          type: 'no_reports', // Special type for this simple dialog
          title: 'No Reports Found',
          message: `There are no reports for ${caseData.full_name}'s case.`,
          onConfirm: null,
          showCancel: false
        });
      } else {
        // Reports exist - navigate to reports page
        navigate(`/reports?case_id=${id}`);
      }
    } catch (error) {
      console.error('Error checking reports:', error);
      // On error, just navigate normally
      navigate(`/reports?case_id=${id}`);
    }
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
          bg: 'bg-red-100 dark:bg-red-900/30', 
          text: 'text-red-800 dark:text-red-300',
          border: 'border-red-200 dark:border-red-700',
          icon: AlertCircle
        };
      case 'found':
        return { 
          bg: 'bg-green-100 dark:bg-green-900/30', 
          text: 'text-green-800 dark:text-green-300',
          border: 'border-green-200 dark:border-green-700',
          icon: CheckCircle
        };
      case 'under_investigation':
        return { 
          bg: 'bg-yellow-100 dark:bg-yellow-900/30', 
          text: 'text-yellow-800 dark:text-yellow-300',
          border: 'border-yellow-200 dark:border-yellow-700',
          icon: Clock
        };
      default:
        return { 
          bg: 'bg-gray-100 dark:bg-gray-700', 
          text: 'text-gray-800 dark:text-gray-300',
          border: 'border-gray-200 dark:border-gray-600',
          icon: AlertCircle
        };
    }
  };

  const getSubmissionStatusConfig = (status) => {
    switch (status) {
      case 'active':
        return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', border: 'border-red-200 dark:border-red-700' };
      case 'in_progress':
        return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-700' };
      case 'closed':
        return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', border: 'border-green-200 dark:border-green-700' };
      case 'rejected':
        return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-600' };
      default:
        return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-600' };
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-findthem-teal border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300 font-medium">Loading case details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-6 py-4 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-3 text-red-500 dark:text-red-400" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <p className="text-gray-500 dark:text-gray-400 text-lg">Case not found</p>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(editData.status || caseData.status);
  const StatusIcon = statusConfig.icon;
  const submissionConfig = getSubmissionStatusConfig(editData.submission_status || caseData.submission_status);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border dark:border-gray-700">
          <button
            onClick={handleBackNavigation}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-findthem-teal dark:hover:text-findthem-light transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back</span>
          </button>
          
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 bg-findthem-teal dark:bg-findthem-light text-white dark:text-gray-900 px-6 py-3 rounded-lg hover:bg-findthem-darkGreen dark:hover:bg-findthem-teal transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit Case
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 bg-gray-500 dark:bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-findthem-teal dark:bg-findthem-light text-white dark:text-gray-900 px-4 py-2 rounded-lg hover:bg-findthem-darkGreen dark:hover:bg-findthem-teal transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
          <div className="p-8">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              
              {/* Photo Section */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-40 h-40 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600">
                    <img
                      src={photoPreview || '/default-avatar.png'}
                      alt={caseData.full_name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = '/default-avatar.png'; }}
                    />
                  </div>
                  {isEditing && (
                    <label className="absolute -bottom-2 -right-2 bg-findthem-teal dark:bg-findthem-light hover:bg-findthem-darkGreen dark:hover:bg-findthem-teal text-white dark:text-gray-900 rounded-full p-2 cursor-pointer transition-colors">
                      <Upload className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  )}
                  {newPhoto && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded font-medium">
                      New
                    </div>
                  )}
                </div>
              </div>

              {/* Name and Status Section */}
              <div className="flex-1 space-y-6">
                {/* Name */}
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={editData.first_name || ''}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className="text-2xl font-bold p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-findthem-teal focus:ring-2 focus:ring-findthem-teal focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="First Name"
                    />
                    <input
                      type="text"
                      value={editData.last_name || ''}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className="text-2xl font-bold p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-findthem-teal focus:ring-2 focus:ring-findthem-teal focus:ring-opacity-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Last Name"
                    />
                  </div>
                ) : (
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                    {caseData.full_name}
                  </h1>
                )}

                {/* Status Pills Row */}
                <div className="flex flex-wrap gap-4">
                  {/* Age */}
                  <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-4 py-2 rounded-lg">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editData.age || ''}
                        onChange={(e) => handleInputChange('age', e.target.value)}
                        className="w-16 bg-transparent text-gray-900 dark:text-white text-center border-none outline-none font-medium"
                        min="0"
                        max="150"
                      />
                    ) : (
                      <span className="text-gray-900 dark:text-white font-medium">{caseData.current_age} years old</span>
                    )}
                  </div>

                  {/* Gender */}
                  <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-4 py-2 rounded-lg">
                    {isEditing ? (
                      <div className="relative">
                        <select
                          value={editData.gender || ''}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          className="appearance-none bg-transparent text-gray-900 dark:text-white border-none outline-none font-medium pr-6 cursor-pointer"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
                      </div>
                    ) : (
                      <span className="text-gray-900 dark:text-white font-medium">{caseData.gender}</span>
                    )}
                  </div>

                  {/* Case Status */}
                  <div className={`${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border px-4 py-2 rounded-lg`}>
                    <div className="flex items-center gap-2">
                      <StatusIcon className="h-4 w-4" />
                      {isEditing ? (
                        <div className="relative">
                          <select
                            value={editData.status || ''}
                            onChange={(e) => handleInputChange('status', e.target.value)}
                            className="appearance-none bg-transparent border-none outline-none font-medium pr-6 cursor-pointer"
                          >
                            <option value="missing">Missing</option>
                            <option value="found">Found</option>
                            <option value="under_investigation">Investigating</option>
                          </select>
                          <ChevronDown className="absolute right-0 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
                        </div>
                      ) : (
                        <span className="font-medium">
                          {caseData.status === 'under_investigation' ? 'Investigating' : 
                           caseData.status?.charAt(0).toUpperCase() + caseData.status?.slice(1) || 'Unknown'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submission Status */}
                  <div className={`${submissionConfig.bg} ${submissionConfig.text} ${submissionConfig.border} border px-4 py-2 rounded-lg`}>
                    {isEditing ? (
                      <div className="relative">
                        <select
                          value={editData.submission_status || ''}
                          onChange={(e) => handleInputChange('submission_status', e.target.value)}
                          className="appearance-none bg-transparent border-none outline-none font-medium pr-6 cursor-pointer"
                        >
                          <option value="active">Active</option>
                          <option value="in_progress">In Progress</option>
                          <option value="closed">Closed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <ChevronDown className="absolute right-0 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
                      </div>
                    ) : (
                      <span className="font-medium">
                        {caseData.submission_status?.replace('_', ' ').charAt(0).toUpperCase() + 
                         caseData.submission_status?.replace('_', ' ').slice(1)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Missing Alert */}
                {(editData.status || caseData.status) === 'missing' && (
                  <div className="inline-flex items-center gap-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg px-4 py-3">
                    <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                    <span className="text-red-800 dark:text-red-300 font-medium">
                      Missing for {caseData.days_missing} days
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Case Details */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Case Info */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Eye className="h-5 w-5 text-findthem-teal dark:text-findthem-light" />
                  Case Information
                </h2>

                {/* Info Cards */}
                <div className="space-y-4">
                  {/* Last seen date */}
                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-findthem-teal dark:text-findthem-light" />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 dark:text-white mb-1">Last Seen Date</h3>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editData.last_seen_date || ''}
                            onChange={(e) => handleInputChange('last_seen_date', e.target.value)}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full focus:border-findthem-teal focus:ring-2 focus:ring-findthem-teal focus:ring-opacity-20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        ) : (
                          <p className="text-gray-700 dark:text-gray-300">{formatDate(caseData.last_seen_date)}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Last seen location */}
                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-findthem-teal dark:text-findthem-light" />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 dark:text-white mb-1">Last Seen Location</h3>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.last_seen_location || ''}
                            onChange={(e) => handleInputChange('last_seen_location', e.target.value)}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full focus:border-findthem-teal focus:ring-2 focus:ring-findthem-teal focus:ring-opacity-20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="Enter location"
                          />
                        ) : (
                          <p className="text-gray-700 dark:text-gray-300">{caseData.last_seen_location}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Phone */}
                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-findthem-teal dark:text-findthem-light" />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 dark:text-white mb-1">Contact Phone</h3>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={editData.contact_phone || ''}
                            onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full focus:border-findthem-teal focus:ring-2 focus:ring-findthem-teal focus:ring-opacity-20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="Phone number"
                          />
                        ) : (
                          <p className="text-gray-700 dark:text-gray-300">{caseData.contact_phone || 'Not provided'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reporter */}
                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-findthem-teal dark:text-findthem-light" />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 dark:text-white mb-1">Reported By</h3>
                        <p className="text-gray-700 dark:text-gray-300">{caseData.reporter || 'Anonymous'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Description & Updates */}
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-findthem-teal dark:text-findthem-light" />
                    Description
                  </h3>
                  {isEditing ? (
                    <textarea
                      value={editData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg h-32 resize-none focus:border-findthem-teal focus:ring-2 focus:ring-findthem-teal focus:ring-opacity-20 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Enter description..."
                    />
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {caseData.description || 'No description provided.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Case Updates */}
                {caseData.updates && caseData.updates.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Clock className="h-5 w-5 text-findthem-teal dark:text-findthem-light" />
                        Case Updates ({caseData.updates.length})
                      </h3>
                      <button
                        onClick={() => setShowUpdates(!showUpdates)}
                        className="flex items-center gap-1 text-findthem-teal dark:text-findthem-light hover:text-findthem-darkGreen dark:hover:text-findthem-teal transition-colors"
                      >
                        {showUpdates ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {showUpdates ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {showUpdates && (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {caseData.updates.map((update, index) => (
                          <div key={index} className="bg-findthem-light dark:bg-findthem-teal/20 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                            <div className="flex justify-between items-start gap-4">
                              <p className="text-gray-800 dark:text-white flex-1">{update.message}</p>
                              <span className="text-findthem-teal dark:text-findthem-light text-sm font-medium whitespace-nowrap">
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
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => setIsOneCaseUpdateModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-findthem-teal dark:bg-findthem-light text-white dark:text-gray-900 p-3 rounded-lg hover:bg-findthem-darkGreen dark:hover:bg-findthem-teal transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="font-medium">Add Update</span>
                  </button>

                  <button 
                    onClick={handleViewReports}
                    className="flex items-center justify-center gap-2 bg-gray-600 dark:bg-gray-700 text-white p-3 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">View Reports</span>
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
                    className="flex items-center justify-center gap-2 bg-red-600 dark:bg-red-700 text-white p-3 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="font-medium">Delete Case</span>
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

        {/* Simple No Reports Dialog - Same design as Reports page */}
        {dialog.isOpen && dialog.type === 'no_reports' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border dark:border-gray-700">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-findthem-button dark:text-findthem-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
                No Reports Found
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                {dialog.message}
              </p>
              <button
                onClick={closeDialog}
                className="w-full bg-findthem-teal dark:bg-findthem-light text-white dark:text-gray-900 py-2 px-4 rounded-lg hover:bg-findthem-darkGreen dark:hover:bg-findthem-teal transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        )}

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