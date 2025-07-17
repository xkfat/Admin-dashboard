import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, X, AlertTriangle, Trash2, Filter, ChevronDown, ChevronUp, Search } from 'lucide-react';
import API from '../api';

// Custom Dialog Component matching Reports style with dark theme
const CustomDialog = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', // success, error, warning, info, confirm
  onConfirm = null,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false
}) => {
  if (!isOpen) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-600 dark:text-green-400',
          iconBg: 'bg-green-100 dark:bg-green-900/30',
          borderColor: 'border-green-200 dark:border-green-700',
          buttonColor: 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600'
        };
      case 'error':
        return {
          icon: AlertCircle,
          iconColor: 'text-red-600 dark:text-red-400',
          iconBg: 'bg-red-100 dark:bg-red-900/30',
          borderColor: 'border-red-200 dark:border-red-700',
          buttonColor: 'bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600'
        };
      case 'warning':
      case 'confirm':
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
          borderColor: 'border-yellow-200 dark:border-yellow-700',
          buttonColor: 'bg-yellow-600 dark:bg-yellow-700 hover:bg-yellow-700 dark:hover:bg-yellow-600'
        };
      default:
        return {
          icon: AlertCircle,
          iconColor: 'text-findthem-teal dark:text-findthem-light',
          iconBg: 'bg-findthem-light dark:bg-findthem-teal/20',
          borderColor: 'border-findthem-teal dark:border-findthem-light',
          buttonColor: 'bg-findthem-teal dark:bg-findthem-light hover:bg-findthem-darkGreen dark:hover:bg-findthem-teal'
        };
    }
  };

  const config = getTypeConfig();
  const IconComponent = config.icon;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl transform transition-all animate-in zoom-in duration-200 border dark:border-gray-700">
        
        {/* Header with Icon */}
        <div className="bg-findthem-bg dark:bg-findthem-teal rounded-t-2xl p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-gray-800 shadow-lg`}>
            <IconComponent className={`h-8 w-8 ${config.iconColor}`} />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">
            {title}
          </h3>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 text-center leading-relaxed mb-6">
            {message}
          </p>
          
          <div className="flex gap-3 justify-center">
            {showCancel && (
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors min-w-[100px]"
              >
                {cancelText}
              </button>
            )}
            
            <button
              onClick={handleConfirm}
              className={`px-6 py-3 ${config.buttonColor} text-white dark:text-gray-900 rounded-xl font-medium transition-colors min-w-[100px] shadow-lg`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AIMatches() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allMatches, setAllMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMatches, setSelectedMatches] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter visibility state
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [matchesPerPage] = useState(5);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    confidence: '',
    dateStart: ''
  });

  // Statistics
  const [stats, setStats] = useState({
    pendingReviews: 0,
    totalScans: 0,
    confirmedMatches: 0,
    falsePositives: 0
  });

  // Custom dialog state
  const [customDialog, setCustomDialog] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    showCancel: false,
    confirmText: 'OK',
    cancelText: 'Cancel'
  });

  // View match dialog state
  const [viewMatchDialog, setViewMatchDialog] = useState({
    isOpen: false,
    matchData: null
  });

  // Calculate pagination info
  const totalPages = Math.ceil(filteredMatches.length / matchesPerPage);
  const startIndex = (currentPage - 1) * matchesPerPage;
  const endIndex = startIndex + matchesPerPage;
  const currentMatches = filteredMatches.slice(startIndex, endIndex);

  // Helper function to show custom dialog
  const showCustomDialog = (type, title, message, onConfirm = null, showCancel = false, confirmText = 'OK', cancelText = 'Cancel') => {
    setCustomDialog({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      showCancel,
      confirmText,
      cancelText
    });
  };

  const closeCustomDialog = () => {
    setCustomDialog(prev => ({ ...prev, isOpen: false }));
  };

  // Read URL parameters and set initial filters
  useEffect(() => {
    console.log('📖 Reading URL parameters for AI matches...');
    const urlFilters = {
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || '',
      confidence: searchParams.get('confidence') || '',
      dateStart: searchParams.get('dateStart') || ''
    };

    console.log('🔗 URL Filters found:', urlFilters);

    const hasUrlFilters = Object.values(urlFilters).some(value => value !== '');
    
    if (hasUrlFilters) {
      console.log('✅ Applying URL filters:', urlFilters);
      setFilters(urlFilters);
      // Auto-expand filters if there are active filters from URL
      setShowFilters(true);
    }
  }, [searchParams]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedMatches([]);
  }, [filteredMatches.length]);

  // Fetch AI matches and stats on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Apply filters whenever filter states change or matches data changes
  useEffect(() => {
    applyFilters();
  }, [allMatches, filters]);

  // Check if any filters are active (excluding search)
  const hasActiveFilters = () => {
    return filters.status || filters.confidence || filters.dateStart;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both matches and stats in parallel
      const [matchesData, statsData] = await Promise.all([
        API.aiMatches.fetchAll(),
        API.aiMatches.getStats()
      ]);
      
      setAllMatches(matchesData);
      setStats({
        pendingReviews: statsData.pending_reviews || 0,
        totalScans: statsData.total_matches || 0,
        confirmedMatches: statsData.confirmed_matches || 0,
        falsePositives: statsData.false_positives || 0
      });
    } catch (err) {
      console.error('Error fetching AI matches data:', err);
      setError('Failed to load AI matches data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle stats card clicks to filter matches
  const handleStatsCardClick = (filterType, filterValue) => {
    console.log(`📊 Stats card clicked: ${filterType} = ${filterValue}`);
    
    const newFilters = {
      search: '',
      status: filterValue,
      confidence: '',
      dateStart: ''
    };

    setFilters(newFilters);
    setSelectedMatches([]);
  };

  // Get today's date in YYYY-MM-DD format for max date
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // FIXED: Apply filters function with proper date handling
  const applyFilters = () => {
    let filtered = [...allMatches];

    if (filters.search) {
      filtered = filtered.filter(match =>
        match.original_case_details?.full_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        match.matched_case_details?.full_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        match.id.toString().includes(filters.search) ||
        match.original_case?.toString().includes(filters.search) ||
        match.matched_case?.toString().includes(filters.search)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(match => match.status === filters.status);
    }

    if (filters.confidence) {
      filtered = filtered.filter(match => {
        if (filters.confidence === 'high') {
          return match.confidence_score >= 90;
        } else if (filters.confidence === 'medium') {
          return match.confidence_score >= 45 && match.confidence_score < 90;
        } else if (filters.confidence === 'low') {
          return match.confidence_score < 45;
        }
        return true;
      });
    }

    // FIXED: Date filtering with proper date handling - PAST DATES ONLY
    if (filters.dateStart) {
      filtered = filtered.filter(match => {
        try {
          // Handle different possible date formats and field names
          const matchDateStr = match.processing_date || match.created_at || match.date_created || match.timestamp;
          if (!matchDateStr) {
            console.warn('No date field found for match:', match.id);
            return false;
          }
          
          // Parse the match date (handle both ISO strings and date objects)
          const matchDate = new Date(matchDateStr);
          const filterDate = new Date(filters.dateStart);
          const today = new Date();
          
          // Ensure both dates are valid
          if (isNaN(matchDate.getTime()) || isNaN(filterDate.getTime())) {
            console.warn('Invalid date found:', { 
              matchId: match.id, 
              matchDate: matchDateStr, 
              filterDate: filters.dateStart 
            });
            return false;
          }
          
          // Set time to start of day for all dates to compare only the date part
          const matchDateOnly = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
          const filterDateOnly = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate());
          const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          
          // FIXED: Only include matches that:
          // 1. Are from the selected date onwards (>= filterDate)
          // 2. Are not in the future (>= today)
          // 3. Are between filterDate and today (inclusive)
          return matchDateOnly >= filterDateOnly && matchDateOnly <= todayOnly;
        } catch (error) {
          console.error('Error parsing dates for filtering:', error, {
            matchId: match.id,
            dateFields: {
              processing_date: match.processing_date,
              created_at: match.created_at,
              date_created: match.date_created
            }
          });
          return false;
        }
      });
    }

    console.log('🔍 Filter Results:', {
      originalCount: allMatches.length,
      filteredCount: filtered.length,
      appliedFilters: Object.entries(filters).filter(([key, value]) => value !== ''),
      sampleMatch: allMatches[0] ? {
        id: allMatches[0].id,
        processing_date: allMatches[0].processing_date,
        created_at: allMatches[0].created_at,
        date_created: allMatches[0].date_created
      } : null
    });

    setFilteredMatches(filtered);
    setTotalCount(filtered.length);
    
    // Update URL with current filters
    const newSearchParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value);
      }
    });
    setSearchParams(newSearchParams);
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    console.log(`Filter changed: ${key} = ${value}`);
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    console.log('🧹 Clearing all filters');
    const emptyFilters = {
      search: '',
      status: '',
      confidence: '',
      dateStart: ''
    };
    setFilters(emptyFilters);
    setSearchParams(new URLSearchParams());
  };

  // Handle page changes
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setSelectedMatches([]);
      document.getElementById('ai-matches-table')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Select/deselect matches
  const handleSelectAll = () => {
    if (selectedMatches.length === currentMatches.length) {
      setSelectedMatches([]);
    } else {
      setSelectedMatches(currentMatches.map(match => match.id));
    }
  };

  const handleSelectMatch = (matchId) => {
    setSelectedMatches(prev => {
      if (prev.includes(matchId)) {
        return prev.filter(id => id !== matchId);
      } else {
        return [...prev, matchId];
      }
    });
  };

  // Navigation to case details
  const handleCaseClick = (caseId) => {
    navigate(`/cases/${caseId}`);
  };

  // View match details with enhanced dialog
  const viewMatch = async (matchId) => {
    try {
      const matchData = await API.aiMatches.getById(matchId);
      setViewMatchDialog({
        isOpen: true,
        matchData: matchData
      });
    } catch (err) {
      console.error('Error viewing match:', err);
      showCustomDialog(
        'error',
        'Error',
        'Failed to load match details. Please try again.'
      );
    }
  };

  // Close view match dialog
  const closeViewMatchDialog = () => {
    setViewMatchDialog({
      isOpen: false,
      matchData: null
    });
  };

  // Enhanced bulk status change function with more options
  const bulkStatusChange = async (newStatus) => {
    if (selectedMatches.length === 0) {
      showCustomDialog(
        'warning',
        'No Matches Selected',
        'Please select matches to update before proceeding.'
      );
      return;
    }

    const statusNames = {
      'confirmed': 'Confirmed',
      'rejected': 'Rejected',
      'pending': 'Pending Review',
      'under_review': 'Under Review'
    };

    showCustomDialog(
      'confirm',
      'Confirm Bulk Update',
      `Are you sure you want to change the status of ${selectedMatches.length} selected matches to "${statusNames[newStatus]}"?`,
      async () => {
        closeCustomDialog();
        
        try {
          setLoading(true);
          
          // Update each selected match
          const updatePromises = selectedMatches.map(matchId => {
            if (newStatus === 'confirmed') {
              return API.aiMatches.confirm(matchId, 'Bulk confirmed via admin dashboard');
            } else if (newStatus === 'rejected') {
              return API.aiMatches.reject(matchId, 'Bulk rejected via admin dashboard');
            } else if (newStatus === 'pending' || newStatus === 'under_review') {
              // For pending and under_review, we'll use the review endpoint with the new action
              return API.aiMatches.review(matchId, newStatus, 'Bulk status change via admin dashboard');
            } else {
              return Promise.resolve();
            }
          });
          
          await Promise.all(updatePromises);
          
          setSelectedMatches([]);
          await fetchData();
          
          showCustomDialog(
            'success',
            'Bulk Update Successful! 🎉',
            `Successfully updated ${selectedMatches.length} matches to "${statusNames[newStatus]}" status.`
          );
        } catch (err) {
          console.error('Error in bulk update:', err);
          showCustomDialog(
            'error',
            'Update Failed',
            'Failed to update matches. Please try again.'
          );
        } finally {
          setLoading(false);
        }
      },
      true,
      'Update',
      'Cancel'
    );
  };

  // Enhanced bulk delete function
  const bulkDeleteMatches = async () => {
    if (selectedMatches.length === 0) {
      showCustomDialog(
        'warning',
        'No Matches Selected',
        'Please select matches to delete before proceeding.'
      );
      return;
    }

    showCustomDialog(
      'confirm',
      'Delete Selected Matches',
      `⚠️ Are you sure you want to permanently delete ${selectedMatches.length} selected AI matches? This action cannot be undone.`,
      async () => {
        closeCustomDialog();
        
        try {
          setLoading(true);
          
          // Delete each selected match
          const deletePromises = selectedMatches.map(matchId => 
            API.aiMatches.delete(matchId)
          );
          
          await Promise.all(deletePromises);
          
          setSelectedMatches([]);
          await fetchData();
          
          showCustomDialog(
            'success',
            'Matches Deleted! 🗑️',
            `Successfully deleted ${selectedMatches.length} AI matches.`
          );
        } catch (err) {
          console.error('Error in bulk delete:', err);
          showCustomDialog(
            'error',
            'Delete Failed',
            'Failed to delete matches. Please try again.'
          );
        } finally {
          setLoading(false);
        }
      },
      true,
      'Delete',
      'Cancel'
    );
  };

  // Enhanced single match actions
  const handleSingleMatchAction = async (matchId, action, caseName) => {
    const actionNames = {
      'confirm': 'confirm this match',
      'reject': 'reject this match', 
      'pending': 'set this match back to pending',
      'under_review': 'set this match under review',
      'delete': 'delete this match'
    };

    const actionMessages = {
      'confirm': `This will mark the original case as "Found".`,
      'reject': `This will be marked as a false positive.`,
      'pending': `This will reset the match to pending review status.`,
      'under_review': `This will set the match for further investigation.`,
      'delete': `⚠️ This action cannot be undone.`
    };

    showCustomDialog(
      action === 'delete' ? 'warning' : 'confirm',
      `${action.charAt(0).toUpperCase() + action.slice(1)} Match`,
      `Are you sure you want to ${actionNames[action]} for ${caseName}?`,
      async () => {
        closeCustomDialog();
        
        try {
          setLoading(true);
          let response;
          
          if (action === 'confirm') {
            response = await API.aiMatches.confirm(matchId, 'Confirmed via admin dashboard');
          } else if (action === 'reject') {
            response = await API.aiMatches.reject(matchId, 'Rejected via admin dashboard');
          } else if (action === 'pending' || action === 'under_review') {
            response = await API.aiMatches.review(matchId, action, `Set to ${action} via admin dashboard`);
          } else if (action === 'delete') {
            response = await API.aiMatches.delete(matchId);
          }
          
          const successMessages = {
            'confirm': 'Match Confirmed! ✅',
            'reject': 'Match Rejected ✅',
            'pending': 'Match Reset to Pending ✅',
            'under_review': 'Match Set Under Review ✅',
            'delete': 'Match Deleted! 🗑️'
          };
          
          showCustomDialog(
            'success',
            successMessages[action],
            response?.message || `Successfully ${action}ed the match.`
          );
          
          await fetchData();
        } catch (err) {
          console.error(`Error ${action}ing match:`, err);
          showCustomDialog(
            'error',
            `${action.charAt(0).toUpperCase() + action.slice(1)} Failed`,
            `Failed to ${action} match. Please try again.`
          );
        } finally {
          setLoading(false);
        }
      },
      true,
      action === 'delete' ? 'Delete' : action.charAt(0).toUpperCase() + action.slice(1),
      'Cancel'
    );
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (confidence >= 45) return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  };

  const getConfidenceTextColor = (confidence) => {
    if (confidence >= 90) return 'text-green-600 dark:text-green-500';
    if (confidence >= 45) return 'text-yellow-600 dark:text-yellow-500';
    return 'text-red-600 dark:text-red-500';
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400';
      case 'confirmed':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400';
      case 'under_review':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && allMatches.length === 0) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-findthem-teal mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading AI matches...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
          <button 
            onClick={fetchData}
            className="ml-4 bg-red-600 dark:bg-red-700 text-white px-3 py-1 rounded hover:bg-red-700 dark:hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="space-y-6">
        {/* Stats Cards - Made clickable */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            className="bg-white dark:bg-gray-800 border-radius-15 p-6 text-center border border-gray-200 dark:border-gray-700 rounded-lg transition-all hover:border-yellow-400 dark:hover:border-yellow-500 hover:shadow-lg cursor-pointer"
            onClick={() => handleStatsCardClick('status', 'pending')}
          >
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-500 my-2">{stats.pendingReviews}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">Pending Reviews</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Awaiting admin decision</div>
          </div>
          
          <div 
            className="bg-white dark:bg-gray-800 border-radius-15 p-6 text-center border border-gray-200 dark:border-gray-700 rounded-lg transition-all hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg cursor-pointer"
            onClick={clearAllFilters}
          >
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-500 my-2">{stats.totalScans}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">Total Scans</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">All processed matches</div>
          </div>
          
          <div 
            className="bg-white dark:bg-gray-800 border-radius-15 p-6 text-center border border-gray-200 dark:border-gray-700 rounded-lg transition-all hover:border-green-400 dark:hover:border-green-500 hover:shadow-lg cursor-pointer"
            onClick={() => handleStatsCardClick('status', 'confirmed')}
          >
            <div className="text-2xl font-bold text-green-600 dark:text-green-500 my-2">{stats.confirmedMatches}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">Confirmed Matches</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Successfully verified</div>
          </div>
          
          <div 
            className="bg-white dark:bg-gray-800 border-radius-15 p-6 text-center border border-gray-200 dark:border-gray-700 rounded-lg transition-all hover:border-red-400 dark:hover:border-red-500 hover:shadow-lg cursor-pointer"
            onClick={() => handleStatsCardClick('status', 'rejected')}
          >
            <div className="text-2xl font-bold text-red-600 dark:text-red-500 my-2">{stats.falsePositives}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">False Positives</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Rejected matches</div>
          </div>
        </div>

        {/* Search and Filters - UPDATED WITH COLLAPSIBLE FILTERS */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
          {/* Search Bar with Filter Button */}
          <div className="flex gap-4 mb-4">
           <div className="flex-1">
  <div className="relative">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
    <input
      type="text"
      className="w-full pl-10 pr-4 py-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      placeholder="Search by name, match ID, or case ID..."
      value={filters.search}
      onChange={(e) => handleFilterChange('search', e.target.value)}
    />
  </div>
</div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-6 py-4 border rounded-lg font-medium transition-all ${
                showFilters 
                  ? 'bg-findthem-teal dark:bg-findthem-light text-white dark:text-gray-900 border-findthem-teal dark:border-findthem-light' 
                  : hasActiveFilters() 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30' 
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {hasActiveFilters() && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 ml-1">
                  {Object.values(filters).filter(v => v && v !== filters.search).length}
                </span>
              )}
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {/* Collapsible Filters */}
          {showFilters && (
            <div className="border-t dark:border-gray-600 pt-4 mt-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col md:flex-row gap-4 justify-end items-center">
                <select
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg w-full md:w-auto focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="rejected">Rejected</option>
                  <option value="under_review">Under Review</option>
                </select>

                <select
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg w-full md:w-auto focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={filters.confidence}
                  onChange={(e) => handleFilterChange('confidence', e.target.value)}
                >
                  <option value="">All Confidence</option>
                  <option value="high">High (90%+)</option>
                  <option value="medium">Medium (45-89%)</option>
                  <option value="low">Low (&lt;45%)</option>
                </select>

                <input
                  type="date"
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg w-full md:w-auto focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={filters.dateStart}
                  onChange={(e) => handleFilterChange('dateStart', e.target.value)}
                  placeholder="From date"
                  max={getTodayDate()} // Prevent future dates
                />
                
                <button
                  className="bg-gray-500 dark:bg-gray-600 text-white p-3 rounded-lg hover:bg-gray-600 dark:hover:bg-gray-500 w-full md:w-auto transition-colors"
                  onClick={clearAllFilters}
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* AI Matches Table */}
        <div id="ai-matches-table" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
          <div className="p-6 border-b dark:border-gray-600 bg-gradient-to-br from-findthem-teal via-findthem-teal to-findthem-darkGreen text-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xl font-bold">AI Facial Recognition Matches</div>
              </div>
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
            </div>
          </div>

          {/* Enhanced Bulk Actions - All buttons in one row */}
          {selectedMatches.length > 0 && (
            <div className="p-4 bg-findthem-light dark:bg-findthem-teal/20 border-b dark:border-gray-600">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {selectedMatches.length} matches selected
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Status Change Buttons */}
                  <button
                    className="bg-green-600 dark:bg-green-700 text-white px-3 py-2 rounded text-sm hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-medium"
                    onClick={() => bulkStatusChange('confirmed')}
                    disabled={loading}
                  >
                    Set Confirmed
                  </button>
                  <button
                    className="bg-red-600 dark:bg-red-700 text-white px-3 py-2 rounded text-sm hover:bg-red-700 dark:hover:bg-red-600 transition-colors font-medium"
                    onClick={() => bulkStatusChange('rejected')}
                    disabled={loading}
                  >
                    Set Rejected
                  </button>
                  <button
                    className="bg-yellow-600 dark:bg-yellow-700 text-white px-3 py-2 rounded text-sm hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors font-medium"
                    onClick={() => bulkStatusChange('pending')}
                    disabled={loading}
                  >
                    Set Pending
                  </button>
                  <button
                    className="bg-blue-600 dark:bg-blue-700 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
                    onClick={() => bulkStatusChange('under_review')}
                    disabled={loading}
                  >
                    Set Under Review
                  </button>
                  {/* Delete Button */}
                  <button
                    className="bg-gray-600 dark:bg-gray-700 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors flex items-center font-medium"
                    onClick={bulkDeleteMatches}
                    disabled={loading}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete Selected
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedMatches.length === currentMatches.length && currentMatches.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600 text-findthem-teal focus:ring-findthem-teal dark:bg-gray-700"
                    />
                  </th>
                  <th className="p-4 text-left text-gray-900 dark:text-white">Original Case</th>
                  <th className="p-4 text-left text-gray-900 dark:text-white">Matched Case</th>
                  <th className="p-4 text-left text-gray-900 dark:text-white">Confidence</th>
                  <th className="p-4 text-left text-gray-900 dark:text-white">Status</th>
                  <th className="p-4 text-left text-gray-900 dark:text-white">Date</th>
                  <th className="p-4 text-left w-48 text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-findthem-teal mr-3"></div>
                        Loading matches...
                      </div>
                    </td>
                  </tr>
                ) : currentMatches.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <svg className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4.343 15.657l9.9-9.9a2.121 2.121 0 013 3l-9.9 9.9a2.121 2.121 0 01-3-3z"></path>
                      </svg>
                      <p className="text-lg font-medium">No AI matches found</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        {Object.values(filters).some(f => f) 
                          ? 'No matches found matching your criteria.' 
                          : 'Matches will appear here when the AI finds potential facial recognition matches'
                        }
                      </p>
                    </td>
                  </tr>
                ) : (
                  currentMatches.map((match) => (
                    <tr key={match.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedMatches.includes(match.id)}
                          onChange={() => handleSelectMatch(match.id)}
                          className="rounded border-gray-300 dark:border-gray-600 text-findthem-teal focus:ring-findthem-teal dark:bg-gray-700"
                        />
                      </td>
                      
                      {/* Original Case */}
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={match.original_case_details?.photo || '/default-avatar.png'} 
                            alt={match.original_case_details?.full_name || 'Unknown'} 
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 flex-shrink-0"
                            onError={(e) => { e.target.src = '/default-avatar.png'; }}
                          />
                          <div className="min-w-0 flex-1">
                            <button
                              onClick={() => handleCaseClick(match.original_case)}
                              className="font-medium text-findthem-teal dark:text-findthem-light hover:text-findthem-darkGreen dark:hover:text-findthem-teal hover:underline transition-colors text-left"
                            >
                              {match.original_case_details?.full_name || 'Unknown'}
                            </button>
                          </div>
                        </div>
                      </td>
                      
                      {/* Matched Case */}
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={match.matched_case_details?.photo || '/default-avatar.png'} 
                            alt={match.matched_case_details?.full_name || 'Unknown'} 
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 flex-shrink-0"
                            onError={(e) => { e.target.src = '/default-avatar.png'; }}
                          />
                          <div className="min-w-0 flex-1">
                            <button
                              onClick={() => handleCaseClick(match.matched_case)}
                              className="font-medium text-findthem-teal dark:text-findthem-light hover:text-findthem-darkGreen dark:hover:text-findthem-teal hover:underline transition-colors text-left"
                            >
                              {match.matched_case_details?.full_name || 'Unknown'}
                            </button>
                          </div>
                        </div>
                      </td>
                      
                      {/* Confidence */}
                      <td className="p-4">
                        <div className="w-20">
                          <div className={`font-bold mb-1 ${getConfidenceTextColor(match.confidence_score)}`}>
                            {match.confidence_score ? `${Math.round(match.confidence_score)}%` : 'N/A'}
                          </div>
                          <div className="h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 relative">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${getConfidenceColor(match.confidence_score || 0)}`}
                              style={{ width: `${match.confidence_score || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Status */}
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(match.status)}`}>
                          {match.status.replace('_', ' ')}
                        </span>
                      </td>
                      
                      {/* Date */}
                      <td className="p-4 text-gray-600 dark:text-gray-300 text-sm">
                        {match.processing_date_formatted || formatDate(match.processing_date) || 'N/A'}
                      </td>
                      
                      {/* Enhanced Actions */}
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {/* View Details Button - Always Available */}
                          <button 
                            className="bg-findthem-teal dark:bg-findthem-light text-white dark:text-gray-900 p-2 rounded-lg hover:bg-findthem-darkGreen dark:hover:bg-findthem-teal transition-all text-xs" 
                            onClick={() => viewMatch(match.id)} 
                            title="View Details"
                            disabled={loading}
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                          </button>

                          {/* Status-specific Action Buttons */}
                          {match.status === 'pending' && (
                            <>
                              <button 
                                className="bg-green-500 dark:bg-green-600 text-white p-2 rounded-lg hover:bg-green-600 dark:hover:bg-green-500 transition-all text-xs" 
                                onClick={() => handleSingleMatchAction(match.id, 'confirm', match.original_case_details?.full_name)} 
                                title="Confirm Match"
                                disabled={loading}
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                              </button>
                              <button 
                                className="bg-red-500 dark:bg-red-600 text-white p-2 rounded-lg hover:bg-red-600 dark:hover:bg-red-500 transition-all text-xs" 
                                onClick={() => handleSingleMatchAction(match.id, 'reject', match.original_case_details?.full_name)} 
                                title="Reject Match"
                                disabled={loading}
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                              </button>
                              <button 
                                className="bg-blue-500 dark:bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-500 transition-all text-xs" 
                                onClick={() => handleSingleMatchAction(match.id, 'under_review', match.original_case_details?.full_name)} 
                                title="Set Under Review"
                                disabled={loading}
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                </svg>
                              </button>
                            </>
                          )}

                          {match.status === 'confirmed' && (
                            <>
                              <button 
                                className="bg-yellow-500 dark:bg-yellow-600 text-white p-2 rounded-lg hover:bg-yellow-600 dark:hover:bg-yellow-500 transition-all text-xs" 
                                onClick={() => handleSingleMatchAction(match.id, 'pending', match.original_case_details?.full_name)} 
                                title="Reset to Pending"
                                disabled={loading}
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                              </button>
                              <button 
                                className="bg-red-500 dark:bg-red-600 text-white p-2 rounded-lg hover:bg-red-600 dark:hover:bg-red-500 transition-all text-xs" 
                                onClick={() => handleSingleMatchAction(match.id, 'reject', match.original_case_details?.full_name)} 
                                title="Change to Rejected"
                                disabled={loading}
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                              </button>
                            </>
                          )}

                          {match.status === 'rejected' && (
                            <>
                              <button 
                                className="bg-yellow-500 dark:bg-yellow-600 text-white p-2 rounded-lg hover:bg-yellow-600 dark:hover:bg-yellow-500 transition-all text-xs" 
                                onClick={() => handleSingleMatchAction(match.id, 'pending', match.original_case_details?.full_name)} 
                                title="Reset to Pending"
                                disabled={loading}
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                              </button>
                              <button 
                                className="bg-green-500 dark:bg-green-600 text-white p-2 rounded-lg hover:bg-green-600 dark:hover:bg-green-500 transition-all text-xs" 
                                onClick={() => handleSingleMatchAction(match.id, 'confirm', match.original_case_details?.full_name)} 
                                title="Change to Confirmed"
                                disabled={loading}
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                              </button>
                            </>
                          )}

                          {match.status === 'under_review' && (
                            <>
                              <button 
                                className="bg-green-500 dark:bg-green-600 text-white p-2 rounded-lg hover:bg-green-600 dark:hover:bg-green-500 transition-all text-xs" 
                                onClick={() => handleSingleMatchAction(match.id, 'confirm', match.original_case_details?.full_name)} 
                                title="Confirm Match"
                                disabled={loading}
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                              </button>
                              <button 
                                className="bg-red-500 dark:bg-red-600 text-white p-2 rounded-lg hover:bg-red-600 dark:hover:bg-red-500 transition-all text-xs" 
                                onClick={() => handleSingleMatchAction(match.id, 'reject', match.original_case_details?.full_name)} 
                                title="Reject Match"
                                disabled={loading}
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                              </button>
                              <button 
                                className="bg-yellow-500 dark:bg-yellow-600 text-white p-2 rounded-lg hover:bg-yellow-600 dark:hover:bg-yellow-500 transition-all text-xs" 
                                onClick={() => handleSingleMatchAction(match.id, 'pending', match.original_case_details?.full_name)} 
                                title="Reset to Pending"
                                disabled={loading}
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                              </button>
                            </>
                          )}

                          {/* Delete Button - Always Available */}
                          <button 
                            className="bg-gray-600 dark:bg-gray-700 text-white p-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-all text-xs" 
                            onClick={() => handleSingleMatchAction(match.id, 'delete', match.original_case_details?.full_name)} 
                            title="Delete Match"
                            disabled={loading}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Simple Pagination - Only Previous/Next */}
          {totalPages > 1 && (
            <div className="p-4 border-t dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center justify-between">
                {/* Pagination Info */}
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredMatches.length)} of {filteredMatches.length} matches
                </div>

                {/* Simple Navigation Controls */}
                <div className="flex items-center space-x-4">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>

                  {/* Current Page Info */}
                  <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                    Page {currentPage} of {totalPages}
                  </span>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 border-t dark:border-gray-600 bg-red-50 dark:bg-red-900/30">
              <div className="text-red-700 dark:text-red-300 text-sm flex items-center">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
                {error}
              </div>
            </div>
          )}
        </div>

        {/* Custom Dialog */}
        <CustomDialog
          isOpen={customDialog.isOpen}
          onClose={closeCustomDialog}
          type={customDialog.type}
          title={customDialog.title}
          message={customDialog.message}
          onConfirm={customDialog.onConfirm}
          showCancel={customDialog.showCancel}
          confirmText={customDialog.confirmText}
          cancelText={customDialog.cancelText}
        />

        {/* Enhanced View Match Dialog */}
        {viewMatchDialog.isOpen && viewMatchDialog.matchData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl transform transition-all animate-in zoom-in duration-200 border dark:border-gray-700">
              
              {/* Header */}
              <div className="bg-findthem-bg dark:bg-findthem-teal rounded-t-2xl p-6 text-center relative">
                <button
                  onClick={closeViewMatchDialog}
                  className="absolute top-4 right-4 text-white hover:text-gray-200 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <h3 className="text-xl font-bold text-white mb-2">
                  The Match Details
                </h3>
                
              </div>
              
              {/* Content */}
              <div className="p-6">
                {/* Photos Section */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {/* Original Case */}
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-3 rounded-2xl overflow-hidden border-4 border-blue-200 dark:border-blue-600 shadow-lg">
                      <img
                        src={viewMatchDialog.matchData.original_case_details?.photo || '/default-avatar.png'}
                        alt={viewMatchDialog.matchData.original_case_details?.full_name || 'Unknown'}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = '/default-avatar.png'; }}
                      />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {viewMatchDialog.matchData.original_case_details?.full_name || 'Unknown'}
                    </h4>
                    <p className="text-sm text-blue-600 dark:text-blue-500 font-medium">
                      Original Case #{viewMatchDialog.matchData.original_case}
                    </p>
                  </div>

                  {/* Matched Case */}
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-3 rounded-2xl overflow-hidden border-4 border-green-200 dark:border-green-600 shadow-lg">
                      <img
                        src={viewMatchDialog.matchData.matched_case_details?.photo || '/default-avatar.png'}
                        alt={viewMatchDialog.matchData.matched_case_details?.full_name || 'Unknown'}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = '/default-avatar.png'; }}
                      />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {viewMatchDialog.matchData.matched_case_details?.full_name || 'Unknown'}
                    </h4>
                    <p className="text-sm text-green-600 dark:text-green-500 font-medium">
                      Matched Case #{viewMatchDialog.matchData.matched_case}
                    </p>
                  </div>
                </div>

                {/* Confidence Section */}
                <div className="text-center mb-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border dark:border-gray-600">
                    <h5 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Confidence Score</h5>
                    <div className={`text-4xl font-bold mb-3 ${getConfidenceTextColor(viewMatchDialog.matchData.confidence_score)}`}>
                      {viewMatchDialog.matchData.confidence_score ? `${Math.round(viewMatchDialog.matchData.confidence_score)}%` : 'N/A'}
                    </div>
                    <div className="w-full max-w-xs mx-auto">
                      <div className="h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 relative">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${getConfidenceColor(viewMatchDialog.matchData.confidence_score || 0)}`}
                          style={{ width: `${viewMatchDialog.matchData.confidence_score || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {viewMatchDialog.matchData.confidence_score >= 90 ? 'High Confidence' : 
                       viewMatchDialog.matchData.confidence_score >= 45 ? 'Medium Confidence' : 'Low Confidence'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center mt-6 space-x-3">
                  <button
                    onClick={closeViewMatchDialog}
                    className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleCaseClick(viewMatchDialog.matchData.original_case)}
                    className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    View Original Case
                  </button>
                  <button
                    onClick={() => handleCaseClick(viewMatchDialog.matchData.matched_case)}
                    className="px-6 py-3 bg-green-600 dark:bg-green-700 text-white rounded-xl font-medium hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                  >
                    View Matched Case
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}