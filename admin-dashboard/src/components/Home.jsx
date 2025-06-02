import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api'; // Adjust the import path according to your project structure
import NotificationModal from '../components/SendNotification'; // Import the modal component

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeCases: 0,
    unverifiedReports: 0,
    pendingCases: 0,
    aiMatches: 4 // Static for now, can be fetched from API later
  });
  const [loading, setLoading] = useState(true);
  // Add state for notification modal
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Fetch dashboard statistics
  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch cases statistics
      const casesResponse = await API.cases.fetchAll(1, {});
      const reportsResponse = await API.reports.fetchAll();
      
      // Calculate statistics
      const activeCases = casesResponse.results?.filter(case_ => case_.submission_status === 'active').length || 0;
      const pendingCases = casesResponse.results?.filter(case_ => case_.submission_status === 'in_progress').length || 0;
      const unverifiedReports = reportsResponse?.filter(report => report.report_status === 'unverified').length || 0;
      
      setStats({
        activeCases,
        unverifiedReports,
        pendingCases,
        aiMatches: 4 // This would come from AI matches API when available
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  // Navigation handlers
  const handleNavigateToAddCase = () => {
    navigate('/add-case');
  };

  const handleNavigateToCases = (filter = '') => {
    if (filter) {
      navigate(`/cases?filter=${filter}`);
    } else {
      navigate('/cases');
    }
  };

  const handleNavigateToReports = (filter = '') => {
    if (filter) {
      navigate(`/reports?filter=${filter}`);
    } else {
      navigate('/reports');
    }
  };

  const handleNavigateToAIMatches = () => {
    navigate('/AIMatches');
  };

  // Corrected handleSendAlert function
  const handleSendAlert = () => {
    setIsNotificationModalOpen(true);
  };

  // Handle when notification is sent successfully
  const handleNotificationSent = (response) => {
    console.log('Notification sent:', response);
    // You can add any additional logic here, like refreshing stats
    // or showing a success message
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h1 className="text-2xl font-bold text-gray-900">Hey admin, welcome back</h1>
        <p className="text-gray-600 mt-1">Here's what's happening with FindThem today</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Cases */}
        <div 
          className="bg-red-50 p-6 rounded-lg shadow-sm cursor-pointer hover:scale-105 transition-all hover:shadow-md"
          onClick={() => handleNavigateToCases('active')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Cases</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '...' : stats.activeCases}
              </p>
            </div>
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
            </svg>
          </div>
        </div>
        
        {/* Unverified Reports */}
        <div 
          className="bg-yellow-50 p-6 rounded-lg shadow-sm cursor-pointer hover:scale-105 transition-all hover:shadow-md"
          onClick={() => handleNavigateToReports('unverified')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unverified Reports</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '...' : stats.unverifiedReports}
              </p>
            </div>
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
        </div>
        
        {/* Pending Cases */}
        <div 
          className="bg-orange-50 p-6 rounded-lg shadow-sm cursor-pointer hover:scale-105 transition-all hover:shadow-md"
          onClick={() => handleNavigateToCases('pending')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Cases</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '...' : stats.pendingCases}
              </p>
            </div>
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>
        
        {/* AI Matches */}
        <div 
          className="bg-purple-50 p-6 rounded-lg shadow-sm cursor-pointer hover:scale-105 transition-all hover:shadow-md"
          onClick={handleNavigateToAIMatches}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">AI Matches Found</p>
              <p className="text-3xl font-bold text-gray-900">{stats.aiMatches}</p>
            </div>
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4.343 15.657l9.9-9.9a2.121 2.121 0 013 3l-9.9 9.9a2.121 2.121 0 01-3-3z"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add New Case */}
        <div 
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg cursor-pointer hover:scale-105 transition-all shadow-sm hover:shadow-lg"
          onClick={handleNavigateToAddCase}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
            </div>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Add New Case</h3>
          <p className="text-blue-100">Submit a new missing person case</p>
        </div>
        
        {/* AI Matches */}
        <div 
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg cursor-pointer hover:scale-105 transition-all shadow-sm hover:shadow-lg"
          onClick={handleNavigateToAIMatches}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4.343 15.657l9.9-9.9a2.121 2.121 0 013 3l-9.9 9.9a2.121 2.121 0 01-3-3z"></path>
              </svg>
            </div>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">AI Matches</h3>
          <p className="text-purple-100">Review facial recognition matches</p>
        </div>
        
        {/* Send Alert */}
        <div 
          className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg cursor-pointer hover:scale-105 transition-all shadow-sm hover:shadow-lg"
          onClick={handleSendAlert}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            </div>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Send Alert</h3>
          <p className="text-green-100">Broadcast notifications to users</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <p className="text-sm font-medium">New case submitted: John Doe</p>
              <p className="text-xs text-gray-500">2 hours ago • AI scan initiated</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            <div>
              <p className="text-sm font-medium">AI found potential match (95% confidence)</p>
              <p className="text-xs text-gray-500">3 hours ago • Awaiting review</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <p className="text-sm font-medium">Case status updated: Jane Smith → Found</p>
              <p className="text-xs text-gray-500">5 hours ago • Match confirmed by admin</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
            <div>
              <p className="text-sm font-medium">New report submitted for Mike Johnson</p>
              <p className="text-xs text-gray-500">1 day ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Modal - Add this at the end */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        onSend={handleNotificationSent}
      />
    </div>
  );
}