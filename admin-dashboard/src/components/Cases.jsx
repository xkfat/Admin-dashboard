import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api.js'; 

export default function Cases() {
  const navigate = useNavigate();
  const [allCases, setAllCases] = useState([]); // All fetched cases
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

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / CASES_PER_PAGE);
  const startIndex = (currentPage - 1) * CASES_PER_PAGE;
  const endIndex = startIndex + CASES_PER_PAGE;
  const displayedCases = allCases.slice(startIndex, endIndex);

  // Fetch cases from backend
  const fetchCasesFromBackend = async (backendPage, appendToExisting = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await API.cases.fetchAll(backendPage, filters);
      
      if (appendToExisting) {
        setAllCases(prev => {
          const newCases = [...prev, ...(data.results || [])];
          return newCases;
        });
      } else {
        setAllCases(data.results || []);
      }
      
      setTotalCount(data.count || 0);
      setHasNextPage(!!data.next);
      setCurrentBackendPage(backendPage);
      
      // Calculate stats from ALL data (not just current page)
      calculateStats(data.results || [], data.count || 0);
      
    } catch (err) {
      console.error('Error fetching cases:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate comprehensive stats
  const calculateStats = async (currentResults, totalCount) => {
    try {
      // For accurate stats, we need to fetch all cases without pagination
      // or use a dedicated stats endpoint
      const allCasesData = await API.cases.fetchAll(1, { 
        ...filters, 
        // Remove pagination to get all results for stats
        page_size: 1000 // or use a dedicated stats endpoint
      });
      
      const allCases = allCasesData.results || [];
      
      setStats({
        total: allCasesData.count || totalCount,
        active: allCases.filter(c => c.submission_status === 'active').length,
        in_progress: allCases.filter(c => c.submission_status === 'in_progress').length,
        missing: allCases.filter(c => c.status === 'missing').length,
        investigating: allCases.filter(c => c.status === 'under_investigation').length,
        found: allCases.filter(c => c.status === 'found').length
      });
    } catch (err) {
      console.error('Error calculating stats:', err);
      // Fallback to current page data if full data fetch fails
      setStats({
        total: totalCount,
        active: currentResults.filter(c => c.submission_status === 'active').length,
        in_progress: currentResults.filter(c => c.submission_status === 'in_progress').length,
        missing: currentResults.filter(c => c.status === 'missing').length,
        investigating: currentResults.filter(c => c.status === 'under_investigation').length,
        found: currentResults.filter(c => c.status === 'found').length
      });
    }
  };

  // Load initial data
  useEffect(() => {
    setAllCases([]);
    setCurrentPage(1);
    setCurrentBackendPage(1);
    fetchCasesFromBackend(1, false);
  }, []);

  // Handle page change
  const handlePageChange = async (newPage) => {
    const requiredCases = newPage * CASES_PER_PAGE;
    
    // Check if we need to fetch more data
    if (allCases.length < requiredCases && hasNextPage) {
      await fetchCasesFromBackend(currentBackendPage + 1, true);
    }
    
    setCurrentPage(newPage);
  };

  // Apply filters
  const applyFilters = () => {
    setSelectedCases(new Set());
    setCurrentPage(1);
    setAllCases([]);
    setCurrentBackendPage(1);
    fetchCasesFromBackend(1, false);
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
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
    // Only apply if filters have actual values (not initial empty state)
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
    // Update filters and apply them
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
    
    // Apply the filter
    setTimeout(() => {
      fetchCasesFromBackend(1, false);
    }, 100);
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
      
      // Refresh data
      setAllCases([]);
      setCurrentPage(1);
      setCurrentBackendPage(1);
      fetchCasesFromBackend(1, false);
      
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
      
      // Refresh data
      setAllCases([]);
      setCurrentPage(1);
      setCurrentBackendPage(1);
      fetchCasesFromBackend(1, false);
      
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

  return (
    <div id="cases-page" className="p-6">
      <div className="space-y-6">
        {/* Stats Cards - Connected to Backend */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            className="bg-white border-radius-15 p-6 text-center border border-gray-200 rounded-lg transition-all hover:border-findthem-teal hover:shadow-lg cursor-pointer"
            onClick={() => handleStatsCardClick('submission_status', 'active')}
          >
            <div className="text-2xl font-bold text-findthem-teal my-2">
              {loading ? '...' : stats.active}
            </div>
            <div className="text-sm text-gray-600 font-medium">Active Cases</div>
            <div className="text-xs text-gray-500 mt-1">Submission status: Active</div>
          </div>
          
          <div 
            className="bg-white border-radius-15 p-6 text-center border border-gray-200 rounded-lg transition-all hover:border-orange-400 hover:shadow-lg cursor-pointer"
            onClick={() => handleStatsCardClick('submission_status', 'in_progress')}
          >
            <div className="text-2xl font-bold text-orange-600 my-2">
              {loading ? '...' : stats.in_progress}
            </div>
            <div className="text-sm text-gray-600 font-medium">In Progress</div>
            <div className="text-xs text-gray-500 mt-1">Currently being processed</div>
          </div>
          
          <div 
            className="bg-white border-radius-15 p-6 text-center border border-gray-200 rounded-lg transition-all hover:border-red-400 hover:shadow-lg cursor-pointer"
            onClick={() => handleStatsCardClick('status', 'missing')}
          >
            <div className="text-2xl font-bold text-red-600 my-2">
              {loading ? '...' : stats.missing}
            </div>
            <div className="text-sm text-gray-600 font-medium">Missing Cases</div>
            <div className="text-xs text-gray-500 mt-1">Still searching</div>
          </div>
          
          <div 
            className="bg-white border-radius-15 p-6 text-center border border-gray-200 rounded-lg transition-all hover:border-yellow-400 hover:shadow-lg cursor-pointer"
            onClick={() => handleStatsCardClick('status', 'under_investigation')}
          >
            <div className="text-2xl font-bold text-yellow-600 my-2">
              {loading ? '...' : stats.investigating}
            </div>
            <div className="text-sm text-gray-600 font-medium">Investigating</div>
            <div className="text-xs text-gray-500 mt-1">Under investigation</div>
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
              className="bg-findthem-darkGreen text-white p-3 rounded-lg hover:bg-findthem-teal disabled:opacity-50 transition-colors"
              onClick={applyFilters}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Apply Filters'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        )}

        {/* Cases Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <div className="text-lg font-semibold">Missing Persons Cases</div>
            <div className="text-sm text-gray-500">
              Showing {displayedCases.length} of {totalCount} cases
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
                      No cases found
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

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="p-4 border-t flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {displayedCases.length} of {totalCount} cases
                <span className="ml-2">
                  (Page {currentPage} of {totalPages})
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={currentPage <= 1 || loading}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm bg-gray-100 rounded">
                  Page {currentPage}
                </span>
                <button
                  className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}