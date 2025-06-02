import React, { useState, useEffect } from 'react';
import API from '../api.js'; 
export default function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCases, setSelectedCases] = useState(new Set());
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    current_page: 1
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    gender: '',
    status: '',
    submission_status: '',
    age_min: '',
    age_max: ''
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    found: 0,
    investigating: 0
  });

  // Fetch cases from backend using the API
  const fetchCases = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await API.cases.fetchAll(page, filters);
      
      setCases(data.results || []);
      setPagination({
        count: data.count || 0,
        next: data.next,
        previous: data.previous,
        current_page: page
      });
      
      // Calculate stats
      const allCases = data.results || [];
      setStats({
        total: data.count || 0,
        active: allCases.filter(c => c.submission_status === 'active').length,
        found: allCases.filter(c => c.status === 'found').length,
        investigating: allCases.filter(c => c.status === 'under_investigation').length
      });
      
    } catch (err) {
      console.error('Error fetching cases:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchCases();
  }, []);

  // Apply filters
  const applyCasesFilters = () => {
    setSelectedCases(new Set());
    fetchCases(1); // Reset to first page when filtering
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle search input with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.search !== '') {
        applyCasesFilters();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [filters.search]);

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

  // Select all cases
  const toggleSelectAll = () => {
    if (selectedCases.size === cases.length) {
      setSelectedCases(new Set());
    } else {
      setSelectedCases(new Set(cases.map(c => c.id)));
    }
  };

  // Bulk status change using API
  const bulkCaseStatusChange = async (newStatus) => {
    if (selectedCases.size === 0) {
      alert('Please select cases first');
      return;
    }

    try {
      await API.cases.bulkUpdateStatus(Array.from(selectedCases), newStatus);
      setSelectedCases(new Set());
      fetchCases(pagination.current_page);
      alert(`Successfully updated ${selectedCases.size} cases`);
    } catch (err) {
      console.error('Error updating cases:', err);
      alert('Error updating cases');
    }
  };

  // Bulk submission status change using API
  const bulkCaseSubmissionChange = async (newStatus) => {
    if (selectedCases.size === 0) {
      alert('Please select cases first');
      return;
    }

    try {
      await API.cases.bulkUpdateSubmissionStatus(Array.from(selectedCases), newStatus);
      setSelectedCases(new Set());
      fetchCases(pagination.current_page);
      alert(`Successfully updated ${selectedCases.size} cases`);
    } catch (err) {
      console.error('Error updating cases:', err);
      alert('Error updating cases');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'missing': return 'bg-red-100 text-red-800';
      case 'found': return 'bg-green-100 text-green-800';
      case 'under_investigation': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubmissionStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div id="cases-page" className="p-6">
      <div className="space-y-6">
        {/* Search and Filter Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="mb-4">
            <input
              type="text"
              className="w-full p-4 border rounded-lg"
              placeholder="🔍 Search by name, location, reporter, or case ID..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <select 
              className="p-3 border rounded-lg" 
              value={filters.gender}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <select 
              className="p-3 border rounded-lg"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="missing">Missing</option>
              <option value="found">Found</option>
              <option value="under_investigation">Investigating</option>
            </select>
            <select 
              className="p-3 border rounded-lg"
              value={filters.submission_status}
              onChange={(e) => handleFilterChange('submission_status', e.target.value)}
            >
              <option value="">Status</option>
              <option value="active">Active</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
              <option value="rejected">Rejected</option>
            </select>
            <input
              type="number"
              className="p-3 border rounded-lg"
              placeholder="Min Age"
              value={filters.age_min}
              onChange={(e) => handleFilterChange('age_min', e.target.value)}
            />
            <input
              type="number"
              className="p-3 border rounded-lg"
              placeholder="Max Age"
              value={filters.age_max}
              onChange={(e) => handleFilterChange('age_max', e.target.value)}
            />
            <button
              className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              onClick={applyCasesFilters}
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
          <div className="p-4 border-b flex justify-between items-center">
            <div className="text-lg font-semibold">Missing Persons Cases</div>
            <div className="flex space-x-6 text-sm">
              <span>Total: <strong>{stats.total}</strong></span>
              <span>Active: <strong>{stats.active}</strong></span>
              <span>Found: <strong>{stats.found}</strong></span>
              <span>Investigating: <strong>{stats.investigating}</strong></span>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedCases.size > 0 && (
            <div className="p-4 bg-blue-50 border-b flex justify-between items-center">
              <div className="font-semibold">
                {selectedCases.size} cases selected
              </div>
              <div className="flex space-x-3">
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  onClick={() => bulkCaseStatusChange('found')}
                >
                  Mark as Found
                </button>
                <button
                  className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                  onClick={() => bulkCaseStatusChange('under_investigation')}
                >
                  Mark as Investigating
                </button>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  onClick={() => bulkCaseSubmissionChange('active')}
                >
                  Set Active
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={cases.length > 0 && selectedCases.size === cases.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-4 text-left">Photo</th>
                  <th className="p-4 text-left">ID</th>
                  <th className="p-4 text-left">Full Name</th>
                  <th className="p-4 text-left">Age</th>
                  <th className="p-4 text-left">Gender</th>
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
                    <td colSpan="12" className="p-8 text-center text-gray-500">
                      Loading cases...
                    </td>
                  </tr>
                ) : cases.length === 0 ? (
                  <tr>
                    <td colSpan="12" className="p-8 text-center text-gray-500">
                      No cases found
                    </td>
                  </tr>
                ) : (
                  cases.map((case_item) => (
                    <tr key={case_item.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedCases.has(case_item.id)}
                          onChange={() => toggleCaseSelection(case_item.id)}
                        />
                      </td>
                      <td className="p-4">
                        <img
                          src={case_item.photo}
                          alt={case_item.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            e.target.src = '/api/placeholder/48/48';
                          }}
                        />
                      </td>
                      <td className="p-4 font-mono text-sm">{case_item.id}</td>
                      <td className="p-4 font-medium">{case_item.full_name}</td>
                      <td className="p-4">{case_item.current_age}</td>
                      <td className="p-4">{case_item.gender}</td>
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
                      <td className="p-4">{case_item.last_seen_location}</td>
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
          {pagination.count > 0 && (
            <div className="p-4 border-t flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {cases.length} of {pagination.count} cases
              </div>
              <div className="flex space-x-2">
                <button
                  className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                  disabled={!pagination.previous || loading}
                  onClick={() => fetchCases(pagination.current_page - 1)}
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm">
                  Page {pagination.current_page}
                </span>
                <button
                  className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                  disabled={!pagination.next || loading}
                  onClick={() => fetchCases(pagination.current_page + 1)}
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