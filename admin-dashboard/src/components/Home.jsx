import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Bot, BellRing } from "lucide-react";
import API from '../api'; // Adjust the import path according to your project structure
import NotificationModal from '../components/SendNotification'; // Import the modal component
import AddCaseUpdateModal from '../components/AddCaseUpdate'; // Import the new modal component

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeCases: 0,
    unverifiedReports: 0,
    pendingCases: 0,
    totalCases: 0,
    caseUpdatesCount: 0,
    aiMatches: 0, // AI matches pending review
    aiPendingReviews: 0,
    aiConfirmedMatches: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  // Add state for notification modal
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  // Add state for case update modal
  const [isCaseUpdateModalOpen, setIsCaseUpdateModalOpen] = useState(false);

  // Fetch dashboard statistics
  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivity();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Option 1: Try to use the new dashboard API endpoint
      try {
        const dashboardStats = await API.dashboard.fetchDashboardStats();
        console.log('Dashboard stats from API:', dashboardStats);
        
        setStats({
          activeCases: dashboardStats.active_cases || 0,
          unverifiedReports: dashboardStats.unverified_reports || 0,
          pendingCases: dashboardStats.pending_cases || 0, // This is submission_status = 'in_progress'
          totalCases: dashboardStats.total_cases || 0,
          caseUpdatesCount: 0, // We can calculate this if needed
          aiMatches: dashboardStats.ai_pending_reviews || 0, // Show pending AI matches instead of "perfect matches"
          aiPendingReviews: dashboardStats.ai_pending_reviews || 0,
          aiConfirmedMatches: dashboardStats.ai_confirmed_matches || 0
        });
        
        return; // Exit early if dashboard API works
      } catch (dashboardError) {
        console.log('Dashboard API not available, falling back to manual calculation:', dashboardError);
      }
      
      // Option 2: Fallback - Fetch data manually if dashboard API is not available
      const [casesResponse, aiMatchesResponse, reportsResponse] = await Promise.all([
        API.cases.fetchAll(1, {}),
        fetchAIMatchesData(),
        fetchReportsData()
      ]);

      const cases = casesResponse.results || [];
      console.log('Cases data:', cases);
      console.log('Sample case submission statuses:', cases.slice(0, 3).map(c => ({
        name: c.full_name,
        submission_status: c.submission_status,
        status: c.status
      })));
      
      // Calculate statistics manually
      const activeCases = cases.filter(c => c.submission_status === 'active').length;
      const pendingCases = cases.filter(c => c.submission_status === 'in_progress').length;
      const totalCases = casesResponse.count || cases.length;
      
      console.log('Calculated stats:', {
        activeCases,
        pendingCases,
        totalCases,
        unverifiedReports: reportsResponse.unverified
      });
      
      setStats({
        activeCases: activeCases,
        unverifiedReports: reportsResponse.unverified || 0,
        pendingCases: pendingCases,
        totalCases: totalCases,
        caseUpdatesCount: cases.reduce((total, c) => total + (c.updates?.length || 0), 0),
        aiMatches: aiMatchesResponse.pendingReviews || 0, // Show pending reviews instead of perfect matches
        aiPendingReviews: aiMatchesResponse.pendingReviews || 0,
        aiConfirmedMatches: aiMatchesResponse.confirmedMatches || 0
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch AI matches data
  const fetchAIMatchesData = async () => {
    try {
      // Try to get AI stats first
      try {
        const aiStats = await API.aiMatches.getStats();
        console.log('AI Stats from API:', aiStats);
        
        return {
          pendingReviews: aiStats.pending_reviews || 0,
          confirmedMatches: aiStats.confirmed_matches || 0,
          totalMatches: aiStats.total_matches || 0,
          perfectMatches: aiStats.pending_reviews || 0 // Use pending reviews as "important matches"
        };
      } catch (statsError) {
        console.log('AI stats API not available, fetching all matches:', statsError);
      }
      
      // Fallback: Fetch all AI matches and calculate
      const allMatches = await API.aiMatches.fetchAll();
      console.log('AI Matches data:', allMatches);
      
      // Calculate different types of matches
      const pendingReviews = allMatches.filter(match => 
        match.status === 'pending'
      ).length;
      
      const confirmedMatches = allMatches.filter(match => 
        match.status === 'confirmed'
      ).length;

      // Count high-confidence matches instead of perfect 100% matches
      const highConfidenceMatches = allMatches.filter(match => 
        match.confidence_score >= 85 && match.status === 'pending'
      ).length;

      return {
        pendingReviews,
        confirmedMatches,
        totalMatches: allMatches.length,
        perfectMatches: highConfidenceMatches
      };
    } catch (error) {
      console.error('Error fetching AI matches:', error);
      // Return default values if AI matches API is not available
      return {
        pendingReviews: 0,
        confirmedMatches: 0,
        totalMatches: 0,
        perfectMatches: 0
      };
    }
  };

  // Fetch reports data
  const fetchReportsData = async () => {
    try {
      const reports = await API.reports.fetchAll();
      console.log('Reports data:', reports);
      const unverified = reports.filter(r => r.report_status === 'unverified').length;
      
      return { unverified };
    } catch (error) {
      console.error('Error fetching reports:', error);
      return { unverified: 0 };
    }
  };

const fetchRecentActivity = async () => {
  try {
    setActivityLoading(true);
    console.log('🔄 Fetching recent activity from backend...');
    
    const response = await API.dashboard.fetchRecentActivity();
    console.log('✅ Backend response received:', response);
    
    if (response && response.activities && response.activities.length > 0) {
      console.log('📊 Setting real activities:', response.activities);
      setRecentActivity(response.activities);
    } else {
      console.log('📭 No activities found - showing empty state');
      setRecentActivity([]);
    }
    
  } catch (error) {
    console.error('❌ Dashboard API failed:', error);
    
    // Log detailed error information
    if (error.message?.includes('403')) {
      console.error('🔐 Permission denied - user is not admin');
    } else if (error.message?.includes('401')) {
      console.error('🔐 Authentication failed - user not logged in');
    } else if (error.message?.includes('404')) {
      console.error('🔍 Endpoint not found - check backend URL');
    } else {
      console.error('💥 Other error:', error.message);
    }
    
    // IMPORTANT: Set empty array instead of fallback data
    setRecentActivity([]);
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
      blue: 'bg-blue-500 dark:bg-blue-600',
      green: 'bg-green-500 dark:bg-green-600',
      yellow: 'bg-yellow-500 dark:bg-yellow-600',
      orange: 'bg-orange-500 dark:bg-orange-600',
      red: 'bg-red-500 dark:bg-red-600',
      purple: 'bg-purple-500 dark:bg-purple-600',
      gray: 'bg-gray-500 dark:bg-gray-600'
    };
    return colorMap[color] || 'bg-gray-500 dark:bg-gray-600';
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
    if (filter === 'pending') {
      // Navigate to cases filtered by submission_status = 'in_progress'
      navigate(`/cases?submission_status=in_progress`);
    } else if (filter) {
      navigate(`/cases?submission_status=${filter}`);
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

  // Send alert handler
  const handleSendAlert = () => {
    setIsNotificationModalOpen(true);
  };

  // Add case update handler
  const handleAddCaseUpdate = () => {
    setIsCaseUpdateModalOpen(true);
  };

  // Handle when notification is sent successfully
  const handleNotificationSent = (response) => {
    console.log('Notification sent:', response);
    // Refresh activity feed to show any new activities
    fetchRecentActivity();
  };

  // Handle when case update is sent successfully
  const handleCaseUpdateSent = (updateInfo) => {
    console.log('Case update sent:', updateInfo);
    // Refresh activity feed and stats
    fetchRecentActivity();
    fetchDashboardStats();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hey admin, welcome back</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Here's what's happening with FindThem today</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Cases */}
        <div 
          className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg shadow-sm cursor-pointer hover:scale-105 transition-all hover:shadow-md border dark:border-red-700/20"
          onClick={() => handleNavigateToCases('active')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Cases</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : stats.activeCases}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Submission status: Active</p>
            </div>
            <Users className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
        
        {/* Unverified Reports */}
        <div 
          className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg shadow-sm cursor-pointer hover:scale-105 transition-all hover:shadow-md border dark:border-yellow-700/20"
          onClick={() => handleNavigateToReports('unverified')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unverified Reports</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : stats.unverifiedReports}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Awaiting review</p>
            </div>
            <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
        </div>
        
        {/* Pending Cases (In Progress) */}
        <div 
          className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg shadow-sm cursor-pointer hover:scale-105 transition-all hover:shadow-md border dark:border-orange-700/20"
          onClick={() => handleNavigateToCases('pending')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Cases</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : stats.pendingCases}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Awaiting review</p>
            </div>
            <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>
        
        {/* AI Matches - Show pending AI matches instead of perfect matches */}
        <div 
          className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg shadow-sm cursor-pointer hover:scale-105 transition-all hover:shadow-md border dark:border-purple-700/20"
          onClick={handleNavigateToAIMatches}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">AI Matches</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {loading ? '...' : stats.aiMatches}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.aiPendingReviews > 0 ? 'Awaiting review' : 'No pending matches'}
              </p>
            </div>
            <Bot className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Add New Case */}
        <div 
          className="bg-gradient-to-br from-teal-500 to-teal-700 dark:from-teal-600 dark:to-teal-800 text-white p-6 rounded-lg cursor-pointer hover:scale-105 transition-all shadow-sm hover:shadow-lg"
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
          <p className="text-teal-100 dark:text-teal-200">Submit a new missing person case</p>
        </div>
        
        {/* Add Case Update */}
        <div 
          className="bg-gradient-to-br from-cyan-500 to-cyan-700 dark:from-cyan-600 dark:to-cyan-800 text-white p-6 rounded-lg cursor-pointer hover:scale-105 transition-all shadow-sm hover:shadow-lg"
          onClick={handleAddCaseUpdate}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </div>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Add Case Update</h3>
          <p className="text-cyan-100 dark:text-cyan-200">Send updates to case reporters</p>
        </div>
        
        {/* Send Alert */}
        <div 
          className="bg-gradient-to-br from-emerald-500 to-emerald-700 dark:from-emerald-600 dark:to-emerald-800 text-white p-6 rounded-lg cursor-pointer hover:scale-105 transition-all shadow-sm hover:shadow-lg"
          onClick={handleSendAlert}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <BellRing className="h-5 w-5" />
            </div>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Send Alert</h3>
          <p className="text-emerald-100 dark:text-emerald-200">Broadcast notifications to users</p>
        </div>
      </div>

      {/* Recent Activity - Enhanced with Real Data */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          <button 
            onClick={fetchRecentActivity}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center"
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
                <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map(activity => (
              <div key={activity.id} className="flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors">
                <div className={`w-2 h-2 ${getColorClasses(activity.color)} rounded-full mt-2 flex-shrink-0`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{activity.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatRelativeTime(activity.timestamp)} • {activity.subtitle}</p>
                </div>
                <div className="flex-shrink-0">
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Case Update Modal */}
      <AddCaseUpdateModal
        isOpen={isCaseUpdateModalOpen}
        onClose={() => setIsCaseUpdateModalOpen(false)}
        onUpdateSent={handleCaseUpdateSent}
      />
    </div>
  );
}