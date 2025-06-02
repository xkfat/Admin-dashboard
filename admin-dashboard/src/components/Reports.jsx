import { useState, useEffect } from 'react';
import API from '../api'; // Adjust the import path according to your project structure

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReports, setSelectedReports] = useState([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reporterFilter, setReporterFilter] = useState('');
  const [dateStart, setDateStart] = useState('');

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

  // Apply filters whenever filter states change
  useEffect(() => {
    applyFilters();
  }, [reports, searchTerm, statusFilter, reporterFilter, dateStart]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await API.reports.fetchAll();
      setReports(data);
      calculateStats(data);
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
        report.missing_person?.toString().includes(searchTerm.toLowerCase()) ||
        report.note?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(report => report.report_status === statusFilter);
    }

    // Reporter type filter
    if (reporterFilter) {
      if (reporterFilter === 'authenticated') {
        filtered = filtered.filter(report => report.reporter && report.reporter !== 'Anonymous');
      } else if (reporterFilter === 'anonymous') {
        filtered = filtered.filter(report => !report.reporter || report.reporter === 'Anonymous');
      }
    }

    // Date filter
    if (dateStart) {
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.date_submitted);
        const filterDate = new Date(dateStart);
        return reportDate >= filterDate;
      });
    }

    setFilteredReports(filtered);
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
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              className="p-3 border rounded-lg"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="verified">Verified</option>
              <option value="false">False</option>
              <option value="unverified">Unverified</option>
            </select>
            
            <select
              className="p-3 border rounded-lg"
              value={reporterFilter}
              onChange={(e) => setReporterFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="authenticated">Authenticated</option>
              <option value="anonymous">Anonymous</option>
            </select>
            
            <input
              type="date"
              className="p-3 border rounded-lg"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
            
            <button
              className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
              onClick={applyFilters}
            >
              Apply Filters
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
          <div className="overflow-x-auto max-h-96">
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
                  <th className="p-4 text-left">Actions</th>
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
                    <td className="p-4">Case #{report.missing_person}</td>
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
                      <select
                        className="p-2 border rounded text-sm"
                        value={report.report_status}
                        onChange={(e) => handleSingleStatusChange(report.id, e.target.value)}
                      >
                        <option value="new">New</option>
                        <option value="verified">Verified</option>
                        <option value="false">False</option>
                        <option value="unverified">Unverified</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReports.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No reports found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}