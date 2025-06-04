import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, X, AlertTriangle } from 'lucide-react';
import API from '../api';

// Custom Dialog Component matching Reports style
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
          iconColor: 'text-green-600',
          iconBg: 'bg-green-100',
          borderColor: 'border-green-200',
          buttonColor: 'bg-green-600 hover:bg-green-700'
        };
      case 'error':
        return {
          icon: AlertCircle,
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          borderColor: 'border-red-200',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
      case 'confirm':
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-600',
          iconBg: 'bg-yellow-100',
          borderColor: 'border-yellow-200',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
        };
      default:
        return {
          icon: AlertCircle,
          iconColor: 'text-findthem-teal',
          iconBg: 'bg-findthem-light',
          borderColor: 'border-findthem-teal',
          buttonColor: 'bg-findthem-teal hover:bg-findthem-darkGreen'
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
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all animate-in zoom-in duration-200">
        
        {/* Header with Icon */}
        <div className="bg-findthem-bg rounded-t-2xl p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg`}>
            <IconComponent className={`h-8 w-8 ${config.iconColor}`} />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">
            {title}
          </h3>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 text-center leading-relaxed mb-6">
            {message}
          </p>
          
          <div className="flex gap-3 justify-center">
            {showCancel && (
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-400 transition-colors min-w-[100px]"
              >
                {cancelText}
              </button>
            )}
            
            <button
              onClick={handleConfirm}
              className={`px-6 py-3 ${config.buttonColor} text-white rounded-xl font-medium transition-colors min-w-[100px] shadow-lg`}
            >
              {confirmText}
            </button>
          </div>
        </div>
        
        {/* Removed decorative bottom border */}
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
        totalScans: statsData.total_matches || 0, // Changed from scans_today to total_matches
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

  // Apply filters
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

    if (filters.dateStart) {
      filtered = filtered.filter(match => {
        const matchDate = new Date(match.processing_date);
        const filterDate = new Date(filters.dateStart);
        return matchDate >= filterDate;
      });
    }

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

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        if (totalPages > 5) {
          pages.push('...');
          pages.push(totalPages);
        }
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        if (totalPages > 5) {
          pages.push('...');
        }
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
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

  // Bulk status change function
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
      'rejected': 'Rejected'
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
            } else {
              // For under_review, you might need to add this API method
              // For now, we'll show a message that this needs to be implemented
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

  // Confirm match
  const confirmMatch = async (matchId, originalCaseName) => {
    showCustomDialog(
      'confirm',
      'Confirm Match',
      `Are you sure you want to confirm this match for ${originalCaseName}? This will mark the original case as "Found".`,
      async () => {
        closeCustomDialog();
        
        try {
          setLoading(true);
          const response = await API.aiMatches.confirm(matchId, 'Confirmed via admin dashboard');
          
          showCustomDialog(
            'success',
            'Match Confirmed! ✅',
            response.message || `Match confirmed! Case will be marked as found.`
          );
          
          await fetchData();
        } catch (err) {
          console.error('Error confirming match:', err);
          showCustomDialog(
            'error',
            'Confirmation Failed',
            'Failed to confirm match. Please try again.'
          );
        } finally {
          setLoading(false);
        }
      },
      true,
      'Confirm',
      'Cancel'
    );
  };

  // Reject match
  const rejectMatch = async (matchId, originalCaseName) => {
    showCustomDialog(
      'confirm',
      'Reject Match',
      `Are you sure you want to reject this match for ${originalCaseName}? This will be marked as a false positive.`,
      async () => {
        closeCustomDialog();
        
        try {
          setLoading(true);
          const response = await API.aiMatches.reject(matchId, 'Rejected via admin dashboard');
          
          showCustomDialog(
            'success',
            'Match Rejected ✅',
            response.message || `Match rejected and marked as false positive.`
          );
          
          await fetchData();
        } catch (err) {
          console.error('Error rejecting match:', err);
          showCustomDialog(
            'error',
            'Rejection Failed',
            'Failed to reject match. Please try again.'
          );
        } finally {
          setLoading(false);
        }
      },
      true,
      'Reject',
      'Cancel'
    );
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (confidence >= 45) return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  };

  const getConfidenceTextColor = (confidence) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 45) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-findthem-teal mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading AI matches...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
          <button 
            onClick={fetchData}
            className="ml-4 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Stats Cards - Made clickable */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            className="bg-white border-radius-15 p-6 text-center border border-gray-200 rounded-lg transition-all hover:border-yellow-400 hover:shadow-lg cursor-pointer"
            onClick={() => handleStatsCardClick('status', 'pending')}
          >
            <div className="text-2xl font-bold text-purple-600 my-2">{stats.pendingReviews}</div>
            <div className="text-sm text-gray-600 font-medium">Pending Reviews</div>
            <div className="text-xs text-gray-500 mt-1">Awaiting admin decision</div>
          </div>
          
          <div 
            className="bg-white border-radius-15 p-6 text-center border border-gray-200 rounded-lg transition-all hover:border-blue-400 hover:shadow-lg cursor-pointer"
            onClick={clearAllFilters}
          >
            <div className="text-2xl font-bold text-blue-600 my-2">{stats.totalScans}</div>
            <div className="text-sm text-gray-600 font-medium">Total Scans</div>
            <div className="text-xs text-gray-500 mt-1">All processed matches</div>
          </div>
          
          <div 
            className="bg-white border-radius-15 p-6 text-center border border-gray-200 rounded-lg transition-all hover:border-green-400 hover:shadow-lg cursor-pointer"
            onClick={() => handleStatsCardClick('status', 'confirmed')}
          >
            <div className="text-2xl font-bold text-green-600 my-2">{stats.confirmedMatches}</div>
            <div className="text-sm text-gray-600 font-medium">Confirmed Matches</div>
            <div className="text-xs text-gray-500 mt-1">Successfully verified</div>
          </div>
          
          <div 
            className="bg-white border-radius-15 p-6 text-center border border-gray-200 rounded-lg transition-all hover:border-red-400 hover:shadow-lg cursor-pointer"
            onClick={() => handleStatsCardClick('status', 'rejected')}
          >
            <div className="text-2xl font-bold text-red-600 my-2">{stats.falsePositives}</div>
            <div className="text-sm text-gray-600 font-medium">False Positives</div>
            <div className="text-xs text-gray-500 mt-1">Rejected matches</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="mb-4">
            <input
              type="text"
              className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal"
              placeholder="🔍 Search by name, match ID, or case ID..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 justify-end items-center">
            <select
              className="p-3 border rounded-lg w-full md:w-auto focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              className="p-3 border rounded-lg w-full md:w-auto focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal"
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
              className="p-3 border rounded-lg w-full md:w-auto focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal"
              value={filters.dateStart}
              onChange={(e) => handleFilterChange('dateStart', e.target.value)}
              placeholder="From date"
            />
            
            <button
              className="bg-findthem-darkGreen text-white p-3 rounded-lg hover:bg-findthem-teal disabled:opacity-50 transition-colors w-full md:w-auto"
              onClick={applyFilters}
            >
              Apply Filters
            </button>

            <button
              className="bg-gray-300 text-gray-700 p-3 rounded-lg hover:bg-gray-400 w-full md:w-auto transition-colors"
              onClick={clearAllFilters}
            >
              Clear All
            </button>
          </div>
        </div>

        {/* AI Matches Table */}
        <div id="ai-matches-table" className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b bg-gradient-to-br from-findthem-teal via-findthem-teal to-findthem-darkGreen text-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xl font-bold">AI Facial Recognition Matches</div>
              </div>
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedMatches.length > 0 && (
            <div className="p-4 bg-findthem-light border-b flex justify-between items-center">
              <div className="font-semibold">
                {selectedMatches.length} matches selected
              </div>
              <div className="flex space-x-3">
              
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                  onClick={() => bulkStatusChange('confirmed')}
                  disabled={loading}
                >
                  Change to Confirmed
                </button>
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                  onClick={() => bulkStatusChange('rejected')}
                  disabled={loading}
                >
                  Change to Rejected
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedMatches.length === currentMatches.length && currentMatches.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-findthem-teal focus:ring-findthem-teal"
                    />
                  </th>
                  <th className="p-4 text-left">Original Case</th>
                  <th className="p-4 text-left">Matched Case</th>
                  <th className="p-4 text-left">Confidence</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-findthem-teal mr-3"></div>
                        Loading matches...
                      </div>
                    </td>
                  </tr>
                ) : currentMatches.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500">
                      <svg className="h-12 w-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4.343 15.657l9.9-9.9a2.121 2.121 0 013 3l-9.9 9.9a2.121 2.121 0 01-3-3z"></path>
                      </svg>
                      <p className="text-lg font-medium">No AI matches found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {Object.values(filters).some(f => f) 
                          ? 'No matches found matching your criteria.' 
                          : 'Matches will appear here when the AI finds potential facial recognition matches'
                        }
                      </p>
                    </td>
                  </tr>
                ) : (
                  currentMatches.map((match) => (
                    <tr key={match.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedMatches.includes(match.id)}
                          onChange={() => handleSelectMatch(match.id)}
                          className="rounded border-gray-300 text-findthem-teal focus:ring-findthem-teal"
                        />
                      </td>
                      
                      {/* Original Case */}
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={match.original_case_details?.photo || '/default-avatar.png'} 
                            alt={match.original_case_details?.full_name || 'Unknown'} 
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                            onError={(e) => { e.target.src = '/default-avatar.png'; }}
                          />
                          <div className="min-w-0 flex-1">
                            <button
                              onClick={() => handleCaseClick(match.original_case)}
                              className="font-medium text-findthem-teal hover:text-findthem-darkGreen hover:underline transition-colors text-left"
                            >
                              {match.original_case_details?.full_name || 'Unknown'}
                            </button>
                            <div className="text-sm text-blue-600">
                              ID: {match.original_case} • {match.original_case_details?.status || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Matched Case */}
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={match.matched_case_details?.photo || '/default-avatar.png'} 
                            alt={match.matched_case_details?.full_name || 'Unknown'} 
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                            onError={(e) => { e.target.src = '/default-avatar.png'; }}
                          />
                          <div className="min-w-0 flex-1">
                            <button
                              onClick={() => handleCaseClick(match.matched_case)}
                              className="font-medium text-findthem-teal hover:text-findthem-darkGreen hover:underline transition-colors text-left"
                            >
                              {match.matched_case_details?.full_name || 'Unknown'}
                            </button>
                            <div className="text-sm text-green-600">
                              ID: {match.matched_case} • {match.matched_case_details?.status || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Confidence */}
                      <td className="p-4">
                        <div className="w-20">
                          <div className={`font-bold mb-1 ${getConfidenceTextColor(match.confidence_score)}`}>
                            {match.confidence_score ? `${Math.round(match.confidence_score)}%` : 'N/A'}
                          </div>
                          <div className="h-2 rounded-full overflow-hidden bg-gray-200 relative">
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
                          {match.status}
                        </span>
                      </td>
                      
                      {/* Date */}
                      <td className="p-4 text-gray-600 text-sm">
                        {match.processing_date_formatted || formatDate(match.processing_date) || 'N/A'}
                      </td>
                      
                      {/* Actions */}
                      <td className="p-4">
                        <div className="flex space-x-1">
                          <button 
                            className="bg-findthem-teal text-white p-2 rounded-lg hover:bg-findthem-darkGreen transition-all text-xs" 
                            onClick={() => viewMatch(match.id)} 
                            title="View Details"
                            disabled={loading}
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                          </button>
                          {match.status === 'pending' && (
                            <>
                              <button 
                                className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-all text-xs" 
                                onClick={() => confirmMatch(match.id, match.original_case_details?.full_name)} 
                                title="Confirm Match"
                                disabled={loading}
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                              </button>
                              <button 
                                className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-all text-xs" 
                                onClick={() => rejectMatch(match.id, match.original_case_details?.full_name)} 
                                title="Reject Match"
                                disabled={loading}
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                              </button>
                            </>
                          )}
                          {match.status === 'confirmed' && (
                            <span className="text-green-600 text-xs font-medium px-2 py-1">
                              ✓ Confirmed
                            </span>
                          )}
                          {match.status === 'rejected' && (
                            <span className="text-red-600 text-xs font-medium px-2 py-1">
                              ✗ Rejected
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                {/* Pagination Info */}
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredMatches.length)} of {filteredMatches.length} matches
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center space-x-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {getPageNumbers().map((page, index) => (
                      <button
                        key={index}
                        onClick={() => typeof page === 'number' && handlePageChange(page)}
                        disabled={page === '...' || page === currentPage}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          page === currentPage
                            ? 'bg-findthem-teal text-white'
                            : page === '...'
                            ? 'text-gray-400 cursor-default'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>

              {/* Quick Jump (for large datasets) */}
              {totalPages > 10 && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-600">Jump to page:</span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= totalPages) {
                          handlePageChange(page);
                        }
                      }}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal"
                    />
                    <span className="text-gray-600">of {totalPages}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 border-t bg-red-50">
              <div className="text-red-700 text-sm flex items-center">
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
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl transform transition-all animate-in zoom-in duration-200">
              
              {/* Header */}
              <div className="bg-findthem-bg rounded-t-2xl p-6 text-center relative">
                <button
                  onClick={closeViewMatchDialog}
                  className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <h3 className="text-xl font-bold text-white mb-2">
                  AI Match Details
                </h3>
                <p className="text-findthem-light">
                  Match ID: #{viewMatchDialog.matchData.id}
                </p>
              </div>
              
              {/* Content */}
              <div className="p-6">
                {/* Photos Section */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {/* Original Case */}
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-3 rounded-2xl overflow-hidden border-4 border-blue-200 shadow-lg">
                      <img
                        src={viewMatchDialog.matchData.original_case_details?.photo || '/default-avatar.png'}
                        alt={viewMatchDialog.matchData.original_case_details?.full_name || 'Unknown'}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = '/default-avatar.png'; }}
                      />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">
                      {viewMatchDialog.matchData.original_case_details?.full_name || 'Unknown'}
                    </h4>
                    <p className="text-sm text-blue-600 font-medium">
                      Original Case #{viewMatchDialog.matchData.original_case}
                    </p>
                  </div>

                  {/* Matched Case */}
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-3 rounded-2xl overflow-hidden border-4 border-green-200 shadow-lg">
                      <img
                        src={viewMatchDialog.matchData.matched_case_details?.photo || '/default-avatar.png'}
                        alt={viewMatchDialog.matchData.matched_case_details?.full_name || 'Unknown'}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = '/default-avatar.png'; }}
                      />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">
                      {viewMatchDialog.matchData.matched_case_details?.full_name || 'Unknown'}
                    </h4>
                    <p className="text-sm text-green-600 font-medium">
                      Matched Case #{viewMatchDialog.matchData.matched_case}
                    </p>
                  </div>
                </div>

                {/* Confidence Section */}
                <div className="text-center mb-6">
                  <div className="bg-gray-50 rounded-xl p-6 border">
                    <h5 className="text-sm font-medium text-gray-600 mb-2">Confidence Score</h5>
                    <div className={`text-4xl font-bold mb-3 ${getConfidenceTextColor(viewMatchDialog.matchData.confidence_score)}`}>
                      {viewMatchDialog.matchData.confidence_score ? `${Math.round(viewMatchDialog.matchData.confidence_score)}%` : 'N/A'}
                    </div>
                    <div className="w-full max-w-xs mx-auto">
                      <div className="h-3 rounded-full overflow-hidden bg-gray-200 relative">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${getConfidenceColor(viewMatchDialog.matchData.confidence_score || 0)}`}
                          style={{ width: `${viewMatchDialog.matchData.confidence_score || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {viewMatchDialog.matchData.confidence_score >= 90 ? 'High Confidence' : 
                       viewMatchDialog.matchData.confidence_score >= 45 ? 'Medium Confidence' : 'Low Confidence'}
                    </p>
                  </div>
                </div>

    

                {/* Action Buttons */}
                <div className="flex justify-center mt-6 space-x-3">
                  <button
                    onClick={closeViewMatchDialog}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleCaseClick(viewMatchDialog.matchData.original_case)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    View Original Case
                  </button>
                  <button
                    onClick={() => handleCaseClick(viewMatchDialog.matchData.matched_case)}
                    className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
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