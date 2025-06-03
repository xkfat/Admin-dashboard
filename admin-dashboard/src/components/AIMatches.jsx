import React, { useState, useEffect } from 'react';
import API from '../api'; // Adjust the import path as needed

export default function AIMatches() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState('');
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState({
    pendingReviews: 0,
    scansToday: 0,
    confirmedMatches: 0,
    falsePositives: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch AI matches and stats on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    fetchMatches();
  }, [searchTerm, statusFilter, confidenceFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both matches and stats in parallel
      const [matchesData, statsData] = await Promise.all([
        API.aiMatches.fetchAll(),
        API.aiMatches.getStats()
      ]);
      
      setMatches(matchesData);
      setStats({
        pendingReviews: statsData.pending_reviews || 0,
        scansToday: statsData.scans_today || 0,
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

  const fetchMatches = async () => {
    try {
      const filters = {};
      
      if (searchTerm.trim()) filters.search = searchTerm.trim();
      if (statusFilter) filters.status = statusFilter;
      if (confidenceFilter) filters.confidence = confidenceFilter;

      const data = await API.aiMatches.fetchAll(filters);
      setMatches(data);
    } catch (err) {
      console.error('Error fetching filtered matches:', err);
      setError('Failed to filter matches. Please try again.');
    }
  };

  const viewMatch = async (matchId) => {
    try {
      const matchData = await API.aiMatches.getById(matchId);
      // You can open a modal or navigate to a detailed view here
      alert(`Viewing detailed match information for AI match #${matchId}`);
      console.log('Match details:', matchData);
    } catch (err) {
      console.error('Error viewing match:', err);
      alert('Failed to load match details. Please try again.');
    }
  };

  const confirmMatch = async (matchId, originalCaseName) => {
    if (window.confirm(`Are you sure you want to confirm this match for ${originalCaseName}? This will mark the original case as "Found".`)) {
      try {
        setLoading(true);
        const response = await API.aiMatches.confirm(matchId, 'Confirmed via admin dashboard');
        
        alert(response.message || `Match confirmed! Case will be marked as found.`);
        
        // Refresh the data to show updated status
        await fetchData();
      } catch (err) {
        console.error('Error confirming match:', err);
        alert('Failed to confirm match. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const rejectMatch = async (matchId, originalCaseName) => {
    if (window.confirm(`Are you sure you want to reject this match for ${originalCaseName}? This will be marked as a false positive.`)) {
      try {
        setLoading(true);
        const response = await API.aiMatches.reject(matchId, 'Rejected via admin dashboard');
        
        alert(response.message || `Match rejected and marked as false positive.`);
        
        // Refresh the data to show updated status
        await fetchData();
      } catch (err) {
        console.error('Error rejecting match:', err);
        alert('Failed to reject match. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (confidence >= 70) return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  };

  const getConfidenceTextColor = (confidence) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
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
        return 'bg-findthem-button-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && matches.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-findthem-button-600 mx-auto"></div>
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
    <div className="p-6 space-y-6">
      {/* AI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border-radius-15 p-6 text-center border border-gray-200 rounded-lg transition-all hover:border-indigo-400 hover:shadow-lg">
          <div className="text-2xl font-bold text-purple-600 my-2">{stats.pendingReviews}</div>
          <div className="text-sm text-gray-600 font-medium">Pending Reviews</div>
          <div className="text-xs text-gray-500 mt-1">Awaiting admin decision</div>
        </div>
        
        <div className="bg-white border-radius-15 p-6 text-center border border-gray-200 rounded-lg transition-all hover:border-indigo-400 hover:shadow-lg">
          <div className="text-2xl font-bold text-blue-600 my-2">{stats.scansToday}</div>
          <div className="text-sm text-gray-600 font-medium">Scans Today</div>
          <div className="text-xs text-gray-500 mt-1">New cases processed</div>
        </div>
        
        <div className="bg-white border-radius-15 p-6 text-center border border-gray-200 rounded-lg transition-all hover:border-indigo-400 hover:shadow-lg">
          <div className="text-2xl font-bold text-green-600 my-2">{stats.confirmedMatches}</div>
          <div className="text-sm text-gray-600 font-medium">Confirmed Matches</div>
          <div className="text-xs text-gray-500 mt-1">Successfully verified</div>
        </div>
        
        <div className="bg-white border-radius-15 p-6 text-center border border-gray-200 rounded-lg transition-all hover:border-indigo-400 hover:shadow-lg">
          <div className="text-2xl font-bold text-red-600 my-2">{stats.falsePositives}</div>
          <div className="text-sm text-gray-600 font-medium">False Positives</div>
          <div className="text-xs text-gray-500 mt-1">Rejected matches</div>
        </div>
      </div>

      {/* AI Matches List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4.343 15.657l9.9-9.9a2.121 2.121 0 013 3l-9.9 9.9a2.121 2.121 0 01-3-3z"></path>
            </svg>
            <h2 className="text-xl font-bold">AI Facial Recognition</h2>
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
          </div>
        </div>

        <div className="p-6">
          {/* Search and Filter */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <input 
                type="text" 
                className="flex-1 p-3 border rounded-lg" 
                placeholder="🔍 Search matches by name or case ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select 
                className="p-3 border rounded-lg" 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value=""> Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="rejected">Rejected</option>
                <option value="under_review">Under Review</option>
              </select>
              <select 
                className="p-3 border rounded-lg"
                value={confidenceFilter}
                onChange={(e) => setConfidenceFilter(e.target.value)}
              >
                <option value="">All Confidence</option>
                <option value="high">High (90%+)</option>
                <option value="medium">Medium (70-89%)</option>
                <option value="low">Low (&lt;70%)</option>
              </select>
            </div>
          </div>

          {/* Matches Table Header */}
          <div className="grid grid-cols-12 gap-4 py-3 px-4 bg-gray-50 rounded-lg font-medium text-gray-700 text-sm mb-4">
            <div className="col-span-3">ORIGINAL CASE</div>
            <div className="col-span-3">MATCHED CASE</div>
            <div className="col-span-2">CONFIDENCE</div>
            <div className="col-span-1">STATUS</div>
            <div className="col-span-1">DATE</div>
            <div className="col-span-2">ACTIONS</div>
          </div>

          {/* Matches List */}
          <div className="space-y-4">
            {matches.length === 0 ? (
              <div className="text-center py-12">
                <svg className="h-12 w-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4.343 15.657l9.9-9.9a2.121 2.121 0 013 3l-9.9 9.9a2.121 2.121 0 01-3-3z"></path>
                </svg>
                <p className="text-gray-500 text-lg">No AI matches found</p>
                <p className="text-gray-400 text-sm">Matches will appear here when the AI finds potential facial recognition matches</p>
              </div>
            ) : (
              matches.map((match) => (
                <div key={match.id} className="bg-white rounded-lg border border-gray-200 p-4 mb-3 transition-all hover:border-indigo-400 hover:shadow-lg">
                  <div className="grid grid-cols-12 gap-3 items-center min-h-[80px]">
                    {/* Original Case */}
                    <div className="col-span-3 flex items-center space-x-3 border-l-4 border-blue-500 pl-3">
                      <img 
                        src={match.original_case_details?.photo || '/default-avatar.png'} 
                        alt={match.original_case_details?.full_name || 'Unknown'} 
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                        onError={(e) => { e.target.src = '/default-avatar.png'; }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 truncate">
                          {match.original_case_details?.full_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-blue-600 truncate">
                          ID: {match.original_case} • {match.original_case_details?.status || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          Age: {match.original_case_details?.age || 'N/A'} • {match.original_case_details?.gender || 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Matched Case */}
                    <div className="col-span-3 flex items-center space-x-3">
                      <img 
                        src={match.matched_case_details?.photo || '/default-avatar.png'} 
                        alt={match.matched_case_details?.full_name || 'Unknown'} 
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                        onError={(e) => { e.target.src = '/default-avatar.png'; }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 truncate">
                          {match.matched_case_details?.full_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-green-600 truncate">
                          ID: {match.matched_case} • {match.matched_case_details?.status || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          Age: {match.matched_case_details?.age || 'N/A'} • {match.matched_case_details?.gender || 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Confidence */}
                    <div className="col-span-2">
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
                    
                    {/* Status */}
                    <div className="col-span-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(match.status)}`}>
                        {match.status}
                      </span>
                    </div>
                    
                    {/* Date */}
                    <div className="col-span-1 text-gray-600 text-sm">
                      {match.processing_date_formatted || 'N/A'}
                    </div>
                    
                    {/* Actions */}
                    <div className="col-span-2 flex space-x-1">
                      <button 
                        className="bg-findthem-button-500 text-white p-2 rounded-lg hover:bg-findthem-button-600 transition-all" 
                        onClick={() => viewMatch(match.id)} 
                        title="View Details"
                        disabled={loading}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                      </button>
                      {match.status === 'pending' && (
                        <>
                          <button 
                            className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-all" 
                            onClick={() => confirmMatch(match.id, match.original_case_details?.full_name)} 
                            title="Confirm Match"
                            disabled={loading}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </button>
                          <button 
                            className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-all" 
                            onClick={() => rejectMatch(match.id, match.original_case_details?.full_name)} 
                            title="Reject Match"
                            disabled={loading}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </>
                      )}
                      {match.status === 'confirmed' && (
                        <span className="text-green-600 text-sm font-medium px-2 py-1">
                          ✓ Confirmed
                        </span>
                      )}
                      {match.status === 'rejected' && (
                        <span className="text-red-600 text-sm font-medium px-2 py-1">
                          ✗ Rejected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Load More Button */}
          {matches.length > 0 && (
            <div className="text-center mt-6">
              <button 
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50"
                onClick={fetchData}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Refresh Matches'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}