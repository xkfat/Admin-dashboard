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
    aiMatches: 0, // Now will be fetched from API
    aiPendingReviews: 0,
    aiConfirmedMatches: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  // Add state for notification modal
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Fetch dashboard statistics
  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivity();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Use the new comprehensive dashboard stats endpoint
      const stats = await API.dashboard.fetchDashboardStats();
      setStats({
        activeCases: stats.active_cases || 0,
        unverifiedReports: stats.unverified_reports || 0,
        pendingCases: stats.pending_cases || 0,
        aiMatches: stats.ai_matches || 0,
        aiPendingReviews: stats.ai_pending_reviews || 0,
        aiConfirmedMatches: stats.ai_confirmed_matches || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      setActivityLoading(true);
      
      // Use the new dashboard activity endpoint
      const response = await API.dashboard.fetchRecentActivity();
      
      if (response.activities && response.activities.length > 0) {
        setRecentActivity(response.activities);
      } else {
        // Set fallback message when no activities are available
        setRecentActivity([
          {
            id: 'no-activity',
            type: 'system',
            title: 'No recent activity',
            subtitle: 'New activities will appear here as they happen',
            timestamp: new Date().toISOString(),
            icon: 'check',
            color: 'gray'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Set fallback activities on error
      setRecentActivity([
        {
          id: 'error-fallback',
          type: 'system',
          title: 'Unable to load recent activity',
          subtitle: 'Please try refreshing the page',
          timestamp: new Date().toISOString(),
          icon: 'check',
          color: 'red'
        }
      ]);
    } finally {
      setActivityLoading(false);
    }
  };

  // Helper function to get activity icons
  const getActivityIcon = (iconType) => {
    const icons = {
      user: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
      ),
      check: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
      ),
      search: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      ),
      document: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      ),
      ai: (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4.343 15.657l9.9-9.9a2.121 2.121 0 013 3l-9.9 9.9a2.121 2.121 0 01-3-3z"></path>
      )
    };
    return icons[iconType] || icons.user;
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500',
      gray: 'bg-gray-500'
    };
    return colorMap[color] || 'bg-gray-500';
  };

  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - activityTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return activityTime.toLocaleDateString();
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
 navigate(`/reports?status=${filter}`);
 
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
    // Refresh activity feed to show any new activities
    fetchRecentActivity();
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
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '...' : stats.aiMatches}
              </p>
              {stats.aiPendingReviews > 0 && (
                <p className="text-xs text-purple-600 mt-1">
                  {stats.aiPendingReviews} pending review
                </p>
              )}
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

      {/* Recent Activity - Enhanced with Real Data */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <button 
            onClick={fetchRecentActivity}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            disabled={activityLoading}
          >
            <svg className={`h-4 w-4 mr-1 ${activityLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Refresh
          </button>
        </div>
        
        {activityLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map(activity => (
              <div key={activity.id} className="flex items-start space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                <div className={`w-2 h-2 ${getColorClasses(activity.color)} rounded-full mt-2 flex-shrink-0`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                  <p className="text-xs text-gray-500">{formatRelativeTime(activity.timestamp)} • {activity.subtitle}</p>
                </div>
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {getActivityIcon(activity.icon)}
                  </svg>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p>No recent activity available</p>
            <p className="text-sm mt-1">New activities will appear here as they happen</p>
          </div>
        )}
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        onSend={handleNotificationSent}
      />
    </div>
  );
}