import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../api.js'; 

export default function Cases() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allCases, setAllCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCases, setSelectedCases] = useState(new Set());
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [currentBackendPage, setCurrentBackendPage] = useState(1);
  
  // Custom Dialog State
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: 'info', // 'success', 'error', 'warning', 'confirm'
    title: '',
    message: '',
    onConfirm: null,
    showCancel: false,
    confirmText: 'OK',
    cancelText: 'Cancel'
  });

  // Helper function to show dialog
  const showDialog = (type, title, message, onConfirm = null, showCancel = false, confirmText = 'OK', cancelText = 'Cancel') => {
    setDialog({
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

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  // Frontend pagination state (5 cases per page)
  const [currentPage, setCurrentPage] = useState(1);
  const CASES_PER_PAGE = 5;
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    gender: '',
    status: '',
    submission_status: '',
    age_min: '',
    age_max: ''
  });

  // Stats from backend
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    in_progress: 0,
    missing: 0,
    investigating: 0,
    found: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / CASES_PER_PAGE);
  const startIndex = (currentPage - 1) * CASES_PER_PAGE;
  const endIndex = startIndex + CASES_PER_PAGE;
  const displayedCases = allCases.slice(startIndex, endIndex);

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

  // Read URL parameters and set initial filters
  useEffect(() => {
    console.log('📖 Reading URL parameters...');
    const urlFilters = {
      search: searchParams.get('search') || '',
      gender: searchParams.get('gender') || '',
      status: searchParams.get('status') || '',
      submission_status: searchParams.get('submission_status') || '',
      age_min: searchParams.get('age_min') || '',
      age_max: searchParams.get('age_max') || ''
    };

    console.log('🔗 URL Filters found:', urlFilters);

    const hasUrlFilters = Object.values(urlFilters).some(value => value !== '');
    
    if (hasUrlFilters) {
      console.log('✅ Applying URL filters:', urlFilters);
      setFilters(urlFilters);
    }
  }, [searchParams]);

  // Reset to first page when filters change and clear selections
  useEffect(() => {
    setCurrentPage(1);
    setSelectedCases(new Set());
  }, [totalCount]);

  // Fetch dashboard stats from the dedicated endpoint - FIXED API CONNECTION
