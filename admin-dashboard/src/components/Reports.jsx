import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, AlertTriangle, X, ChevronLeft, ChevronRight, Filter, ChevronDown, ChevronUp, Search } from 'lucide-react';
import API from '../api';

// Reusable Dialog Component with dark theme
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
          iconColor: 'text-green-600 dark:text-green-500',
          iconBg: 'bg-green-100 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-700',
          buttonColor: 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600'
        };
      case 'error':
        return {
          icon: AlertCircle,
          iconColor: 'text-red-600 dark:text-red-500',
          iconBg: 'bg-red-100 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-700',
          buttonColor: 'bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600'
        };
      case 'warning':
      case 'confirm':
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-600 dark:text-yellow-500',
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
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
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          {/* Icon */}
          <div className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-gray-800 shadow-lg`}>
            <IconComponent className={`h-8 w-8 ${config.iconColor}`} />
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-2">
            {title}
          </h3>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 text-center leading-relaxed mb-6">
            {message}
          </p>
          
          {/* Action Buttons */}
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

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReports, setSelectedReports] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [casesCache, setCasesCache] = useState({});
  
  // Filter visibility state
  const [showFilters, setShowFilters] = useState(false);
  
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
      // Auto-expand filters if there are active filters from URL
      setShowFilters(true);
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

  // Check if any filters are active (excluding search)
  const hasActiveFilters = () => {
    return filters.status || filters.dateStart;
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
      'Change Status',
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
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400';
      case 'verified':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400';
      case 'false':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400';
      case 'unverified':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
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

  // Note Dialog with FindThem colors and dark theme
  const NoteDialog = () => {
    if (!showNoteDialog || !selectedReport) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Report Note
            </h3>
            <button
              onClick={() => setShowNoteDialog(false)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600 max-h-60 overflow-y-auto">
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
              {selectedReport.note || 'No note provided'}
            </p>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setShowNoteDialog(false)}
              className="bg-findthem-teal dark:bg-findthem-light text-white dark:text-gray-900 py-2 px-4 rounded-lg hover:bg-findthem-darkGreen dark:hover:bg-findthem-teal transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Simple No Reports Dialog with dark theme
  const NoReportsDialog = () => {
    if (!showNoReportsDialog) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border dark:border-gray-700">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-findthem-button dark:text-findthem-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
            No Reports Found
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
            {dialogMessage}
          </p>
          <button
            onClick={() => setShowNoReportsDialog(false)}
            className="w-full bg-findthem-teal dark:bg-findthem-light text-white dark:text-gray-900 py-2 px-4 rounded-lg hover:bg-findthem-darkGreen dark:hover:bg-findthem-teal transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    );
  };

  if (loading && reports.length === 0) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-300">Loading reports...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            className="bg-white dark:bg-gray-800 border-radius-15 p-6 text-center border border-gray-200 dark:border-gray-700 rounded-lg transition-all hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg cursor-pointer"
            onClick={() => handleStatsCardClick('new')}
          >
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-500 my-2">{stats.new}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">New Reports</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Awaiting review</div>
          </div>
          
          <div 
            className="bg-white dark:bg-gray-800 border-radius-15 p-6 text-center border border-gray-200 dark:border-gray-700 rounded-lg transition-all hover:border-green-400 dark:hover:border-green-500 hover:shadow-lg cursor-pointer"
            onClick={() => handleStatsCardClick('verified')}
          >
            <div className="text-2xl font-bold text-green-600 dark:text-green-500 my-2">{stats.verified}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">Verified Reports</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Confirmed as valid</div>
          </div>
          
          <div 
            className="bg-white dark:bg-gray-800 border-radius-15 p-6 text-center border border-gray-200 dark:border-gray-700 rounded-lg transition-all hover:border-yellow-400 dark:hover:border-yellow-500 hover:shadow-lg cursor-pointer"
            onClick={() => handleStatsCardClick('unverified')}
          >
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500 my-2">{stats.unverified}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">Unverified Reports</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Need verification</div>
          </div>
          
          <div 
            className="bg-white dark:bg-gray-800 border-radius-15 p-6 text-center border border-gray-200 dark:border-gray-700 rounded-lg transition-all hover:border-red-400 dark:hover:border-red-500 hover:shadow-lg cursor-pointer"
            onClick={() => handleStatsCardClick('false')}
          >
            <div className="text-2xl font-bold text-red-600 dark:text-red-500 my-2">{stats.false}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">False Reports</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Marked as false</div>
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
      placeholder="Search by missing person, reporter, or report ID"
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
                <span className="bg-findthem-lightteal dark:bg-findthem-teal text-white text-xs rounded-full px-2 py-0.5 ml-1">
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
                  <option value="new">New</option>
                  <option value="verified">Verified</option>
                  <option value="false">False</option>
                  <option value="unverified">Unverified</option>
                </select>

                <input
                  type="date"
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg w-full md:w-auto focus:ring-2 focus:ring-findthem-teal focus:border-findthem-teal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={filters.dateStart}
                  onChange={(e) => handleFilterChange('dateStart', e.target.value)}
                  max={getTodayDate()}
                  placeholder="From date"
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

        {/* Reports Table - No ID column */}
        <div id="reports-table" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
          <div className="p-6 border-b dark:border-gray-600 bg-gradient-to-br from-findthem-teal via-findthem-teal to-findthem-darkGreen text-white">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xl font-bold">Reports Management</div>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedReports.length > 0 && (
            <div className="p-4 bg-findthem-light dark:bg-findthem-teal/20 border-b dark:border-gray-600 flex justify-between items-center">
              <div className="font-semibold text-gray-900 dark:text-white">
                {selectedReports.length} reports selected
              </div>
              <div className="flex space-x-3">
                <button
                  className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                  onClick={() => handleBulkStatusChange('verified')}
                  disabled={loading}
                >
                  Mark as Verified
                </button>
                <button
                  className="bg-yellow-600 dark:bg-yellow-700 text-white px-4 py-2 rounded hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors"
                  onClick={() => handleBulkStatusChange('unverified')}
                  disabled={loading}
                >
                  Mark as Unverified
                </button>
                <button
                  className="bg-red-600 dark:bg-red-700 text-white px-4 py-2 rounded hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
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
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedReports.length === currentReports.length && currentReports.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600 text-findthem-teal focus:ring-findthem-teal dark:bg-gray-700"
                    />
                  </th>
                  <th className="p-4 text-left text-gray-900 dark:text-white">Reporter</th>
                  <th className="p-4 text-left text-gray-900 dark:text-white">Missing Person</th>
                  <th className="p-4 text-left text-gray-900 dark:text-white">Report Status</th>
                  <th className="p-4 text-left text-gray-900 dark:text-white">Note Preview</th>
                  <th className="p-4 text-left text-gray-900 dark:text-white">Date Submitted</th>
                  <th className="p-4 text-left text-gray-900 dark:text-white">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-findthem-teal mr-3"></div>
                        Loading reports...
                      </div>
                    </td>
                  </tr>
                ) : currentReports.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <svg className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      <p className="text-lg font-medium">
                        {filters.status ? 
                          `No ${filters.status} reports found.` : 
                          'No reports found.'
                        }
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        {Object.values(filters).some(f => f) 
                          ? 'No reports found matching your criteria.' 
                          : 'No reports have been submitted yet.'
                        }
                      </p>
                    </td>
                  </tr>
                ) : (
                  currentReports.map((report) => (
                    <tr key={report.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedReports.includes(report.id)}
                          onChange={() => handleSelectReport(report.id)}
                          className="rounded border-gray-300 dark:border-gray-600 text-findthem-teal focus:ring-findthem-teal dark:bg-gray-700"
                        />
                      </td>
                      <td className="p-4 text-gray-900 dark:text-white">{report.reporter || 'Anonymous'}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleCaseClick(report.missing_person)}
                          className="text-findthem-teal dark:text-findthem-light hover:text-findthem-darkGreen dark:hover:text-findthem-teal hover:underline cursor-pointer font-medium transition-colors"
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
                        <div className="truncate text-gray-900 dark:text-white" title={report.note}>
                          {truncateNote(report.note)}
                        </div>
                      </td>
                      <td className="p-4 text-gray-900 dark:text-white">{formatDate(report.date_submitted)}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleViewNote(report)}
                          className="bg-findthem-teal dark:bg-findthem-light text-white dark:text-gray-900 px-3 py-1 rounded text-sm hover:bg-findthem-darkGreen dark:hover:bg-findthem-teal transition-colors"
                        >
                          View Note
                        </button>
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
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredReports.length)} of {filteredReports.length} reports
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