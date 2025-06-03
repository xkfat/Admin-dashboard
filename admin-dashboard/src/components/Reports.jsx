import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../api'; // Adjust the import path according to your project structure

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReports, setSelectedReports] = useState([]);
  const [searchParams] = useSearchParams(); // Add this to read URL parameters
  const navigate = useNavigate(); // Add navigation hook
  const [casesCache, setCasesCache] = useState({}); // Cache for case details
  
  // Dialog state for no reports message
  const [showNoReportsDialog, setShowNoReportsDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  
  // Dialog state for viewing full note
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [caseFilter, setCaseFilter] = useState(''); // NEW: Case ID filter

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    verified: 0,
    false: 0,
    unverified: 0
  });

  // Fetch reports on component mount
  useEffect(() => {
    fetchReports();
  }, []);

  // Handle URL parameters and apply initial filters
  useEffect(() => {
    const statusParam = searchParams.get('status');
    const caseIdParam = searchParams.get('case_id'); // NEW: Read case_id parameter
    
    if (statusParam === 'unverified') {
      setStatusFilter('unverified');
    }
    
    // NEW: Set case filter if case_id is in URL
    if (caseIdParam) {
      setCaseFilter(caseIdParam);
    }
  }, [searchParams]);

  // Apply filters whenever filter states change or reports data changes
  useEffect(() => {
    applyFilters();
  }, [reports, searchTerm, statusFilter, dateStart, caseFilter]); // Removed reporterFilter

  // Check for empty case filter results and show dialog
  useEffect(() => {
    if (caseFilter && reports.length > 0) {
      const caseReports = reports.filter(report => 
        report.missing_person?.toString() === caseFilter.toString()
      );
      
      if (caseReports.length === 0) {
        setDialogMessage(`There are no reports for Case #${caseFilter}`);
        setShowNoReportsDialog(true);
        // Clear the case filter to prevent the blue box from showing
        setCaseFilter('');
      }
    }
  }, [reports, caseFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await API.reports.fetchAll();
      
      // Fetch case details for each unique case ID
      const uniqueCaseIds = [...new Set(data.map(report => report.missing_person))];
      const casePromises = uniqueCaseIds.map(async (caseId) => {
        try {
          const caseData = await API.cases.getById(caseId);
          return { id: caseId, data: caseData };
        } catch (err) {
          console.error(`Error fetching case ${caseId}:`, err);
          return { id: caseId, data: null };
        }
      });
      
      const caseResults = await Promise.all(casePromises);
      const newCasesCache = {};
      caseResults.forEach(result => {
        newCasesCache[result.id] = result.data;
      });
      setCasesCache(newCasesCache);
      
      // Add missing person names to reports
      const reportsWithNames = data.map(report => ({
        ...report,
        missing_person_name: newCasesCache[report.missing_person]?.full_name || null
      }));
      
      setReports(reportsWithNames);
      calculateStats(reportsWithNames);
    } catch (err) {
      setError('Failed to fetch reports');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (reportsData) => {
    const stats = {
      total: reportsData.length,
      new: reportsData.filter(r => r.report_status === 'new').length,
      verified: reportsData.filter(r => r.report_status === 'verified').length,
      false: reportsData.filter(r => r.report_status === 'false').length,
      unverified: reportsData.filter(r => r.report_status === 'unverified').length
    };
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...reports];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.reporter?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.missing_person_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.missing_person?.toString().includes(searchTerm.toLowerCase()) ||
        report.note?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(report => report.report_status === statusFilter);
    }

    // Date filter
    if (dateStart) {
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.date_submitted);
        const filterDate = new Date(dateStart);
        return reportDate >= filterDate;
      });
    }

    // NEW: Case filter - Filter by specific case ID
    if (caseFilter) {
      filtered = filtered.filter(report => 
        report.missing_person?.toString() === caseFilter.toString()
      );
    }

    setFilteredReports(filtered);
  };

  // Add a function to clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setDateStart('');
    setCaseFilter(''); // NEW: Clear case filter
  };

  const handleSelectAll = () => {
    if (selectedReports.length === filteredReports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(filteredReports.map(report => report.id));
    }
  };

  const handleSelectReport = (reportId) => {
    setSelectedReports(prev => {
      if (prev.includes(reportId)) {
        return prev.filter(id => id !== reportId);
      } else {
        return [...prev, reportId];
      }
    });
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedReports.length === 0) {
      alert('Please select reports to update');
      return;
    }

    try {
      setLoading(true);
      await API.reports.bulkUpdateStatus(selectedReports, newStatus);
      
      // Update local state
      const updatedReports = reports.map(report => {
        if (selectedReports.includes(report.id)) {
          return { ...report, report_status: newStatus };
        }
        return report;
      });
      
      setReports(updatedReports);
      calculateStats(updatedReports);
      setSelectedReports([]);
      
      alert(`Successfully updated ${selectedReports.length} reports to ${newStatus}`);
    } catch (err) {
      console.error('Error updating reports:', err);
      alert('Failed to update reports');
    } finally {
      setLoading(false);
    }
  };

  const handleSingleStatusChange = async (reportId, newStatus) => {
    try {
      await API.reports.updateStatus(reportId, newStatus);
      
      // Update local state
      const updatedReports = reports.map(report => {
        if (report.id === reportId) {
          return { ...report, report_status: newStatus };
        }
        return report;
      });
      
      setReports(updatedReports);
      calculateStats(updatedReports);
    } catch (err) {
      console.error('Error updating report:', err);
      alert('Failed to update report');
    }
  };

  // Function to navigate to case details
  const handleCaseClick = (caseId) => {
    navigate(`/cases/${caseId}`);
  };

  // Function to open note dialog
  const handleViewNote = (report) => {
    setSelectedReport(report);
    setShowNoteDialog(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'false':
        return 'bg-red-100 text-red-800';
      case 'unverified':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateNote = (note, maxLength = 50) => {
    if (!note) return 'No note provided';
    return note.length > maxLength ? `${note.substring(0, maxLength)}...` : note;
  };

  // Dialog component for viewing full note
  const NoteDialog = () => {
    if (!showNoteDialog || !selectedReport) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Report Note
            </h3>
            <button
              onClick={() => setShowNoteDialog(false)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border max-h-60 overflow-y-auto">
            <p className="text-gray-900 whitespace-pre-wrap">
              {selectedReport.note || 'No note provided'}
            </p>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setShowNoteDialog(false)}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Dialog component for no reports message
  const NoReportsDialog = () => {
    if (!showNoReportsDialog) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            No Reports Found
          </h3>
          <p className="text-gray-600 text-center mb-6">
            {dialogMessage}
          </p>
          <button
            onClick={() => setShowNoReportsDialog(false)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    );
  };

  if (loading && reports.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading reports...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* REMOVED: Header filter status box */}
        
      
       

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="mb-4">
            <input
              type="text"
              className="w-full p-4 border rounded-lg"
              placeholder="🔍 Search by reporter, missing person, or note content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              className="p-3 border rounded-lg"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Status</option>
              <option value="new">New</option>
              <option value="verified">Verified</option>
              <option value="false">False</option>
              <option value="unverified">Unverified</option>
            </select>
            
            {/* NEW: Case ID filter input */}
           
            
            <input
              type="date"
              className="p-3 border rounded-lg"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              placeholder="From date"
            />
            
            <button
              className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
              onClick={applyFilters}
            >
              Apply Filters
            </button>

            <button
              className="bg-gray-300 text-gray-700 p-3 rounded-lg hover:bg-gray-400"
              onClick={clearAllFilters}
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Statistics and Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Header */}
          <div className="p-6 border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-lg font-semibold">Reports Management</div>
              <div className="flex space-x-6 text-sm">
                <span>Total: <strong>{stats.total}</strong></span>
                <span>New: <strong>{stats.new}</strong></span>
                <span>Verified: <strong>{stats.verified}</strong></span>
                <span>False: <strong>{stats.false}</strong></span>
                <span>Unverified: <strong>{stats.unverified}</strong></span>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedReports.length > 0 && (
            <div className="p-4 bg-blue-50 border-b flex justify-between items-center">
              <div className="font-semibold">
                {selectedReports.length} reports selected
              </div>
              <div className="flex space-x-3">
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  onClick={() => handleBulkStatusChange('verified')}
                  disabled={loading}
                >
                  Mark as Verified
                </button>
                <button
                  className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                  onClick={() => handleBulkStatusChange('unverified')}
                  disabled={loading}
                >
                  Mark as Unverified
                </button>
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  onClick={() => handleBulkStatusChange('false')}
                  disabled={loading}
                >
                  Mark as False
                </button>
              </div>
            </div>
          )}

          {/* Table */}
       

                 <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedReports.length === filteredReports.length && filteredReports.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="p-4 text-left">ID</th>
                  <th className="p-4 text-left">Reporter</th>
                  <th className="p-4 text-left">Missing Person</th>
                  <th className="p-4 text-left">Report Status</th>
                  <th className="p-4 text-left">Note Preview</th>
                  <th className="p-4 text-left">Date Submitted</th>
                  <th className="p-4 text-left">View</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report.id)}
                        onChange={() => handleSelectReport(report.id)}
                      />
                    </td>
                    <td className="p-4">{report.id}</td>
                    <td className="p-4">{report.reporter || 'Anonymous'}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleCaseClick(report.missing_person)}
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                      >
                        {report.missing_person_name || `Case #${report.missing_person}`}
                      </button>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(report.report_status)}`}>
                        {report.report_status}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="truncate" title={report.note}>
                        {truncateNote(report.note)}
                      </div>
                    </td>
                    <td className="p-4">{formatDate(report.date_submitted)}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleViewNote(report)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReports.length === 0 && !showNoReportsDialog && (
            <div className="p-8 text-center text-gray-500">
              {statusFilter ? 
                `No ${statusFilter} reports found.` : 
                'No reports found matching your criteria.'
              }
            </div>
          )}
        </div>

        {/* No Reports Dialog */}
        <NoReportsDialog />

        {/* Note Dialog */}
        <NoteDialog />
      </div>
    </div>
  );
}