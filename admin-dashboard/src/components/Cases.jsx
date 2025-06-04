import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Add these imports
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

  // Generate page numbers for pagination (matching Reports style)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination
      if (currentPage <= 3) {
        // Show first 5 pages
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        if (totalPages > 5) {
          pages.push('...');
          pages.push(totalPages);
        }
      } else if (currentPage >= totalPages - 2) {
        // Show last 5 pages
        pages.push(1);
        if (totalPages > 5) {
          pages.push('...');
        }
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show pages around current page
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
    setSelectedCases(new Set()); // Clear selections when filters change
  }, [totalCount]);

  // Fetch dashboard stats from the dedicated endpoint
  const fetchDashboardStats = async () => {
    setStatsLoading(true);
    try {
      console.log('🔄 Fetching dashboard stats...');
      const data = await API.dashboard.fetchDashboardStats();
      
      console.log('📊 Dashboard stats received:', data);
      
      setStats({
        total: data.total_cases || 0,
        active: data.active_cases || 0,
        in_progress: data.pending_cases || 0,
        missing: data.total_cases - (data.found_cases || 0) || 0,
        investigating: 0,
        found: data.found_cases || 0
      });
      
      console.log('✅ Stats updated successfully');
    } catch (err) {
      console.error('❌ Error fetching dashboard stats:', err);
      console.log('📝 Using fallback stats calculation...');
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

  // Load initial data - Fetch both cases and stats
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
      
      // Check if we need to fetch more data
      if (allCases.length < requiredCases && hasNextPage) {
        console.log('Need to fetch more data from backend');
        await fetchCasesFromBackend(currentBackendPage + 1, true);
      }
      
      setCurrentPage(newPage);
      setSelectedCases(new Set()); // Clear selections when page changes
      
      // Scroll to top of cases table
      document.getElementById('cases-table')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Apply filters - Also refresh stats when filters change
  const applyFilters = async () => {
    console.log('🔍 APPLYING FILTERS - Current filters state:', filters);
    setSelectedCases(new Set());
    setCurrentPage(1);
    setAllCases([]);
    setCurrentBackendPage(1);
    
    // Update URL with current filters
    const newSearchParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value);
      }
    });
    setSearchParams(newSearchParams);
    
    // Fetch both filtered cases and updated stats
    await Promise.all([
      fetchCasesFromBackend(1, false),
      fetchDashboardStats()
    ]);
  };

  // Handle filter changes
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

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.search !== '') {
        applyFilters();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  // Handle other filter changes immediately
  useEffect(() => {
    if (filters.status || filters.submission_status || filters.gender || filters.age_min || filters.age_max) {
      applyFilters();
    }
  }, [filters.status, filters.submission_status, filters.gender, filters.age_min, filters.age_max]);

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

  // Bulk case status change
  const bulkCaseStatusChange = async (newStatus) => {
    if (selectedCases.size === 0) {
      alert('Please select cases first');
      return;
    }

    const statusText = {
      'found': 'Found',
      'under_investigation': 'Under Investigation', 
      'missing': 'Missing'
    };

    if (!confirm(`Change case status to "${statusText[newStatus]}" for ${selectedCases.size} selected cases?`)) {
      return;
    }

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
      
      alert(`Successfully updated ${selectedCases.size} cases to ${statusText[newStatus]}`);
    } catch (err) {
      console.error('Error updating cases:', err);
      alert('Error updating case status');
    } finally {
      setLoading(false);
    }
  };

  // Bulk submission status change
  const bulkCaseSubmissionChange = async (newStatus) => {
    if (selectedCases.size === 0) {
      alert('Please select cases first');
      return;
    }

    const statusText = {
      'active': 'Active',
      'in_progress': 'In Progress',
      'closed': 'Closed',
      'rejected': 'Rejected'
    };

    if (!confirm(`Change submission status to "${statusText[newStatus]}" for ${selectedCases.size} selected cases?`)) {
      return;
    }

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
      
      alert(`Successfully updated ${selectedCases.size} cases to ${statusText[newStatus]}`);
    } catch (err) {
      console.error('Error updating cases:', err);
      alert('Error updating submission status');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge colors
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'missing': return 'bg-red-100 text-red-800';
      case 'found': return 'bg-findthem-light text-findthem-darkGreen';
      case 'under_investigation': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubmissionStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-findthem-light text-findthem-teal';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  console.log(`Render: Page ${currentPage}/${totalPages}, Displaying ${displayedCases.length} cases, Total: ${allCases.length}`);

  return (
    <div id="cases-page" className="p-6">
      <div className="space-y-6">
        {/* Stats Cards - Connected to Real Backend Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            className="bg-white border-radius-15 p-6 text-center border border-gray-200 rounded-lg transition-all hover:border-findthem-teal hover:shadow-lg cursor-pointer"
            onClick={() => handleStatsCardClick('submission_status', 'active')}
          >
            <div className="text-2xl font-bold text-findthem-teal my-2">
              {statsLoading ? '...' : stats.active}
            </div>
            <div className="text-sm text-gray-600 font-medium">Active Cases</div>
            <div className="text-xs text-gray-500 mt-1">Submission status: Active</div>
          </div>
          
          <div 
            className="bg-white border-radius-15 p-6 text-center border border-gray-200 rounded-lg transition-all hover:border-orange-400 hover:shadow-lg cursor-pointer"
            onClick={() => handleStatsCardClick('submission_status', 'in_progress')}
          >
            <div className="text-2xl font-bold text-orange-600 my-2">
              {statsLoading ? '...' : stats.in_progress}
            </div>
            <div className="text-sm text-gray-600 font-medium">In Progress</div>
            <div className="text-xs text-gray-500 mt-1">Currently being processed</div>
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
              placeholder="🔍 Search by name, location, reporter, or case ID..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
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
              className="bg-findthem-darkGreen text-white p-3 rounded-lg hover:bg-findthem-teal disabled:opacity-50 transition-colors"
              onClick={applyFilters}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Apply Filters'}
            </button>
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

          {/* Bulk Actions */}
          {selectedCases.size > 0 && (
            <div className="p-4 bg-findthem-light border-b">
              <div className="font-semibold mb-3">
                {selectedCases.size} cases selected
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Case Status Actions */}
                <div className="bg-white rounded-lg p-3 border">
                  <div className="text-sm font-medium text-gray-700 mb-2">Change Case Status:</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="bg-findthem-darkGreen text-white px-3 py-1 rounded text-sm hover:bg-findthem-teal transition-colors"
                      onClick={() => bulkCaseStatusChange('found')}
                      disabled={loading}
                    >
                      Mark as Found
                    </button>
                    <button
                      className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                      onClick={() => bulkCaseStatusChange('under_investigation')}
                      disabled={loading}
                    >
                      Mark as Investigating
                    </button>
                    <button
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                      onClick={() => bulkCaseStatusChange('missing')}
                      disabled={loading}
                    >
                      Mark as Missing
                    </button>
                  </div>
                </div>

                {/* Submission Status Actions */}
                <div className="bg-white rounded-lg p-3 border">
                  <div className="text-sm font-medium text-gray-700 mb-2">Change Submission Status:</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="bg-findthem-teal text-white px-3 py-1 rounded text-sm hover:bg-findthem-darkGreen transition-colors"
                      onClick={() => bulkCaseSubmissionChange('active')}
                      disabled={loading}
                    >
                      Set Active
                    </button>
                    <button
                      className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition-colors"
                      onClick={() => bulkCaseSubmissionChange('in_progress')}
                      disabled={loading}
                    >
                      Set In Progress
                    </button>
                    <button
                      className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
                      onClick={() => bulkCaseSubmissionChange('closed')}
                      disabled={loading}
                    >
                      Set Closed
                    </button>
                    <button
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                      onClick={() => bulkCaseSubmissionChange('rejected')}
                      disabled={loading}
                    >
                      Set Rejected
                    </button>
                  </div>
                </div>
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
                  <th className="p-4 text-left">Days Missing</th>
                  <th className="p-4 text-left">Reporter</th>
                  <th className="p-4 text-left">Date Reported</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" className="p-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-findthem-teal mr-3"></div>
                        Loading cases...
                      </div>
                    </td>
                  </tr>
                ) : displayedCases.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="p-8 text-center text-gray-500">
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
                          {case_item.status.replace('_', ' ')}
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
                      <td className="p-4">{case_item.days_missing} days</td>
                      <td className="p-4">{case_item.reporter || 'Anonymous'}</td>
                      <td className="p-4">{formatDate(case_item.date_reported)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Enhanced Pagination - Matching Reports Style */}
          {totalPages > 1 && (
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                {/* Pagination Info */}
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalCount)} of {totalCount} cases
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
      </div>
    </div>
  );
}