// Fixed fetchDashboardStats function for Cases.jsx
const fetchDashboardStats = async () => {
  setStatsLoading(true);
  try {
    console.log('🔄 Fetching dashboard stats...');
    const data = await API.dashboard.fetchDashboardStats();
    
    console.log('📊 Dashboard stats received:', data);
    
    // FIXED: Use the correct field names that Django actually returns
    setStats({
      total: data.total_cases || 0,
      active: data.active_cases || 0,              // ✅ This field exists in Django response
      in_progress: data.pending_cases || 0,        // ✅ This field exists in Django response  
      missing: data.missing_cases || 0,            // ✅ Add this to Django (see Django fix above)
      investigating: data.investigating_cases || 0, // ✅ Add this to Django (see Django fix above)
      found: data.found_cases || 0                 // ✅ This field exists in Django response
    });
    
    console.log('✅ Stats updated:', {
      total: data.total_cases || 0,
      active: data.active_cases || 0,
      in_progress: data.pending_cases || 0,
      missing: data.missing_cases || 0,
      investigating: data.investigating_cases || 0,
      found: data.found_cases || 0,
      raw_api_response: data
    });
  } catch (err) {
    console.error('❌ Error fetching dashboard stats:', err);
    console.log('📝 Using fallback stats calculation...');
    
    // Enhanced fallback: calculate from current cases if available
    if (allCases.length > 0) {
      const total = allCases.length;
      const found = allCases.filter(c => c.status === 'found').length;
      const missing = allCases.filter(c => c.status === 'missing').length;
      const investigating = allCases.filter(c => c.status === 'under_investigation').length;
      const active = allCases.filter(c => c.submission_status === 'active').length;
      const inProgress = allCases.filter(c => c.submission_status === 'in_progress').length;
      
      console.log('📊 Calculated stats from local cases:', {
        total, found, missing, investigating, active, inProgress
      });
      
      setStats({
        total,
        missing,
        investigating,
        found,
        active,
        in_progress: inProgress
      });
    } else {
      // Try to fetch some cases to calculate stats
      try {
        const casesData = await API.cases.fetchAll(1, {});
        const cases = casesData.results || [];
        
        if (cases.length > 0) {
          const total = casesData.count || cases.length;
          const found = cases.filter(c => c.status === 'found').length;
          const missing = cases.filter(c => c.status === 'missing').length;
          const investigating = cases.filter(c => c.status === 'under_investigation').length;
          const active = cases.filter(c => c.submission_status === 'active').length;
          const inProgress = cases.filter(c => c.submission_status === 'in_progress').length;
          
          console.log('📊 Calculated stats from API cases:', {
            total, found, missing, investigating, active, inProgress, sample_case: cases[0]
          });
          
          setStats({
            total,
            missing,
            investigating,
            found,
            active,
            in_progress: inProgress
          });
        }
      } catch (casesErr) {
        console.error('❌ Error fetching cases for stats calculation:', casesErr);
      }
    }
  } finally {
    setStatsLoading(false);
  }
};

  // Fetch cases from backend
  const fetchCasesFromBackend = async (backendPage, appendToExisting = false) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🚀 FETCHING - Page: ${backendPage}, Append: ${appendToExisting}`);
      console.log('📊 FILTERS BEING SENT:', JSON.stringify(filters, null, 2));
      
      const data = await API.cases.fetchAll(backendPage, filters);
      
      console.log(`✅ RECEIVED ${data.results?.length} cases from backend`);
      console.log('📋 SAMPLE CASE:', data.results?.[0]);
      console.log('🔢 TOTAL COUNT:', data.count);
      
      if (appendToExisting) {
        setAllCases(prev => {
          const newCases = [...prev, ...(data.results || [])];
          console.log(`📈 Total cases after append: ${newCases.length}`);
          return newCases;
        });
      } else {
        setAllCases(data.results || []);
        console.log(`📝 Set all cases to ${data.results?.length} cases`);
      }
      
      setTotalCount(data.count || 0);
      setHasNextPage(!!data.next);
      setCurrentBackendPage(backendPage);
      
    } catch (err) {
      console.error('❌ Error fetching cases:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    console.log('🚀 Initial load - fetching first page and stats');
    setAllCases([]);
    setCurrentPage(1);
    setCurrentBackendPage(1);
    
    Promise.all([
      fetchCasesFromBackend(1, false),
      fetchDashboardStats()
    ]).then(() => {
      console.log('✅ Initial data loading complete');
    }).catch(err => {
      console.error('❌ Error in initial data loading:', err);
    });
  }, [filters]);

  // Handle page change with smooth scrolling
  const handlePageChange = async (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      console.log(`Changing to page ${newPage}`);
      
      const requiredCases = newPage * CASES_PER_PAGE;
      console.log(`Required cases: ${requiredCases}, Current cases: ${allCases.length}`);
      
      if (allCases.length < requiredCases && hasNextPage) {
        console.log('Need to fetch more data from backend');
        await fetchCasesFromBackend(currentBackendPage + 1, true);
      }
      
      setCurrentPage(newPage);
      setSelectedCases(new Set());
      
      document.getElementById('cases-table')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle filter changes - filters apply automatically without Apply button
  const handleFilterChange = (key, value) => {
    console.log(`Filter changed: ${key} = ${value}`);
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [key]: value
      };
      console.log('New filters state:', newFilters);
      return newFilters;
    });
  };

  // Navigate to case detail
  const handleCaseClick = (caseId) => {
    navigate(`/cases/${caseId}`);
  };

  // Navigate to filtered cases
  const handleStatsCardClick = (filterType, filterValue) => {
    console.log(`📊 Stats card clicked: ${filterType} = ${filterValue}`);
    
    const newFilters = {
      search: '',
      gender: '',
      status: '',
      submission_status: '',
      age_min: '',
      age_max: ''
    };

    if (filterType === 'submission_status') {
      newFilters.submission_status = filterValue;
    } else if (filterType === 'status') {
      newFilters.status = filterValue;
    }

    setFilters(newFilters);
    setSelectedCases(new Set());
    setCurrentPage(1);
    setAllCases([]);
    setCurrentBackendPage(1);
  };

  // Clear all filters
  const clearAllFilters = () => {
    console.log('🧹 Clearing all filters');
    const emptyFilters = {
      search: '',
      gender: '',
      status: '',
      submission_status: '',
      age_min: '',
      age_max: ''
    };
    setFilters(emptyFilters);
    setSearchParams(new URLSearchParams());
  };

  // Toggle case selection
  const toggleCaseSelection = (caseId) => {
    const newSelection = new Set(selectedCases);
    if (newSelection.has(caseId)) {
      newSelection.delete(caseId);
    } else {
      newSelection.add(caseId);
    }
    setSelectedCases(newSelection);
  };

  // Select all cases (only displayed ones)
  const toggleSelectAll = () => {
    if (selectedCases.size === displayedCases.length && displayedCases.length > 0) {
      setSelectedCases(new Set());
    } else {
      setSelectedCases(new Set(displayedCases.map(c => c.id)));
    }
  };

  // Bulk case status change - Updated with dialog
  const bulkCaseStatusChange = async (newStatus) => {
    if (selectedCases.size === 0) {
      showDialog('warning', 'No Cases Selected', 'Please select cases first.');
      return;
    }

    const statusText = {
      'found': 'Found',
      'under_investigation': 'Investigating', 
      'missing': 'Missing'
    };

    showDialog(
      'confirm',
      'Confirm Status Change',
      `Change case status to "${statusText[newStatus]}" for ${selectedCases.size} selected cases?`,
      async () => {
        closeDialog();
        try {
          setLoading(true);
          await API.cases.bulkUpdateStatus(Array.from(selectedCases), newStatus);
          setSelectedCases(new Set());
          
          setAllCases([]);
          setCurrentPage(1);
          setCurrentBackendPage(1);
          await Promise.all([
            fetchCasesFromBackend(1, false),
            fetchDashboardStats()
          ]);
          
          showDialog('success', 'Status Updated!', `Successfully updated ${selectedCases.size} cases to ${statusText[newStatus]}.`);
        } catch (err) {
          console.error('Error updating cases:', err);
          showDialog('error', 'Update Failed', 'Error updating case status. Please try again.');
        } finally {
          setLoading(false);
        }
      },
      true,
      'Update',
      'Cancel'
    );
  };

  // Bulk submission status change - Updated with dialog
  const bulkCaseSubmissionChange = async (newStatus) => {
    if (selectedCases.size === 0) {
      showDialog('warning', 'No Cases Selected', 'Please select cases first.');
      return;
    }

    const statusText = {
      'active': 'Active',
      'in_progress': 'In Progress',
      'closed': 'Closed',
      'rejected': 'Rejected'
    };

    showDialog(
      'confirm',
      'Confirm Submission Status Change',
      `Change submission status to "${statusText[newStatus]}" for ${selectedCases.size} selected cases?`,
      async () => {
        closeDialog();
        try {
          setLoading(true);
          await API.cases.bulkUpdateSubmissionStatus(Array.from(selectedCases), newStatus);
          setSelectedCases(new Set());
          
          setAllCases([]);
          setCurrentPage(1);
          setCurrentBackendPage(1);
          await Promise.all([
            fetchCasesFromBackend(1, false),
            fetchDashboardStats()
          ]);
          
          showDialog('success', 'Status Updated!', `Successfully updated ${selectedCases.size} cases to ${statusText[newStatus]}.`);
        } catch (err) {
          console.error('Error updating cases:', err);
          showDialog('error', 'Update Failed', 'Error updating submission status. Please try again.');
        } finally {
          setLoading(false);
        }
      },
      true,
      'Update',
      'Cancel'
    );
  };

  // Bulk delete cases function - Updated with dialog
  const bulkDeleteCases = async () => {
    if (selectedCases.size === 0) {
      showDialog('warning', 'No Cases Selected', 'Please select cases first.');
      return;
    }

    showDialog(
      'warning',
      'Delete Cases',
      `⚠️ Are you sure you want to permanently delete ${selectedCases.size} selected cases? This action cannot be undone.`,
      async () => {
        closeDialog();
        try {
          setLoading(true);
          await API.cases.bulkDelete(Array.from(selectedCases));
          setSelectedCases(new Set());
          
          setAllCases([]);
          setCurrentPage(1);
          setCurrentBackendPage(1);
          await Promise.all([
            fetchCasesFromBackend(1, false),
            fetchDashboardStats()
          ]);
          
          showDialog('success', 'Cases Deleted!', `Successfully deleted ${selectedCases.size} cases.`);
        } catch (err) {
          console.error('Error deleting cases:', err);
          showDialog('error', 'Delete Failed', 'Error deleting cases. Please try again.');
        } finally {
          setLoading(false);
        }
      },
      true,
      'Delete',
      'Cancel'
    );
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate days missing
  const calculateDaysMissing = (lastSeenDate) => {
    if (!lastSeenDate) return 'N/A';
    
    const lastSeen = new Date(lastSeenDate);
    const today = new Date();
    const diffTime = Math.abs(today - lastSeen);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Get status badge colors - UPDATED COLORS
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'missing': return 'bg-red-100 text-red-800';
      case 'found': return 'bg-green-100 text-green-800'; // Like found color
      case 'under_investigation': return 'bg-yellow-100 text-yellow-800'; // Like investigating color
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // UPDATED submission status colors
  const getSubmissionStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800'; // Red background like missing
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'; // Yellow like investigating
      case 'closed': return 'bg-green-100 text-green-800'; // Green like found
      case 'rejected': return 'bg-gray-100 text-gray-800'; // Grey
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  console.log(`Render: Page ${currentPage}/${totalPages}, Displaying ${displayedCases.length} cases, Total: ${allCases.length}`);

  return (
    <div id="cases-page" className="p-6">
      <div className="space-y-6">
        {/* Stats Cards - Updated to Case Status Focus */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            className="bg-white border-radius-15 p-6 text-center border border-gray-200 rounded-lg transition-all hover:border-blue-400 hover:shadow-lg cursor-pointer"
            onClick={clearAllFilters}
          >
            <div className="text-2xl font-bold text-blue-600 my-2">
              {statsLoading ? '...' : stats.total}
            </div>
            <div className="text-sm text-gray-600 font-medium">All Cases</div>
            <div className="text-xs text-gray-500 mt-1">Total cases reported</div>
          </div>
          
          <div 
            className="bg-white border-radius-15 p-6 text-center border border-gray-200 rounded-lg transition-all hover:border-red-400 hover:shadow-lg cursor-pointer"
            onClick={() => handleStatsCardClick('status', 'missing')}
          >
            <div className="text-2xl font-bold text-red-600 my-2">
              {statsLoading ? '...' : stats.missing}
            </div>
            <div className="text-sm text-gray-600 font-medium">Missing Cases</div>
            <div className="text-xs text-gray-500 mt-1">Still searching</div>
          </div>
          
          <div 
            className="bg-white border-radius-15 p-6 text-center border border-gray-200 rounded-lg transition-all hover:border-yellow-400 hover:shadow-lg cursor-pointer"
            onClick={() => handleStatsCardClick('status', 'under_investigation')}
          >
            <div className="text-2xl font-bold text-yellow-600 my-2">
              {statsLoading ? '...' : stats.investigating}
            </div>
            <div className="text-sm text-gray-600 font-medium">Investigating Cases</div>
            <div className="text-xs text-gray-500 mt-1">Under investigation</div>
          </div>
          
          <div 
            className="bg-white border-radius-15 p-6 text-center border border-gray-200 rounded-lg transition-all hover:border-green-400 hover:shadow-lg cursor-pointer"
            onClick={() => handleStatsCardClick('status', 'found')}
          >
            <div className="text-2xl font-bold text-green-600 my-2">
              {statsLoading ? '...' : stats.found}
            </div>
            <div className="text-sm text-gray-600 font-medium">Found Cases</div>
            <div className="text-xs text-gray-500 mt-1">Successfully resolved</div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="mb-4">
            <input
              type="text"
              className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal"
              placeholder="Search by name, location, or case ID..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <select 
              className="p-3 border rounded-lg focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal" 
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Status</option>
              <option value="missing">Missing</option>
              <option value="found">Found</option>
              <option value="under_investigation">Investigating</option>
            </select>
            <select 
              className="p-3 border rounded-lg focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal"
              value={filters.submission_status}
              onChange={(e) => handleFilterChange('submission_status', e.target.value)}
            >
              <option value="">Type</option>
              <option value="active">Active</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
            </select>
            <select 
              className="p-3 border rounded-lg focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal"
              value={filters.gender}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <input
              type="number"
              className="p-3 border rounded-lg focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal"
              placeholder="Min Age"
              value={filters.age_min}
              onChange={(e) => handleFilterChange('age_min', e.target.value)}
            />
            <input
              type="number"
              className="p-3 border rounded-lg focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal"
              placeholder="Max Age"
              value={filters.age_max}
              onChange={(e) => handleFilterChange('age_max', e.target.value)}
            />
            <button
              className="bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 transition-colors"
              onClick={clearAllFilters}
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Cases Table */}
        <div id="cases-table" className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b bg-gradient-to-br from-findthem-teal via-findthem-teal to-findthem-darkGreen text-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xl font-bold">Cases Management</div>
              </div>
            </div>
          </div>

          {/* Updated Bulk Actions - Dropdowns + Delete */}
          {selectedCases.size > 0 && (
            <div className="p-4 bg-findthem-light border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="font-semibold">
                  {selectedCases.size} cases selected
                </div>
                
                <div className="flex flex-wrap gap-3 items-center">
                  {/* Case Status Dropdown - Clean Options */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Case Status:</label>
                    <select
                      className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal"
                      onChange={(e) => {
                        if (e.target.value) {
                          bulkCaseStatusChange(e.target.value);
                          e.target.value = ''; // Reset dropdown
                        }
                      }}
                      disabled={loading}
                    >
                      <option value="">Select Status</option>
                      <option value="missing">Missing</option>
                      <option value="under_investigation">Investigating</option>
                      <option value="found">Found</option>
                    </select>
                  </div>

                  {/* Submission Status Dropdown - Clean Options */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Submission Status:</label>
                    <select
                      className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal"
                      onChange={(e) => {
                        if (e.target.value) {
                          bulkCaseSubmissionChange(e.target.value);
                          e.target.value = ''; // Reset dropdown
                        }
                      }}
                      disabled={loading}
                    >
                      <option value="">Select Status</option>
                      <option value="active">Active</option>
                      <option value="in_progress">In Progress</option>
                      <option value="closed">Closed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Delete Cases Button */}
                  <button
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center gap-2 font-medium"
                    onClick={bulkDeleteCases}
                    disabled={loading}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Delete Cases
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Table - UPDATED COLUMNS */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={displayedCases.length > 0 && selectedCases.size === displayedCases.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-findthem-teal focus:ring-findthem-teal"
                    />
                  </th>
                  <th className="p-4 text-left">Photo</th>
                  <th className="p-4 text-left">Full Name</th>
                  <th className="p-4 text-left">Age</th>
                  <th className="p-4 text-left">Case Status</th>
                  <th className="p-4 text-left">Submission Status</th>
                  <th className="p-4 text-left">Last Seen Location</th>
                  <th className="p-4 text-left">Last Seen Date</th>
                  <th className="p-4 text-left">Days Missing</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-findthem-teal mr-3"></div>
                        Loading cases...
                      </div>
                    </td>
                  </tr>
                ) : displayedCases.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-gray-500">
                      <svg className="h-12 w-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                      </svg>
                      <p className="text-lg font-medium">No cases found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {Object.values(filters).some(f => f) 
                          ? 'No cases found matching your criteria.' 
                          : 'No cases have been submitted yet.'
                        }
                      </p>
                    </td>
                  </tr>
                ) : (
                  displayedCases.map((case_item) => (
                    <tr key={case_item.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedCases.has(case_item.id)}
                          onChange={() => toggleCaseSelection(case_item.id)}
                          className="rounded border-gray-300 text-findthem-teal focus:ring-findthem-teal"
                        />
                      </td>
                      <td className="p-4">
                        <img
                          src={case_item.photo}
                          alt={case_item.full_name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                          onError={(e) => {
                            e.target.src = '/api/placeholder/48/48';
                          }}
                        />
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleCaseClick(case_item.id)}
                          className="font-medium text-findthem-teal hover:text-findthem-darkGreen hover:underline transition-colors text-left"
                        >
                          {case_item.full_name}
                        </button>
                      </td>
                      <td className="p-4">{case_item.current_age}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(case_item.status)}`}>
                          {case_item.status === 'under_investigation' ? 'investigating' : case_item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSubmissionStatusColor(case_item.submission_status)}`}>
                          {case_item.submission_status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs truncate" title={case_item.last_seen_location}>
                        {case_item.last_seen_location}
                      </td>
                      <td className="p-4">{formatDate(case_item.last_seen_date)}</td>
                      <td className="p-4">{calculateDaysMissing(case_item.last_seen_date)} days</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Simplified Pagination - Only Next/Previous */}
          {totalPages > 1 && (
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalCount)} of {totalCount} cases
                </div>

                {/* Simple Navigation Controls */}
                <div className="flex items-center space-x-4">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>

                  {/* Current Page Info */}
                  <span className="text-sm text-gray-600 font-medium">
                    Page {currentPage} of {totalPages}
                  </span>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
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
      </div>
    </div>
  );
}