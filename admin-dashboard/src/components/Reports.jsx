import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, AlertTriangle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../api';

// Reusable Dialog Component - No decorative line
const CustomDialog = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info',
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
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          {/* Icon */}
          <div className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg`}>
            <IconComponent className={`h-8 w-8 ${config.iconColor}`} />
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-2">
            {title}
          </h3>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 text-center leading-relaxed mb-6">
            {message}
          </p>
          
          {/* Action Buttons */}
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
      </div>
    </div>
  );
};

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReports, setSelectedReports] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [casesCache, setCasesCache] = useState({});
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage] = useState(5);
  
  // Dialog states
  const [showNoReportsDialog, setShowNoReportsDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Custom dialog state for alerts
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
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateStart: '',
    caseFilter: ''
  });

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    verified: 0,
    false: 0,
    unverified: 0
  });

  // Calculate pagination info
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
  const startIndex = (currentPage - 1) * reportsPerPage;
  const endIndex = startIndex + reportsPerPage;
  const currentReports = filteredReports.slice(startIndex, endIndex);

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

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedReports([]);
  }, [filteredReports.length]);

  // Handle page changes
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setSelectedReports([]);
      document.getElementById('reports-table')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Get today's date in YYYY-MM-DD format for max date
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Read URL parameters and set initial filters
  useEffect(() => {
    console.log('Reading URL parameters for reports...');
    const urlFilters = {
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || '',
      dateStart: searchParams.get('dateStart') || '',
      caseFilter: searchParams.get('case_id') || ''
    };

    console.log('URL Filters found:', urlFilters);

    const hasUrlFilters = Object.values(urlFilters).some(value => value !== '');
    
    if (hasUrlFilters) {
      console.log('Applying URL filters:', urlFilters);
      setFilters(urlFilters);
    }
  }, [searchParams]);

  // Fetch reports on component mount
  useEffect(() => {
    fetchReports();
  }, []);

  // Apply filters whenever filter states change or reports data changes
  useEffect(() => {
    applyFilters();
  }, [reports, filters]);

  // Check for empty case filter results and show dialog
  useEffect(() => {
    if (filters.caseFilter && reports.length > 0) {
      const caseReports = reports.filter(report => 
        report.missing_person?.toString() === filters.caseFilter.toString()
      );
      
      if (caseReports.length === 0) {
        setDialogMessage(`There are no reports for Case #${filters.caseFilter}`);
        setShowNoReportsDialog(true);
        handleFilterChange('caseFilter', '');
      }
    }
  }, [reports, filters.caseFilter]);

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

  // Handle filter changes - Auto apply filters
  const handleFilterChange = (key, value) => {
    console.log(`Filter changed: ${key} = ${value}`);
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle stat card clicks to filter reports
  const handleStatsCardClick = (statusFilter) => {
    console.log(`Stats card clicked for status: ${statusFilter}`);
    
    const newFilters = {
      search: '',
      status: statusFilter,
      dateStart: '',
      caseFilter: ''
    };

    setFilters(newFilters);
    setSelectedReports([]);
    
    const newSearchParams = new URLSearchParams();
    if (statusFilter) {
      newSearchParams.set('status', statusFilter);
    }
    setSearchParams(newSearchParams);
  };

  const applyFilters = () => {
    let filtered = [...reports];

    if (filters.search) {
      filtered = filtered.filter(report =>
        report.reporter?.toLowerCase().includes(filters.search.toLowerCase()) ||
        report.missing_person_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        report.missing_person?.toString().includes(filters.search.toLowerCase()) ||
        report.note?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.status) {
      filtered = filtered.filter(report => report.report_status === filters.status);
    }

    // Fixed date filtering
    if (filters.dateStart) {
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.date_submitted);
        const filterDate = new Date(filters.dateStart);
        // Reset time to start of day for accurate comparison
        reportDate.setHours(0, 0, 0, 0);
        filterDate.setHours(0, 0, 0, 0);
        return reportDate >= filterDate;
      });
    }

    if (filters.caseFilter) {
      filtered = filtered.filter(report => 
        report.missing_person?.toString() === filters.caseFilter.toString()
      );
    }

    setFilteredReports(filtered);
    
    const newSearchParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        if (key === 'caseFilter') {
          newSearchParams.set('case_id', value);
        } else {
          newSearchParams.set(key, value);
        }
      }
    });
    setSearchParams(newSearchParams);
  };

  // Clear all filters
  const clearAllFilters = () => {
    console.log('Clearing all filters');
    const emptyFilters = {
      search: '',
      status: '',
      dateStart: '',
      caseFilter: ''
    };
    setFilters(emptyFilters);
    setSearchParams(new URLSearchParams());
  };

  const handleSelectAll = () => {
    if (selectedReports.length === currentReports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(currentReports.map(report => report.id));
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
      showCustomDialog(
        'warning',
        'No Reports Selected',
        'Please select reports to update before proceeding.'
      );
      return;
    }

    showCustomDialog(
      'confirm',
      'Confirm Bulk Update',
      `Are you sure you want to update ${selectedReports.length} selected reports to "${newStatus}" status?`,
      async () => {
        closeCustomDialog();
        
        try {
          setLoading(true);
          await API.reports.bulkUpdateStatus(selectedReports, newStatus);
          
          const updatedReports = reports.map(report => {
            if (selectedReports.includes(report.id)) {
              return { ...report, report_status: newStatus };
            }
            return report;
          });
          
          setReports(updatedReports);
          calculateStats(updatedReports);
          setSelectedReports([]);
          
          showCustomDialog(
            'success',
            'Update Successful',
            `Successfully updated ${selectedReports.length} reports to "${newStatus}" status.`
          );
        } catch (err) {
          console.error('Error updating reports:', err);
          showCustomDialog(
            'error',
            'Update Failed',
            'Failed to update reports. Please check your connection and try again.'
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

  const handleSingleStatusChange = async (reportId, newStatus) => {
    try {
      await API.reports.updateStatus(reportId, newStatus);
      
      const updatedReports = reports.map(report => {
        if (report.id === reportId) {
          return { ...report, report_status: newStatus };
        }
        return report;
      });
      
      setReports(updatedReports);
      calculateStats(updatedReports);
      
      showCustomDialog(
        'success',
        'Status Updated',
        `Report #${reportId} has been successfully updated to "${newStatus}" status.`
      );
    } catch (err) {
      console.error('Error updating report:', err);
      showCustomDialog(
        'error',
        'Update Failed',
        `Failed to update report #${reportId}. Please try again.`
      );
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

  // Note Dialog with FindThem colors
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
              <X className="w-6 h-6" />
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
              className="bg-findthem-teal text-white py-2 px-4 rounded-lg hover:bg-findthem-darkGreen transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Simple No Reports Dialog
  const NoReportsDialog = () => {
    if (!showNoReportsDialog) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-findthem-button" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="w-full bg-findthem-teal text-white py-2 px-4 rounded-lg hover:bg-findthem-darkGreen transition-colors"
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            className="bg-white border-radius-15 p-6 text-center border border-gray-200 rounded-lg transition-all hover:border-blue-400 hover:shadow-lg cursor-pointer"
            onClick={() => handleStatsCardClick('new')}
          >
            <div className="text-2xl font-bold text-blue-600 my-2">{stats.new}</div>
            <div className="text-sm text-gray-600 font-medium">New Reports</div>
            <div className="text-xs text-gray-500 mt-1">Awaiting review</div>
          </div>
          
          <div 
            className="bg-white border-radius-15 p-6 text-center border border-gray-200 rounded-lg transition-all hover:border-green-400 hover:shadow-lg cursor-pointer"
            onClick={() => handleStatsCardClick('verified')}
          >
            <div className="text-2xl font-bold text-green-600 my-2">{stats.verified}</div>
            <div className="text-sm text-gray-600 font-medium">Verified Reports</div>
            <div className="text-xs text-gray-500 mt-1">Confirmed as valid</div>
          </div>
          
          <div 
            className="bg-white border-radius-15 p-6 text-center border border-gray-200 rounded-lg transition-all hover:border-yellow-400 hover:shadow-lg cursor-pointer"
            onClick={() => handleStatsCardClick('unverified')}
          >
            <div className="text-2xl font-bold text-yellow-600 my-2">{stats.unverified}</div>
            <div className="text-sm text-gray-600 font-medium">Unverified Reports</div>
            <div className="text-xs text-gray-500 mt-1">Need verification</div>
          </div>
          
          <div 
            className="bg-white border-radius-15 p-6 text-center border border-gray-200 rounded-lg transition-all hover:border-red-400 hover:shadow-lg cursor-pointer"
            onClick={() => handleStatsCardClick('false')}
          >
            <div className="text-2xl font-bold text-red-600 my-2">{stats.false}</div>
            <div className="text-sm text-gray-600 font-medium">False Reports</div>
            <div className="text-xs text-gray-500 mt-1">Marked as false</div>
          </div>
        </div>

        {/* Search and Filters - Auto-applying */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="mb-4">
            <input
              type="text"
              className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal"
              placeholder="Search by missing person, reporter, or report ID"
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
              <option value="new">New</option>
              <option value="verified">Verified</option>
              <option value="false">False</option>
              <option value="unverified">Unverified</option>
            </select>

            <input
              type="date"
              className="p-3 border rounded-lg w-full md:w-auto focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal"
              value={filters.dateStart}
              onChange={(e) => handleFilterChange('dateStart', e.target.value)}
              max={getTodayDate()}
              placeholder="From date"
            />

            <button
              className="bg-gray-300 text-gray-700 p-3 rounded-lg hover:bg-gray-400 w-full md:w-auto transition-colors"
              onClick={clearAllFilters}
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Reports Table - No ID column */}
        <div id="reports-table" className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b bg-gradient-to-br from-findthem-teal via-findthem-teal to-findthem-darkGreen text-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xl font-bold">Reports Management</div>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedReports.length > 0 && (
            <div className="p-4 bg-findthem-light border-b flex justify-between items-center">
              <div className="font-semibold">
                {selectedReports.length} reports selected
              </div>
              <div className="flex space-x-3">
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                  onClick={() => handleBulkStatusChange('verified')}
                  disabled={loading}
                >
                  Mark as Verified
                </button>
                <button
                  className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
                  onClick={() => handleBulkStatusChange('unverified')}
                  disabled={loading}
                >
                  Mark as Unverified
                </button>
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                  onClick={() => handleBulkStatusChange('false')}
                  disabled={loading}
                >
                  Mark as False
                </button>
              </div>
            </div>
          )}

          {/* Table - No ID column, changed Actions to Details */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedReports.length === currentReports.length && currentReports.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-findthem-teal focus:ring-findthem-teal"
                    />
                  </th>
                  <th className="p-4 text-left">Reporter</th>
                  <th className="p-4 text-left">Missing Person</th>
                  <th className="p-4 text-left">Report Status</th>
                  <th className="p-4 text-left">Note Preview</th>
                  <th className="p-4 text-left">Date Submitted</th>
                  <th className="p-4 text-left">Details</th>
                </tr>
              </thead>
              <tbody>
                {currentReports.map((report) => (
                  <tr key={report.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report.id)}
                        onChange={() => handleSelectReport(report.id)}
                        className="rounded border-gray-300 text-findthem-teal focus:ring-findthem-teal"
                      />
                    </td>
                    <td className="p-4">{report.reporter || 'Anonymous'}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleCaseClick(report.missing_person)}
                        className="text-findthem-teal hover:text-findthem-darkGreen hover:underline cursor-pointer font-medium transition-colors"
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
                        className="bg-findthem-teal text-white px-3 py-1 rounded text-sm hover:bg-findthem-darkGreen transition-colors"
                      >
                        View Note
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredReports.length === 0 && !showNoReportsDialog && (
            <div className="p-8 text-center text-gray-500">
              <svg className="h-12 w-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <p className="text-lg font-medium">
                {filters.status ? 
                  `No ${filters.status} reports found.` : 
                  'No reports found.'
                }
              </p>
            </div>
          )}

          {/* Simple Pagination - Only Previous/Next */}
          {totalPages > 1 && (
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                {/* Pagination Info */}
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredReports.length)} of {filteredReports.length} reports
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

        {/* No Reports Dialog */}
        <NoReportsDialog />

        {/* Note Dialog */}
        <NoteDialog />
      </div>
    </div>
  );
}