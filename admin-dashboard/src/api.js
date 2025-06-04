const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const makeRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  console.log(`Making request to: ${BASE_URL}${endpoint}`);

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  
  console.log('Response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error:', errorText);
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }
  
  // Check if response has content before trying to parse JSON
  const contentType = response.headers.get('content-type');
  const contentLength = response.headers.get('content-length');
  
  // If it's a 204 No Content or empty response, return null
  if (response.status === 204 || contentLength === '0') {
    console.log('Empty response (204 No Content or empty body)');
    return null;
  }
  
  // If there's no content-type or it's not JSON, try to get text
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    if (!text) {
      return null;
    }
    // Try to parse as JSON, fallback to returning the text
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  
  // Normal JSON parsing
  const data = await response.json();
  console.log('Response data:', data);
  return data;
};

// Helper function for file uploads
const makeFileRequest = async (endpoint, formData, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    body: formData,
    ...options,
  };

  console.log(`Making file request to: ${BASE_URL}${endpoint}`);

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  
  console.log('Response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error:', errorText);
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
  }
  
  // Check if response has content before trying to parse JSON
  const contentType = response.headers.get('content-type');
  const contentLength = response.headers.get('content-length');
  
  // If it's a 204 No Content or empty response, return null
  if (response.status === 204 || contentLength === '0') {
    console.log('Empty response (204 No Content or empty body)');
    return null;
  }
  
  // If there's no content-type or it's not JSON, try to get text
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    if (!text) {
      return null;
    }
    // Try to parse as JSON, fallback to returning the text
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  
  const data = await response.json();
  console.log('Response data:', data);
  return data;
};

export const API = {
  login: async (username, password) => {
    try {
      const data = await makeRequest('/token/', {
        method: 'POST',
        body: { username, password }
      });
      localStorage.setItem('token', data.access);
      console.log('Login successful, token stored');
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // ========================
  // DASHBOARD APIs (NEW)
  // ========================
  dashboard: {
    // Get recent activity for dashboard
    fetchRecentActivity: async () => {
      try {
        const data = await makeRequest('/api/cases/dashboard/activity/');
        return data;
      } catch (error) {
        console.error('Error fetching dashboard activity:', error);
        throw error;
      }
    },

    // Get comprehensive dashboard statistics
    fetchDashboardStats: async () => {
      try {
        const data = await makeRequest('/api/cases/dashboard/stats/');
        return data;
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
      }
    }
  },

  // ========================
  // USER MANAGEMENT APIs
  // ========================
  users: {
    // Fetch all users (for admin notification sending)
    fetchAll: async () => {
      try {
        const data = await makeRequest('/api/accounts/');
        return data;
      } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
    },

    // Get current user profile
    getProfile: async () => {
      try {
        const data = await makeRequest('/api/accounts/profile/');
        return data;
      } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }
    },

    // Update user profile
    updateProfile: async (profileData) => {
      try {
        const hasFile = Object.values(profileData).some(value => value instanceof File);
        
        if (hasFile) {
          const formData = new FormData();
          Object.keys(profileData).forEach(key => {
            if (profileData[key] !== null && profileData[key] !== undefined) {
              formData.append(key, profileData[key]);
            }
          });
          
          const data = await makeFileRequest('/api/accounts/profile/', formData, {
            method: 'PATCH'
          });
          return data;
        } else {
          const data = await makeRequest('/api/accounts/profile/', {
            method: 'PATCH',
            body: profileData
          });
          return data;
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
    },

    // Get user by ID (admin only)
    getById: async (userId) => {
      try {
        const data = await makeRequest(`/api/accounts/${userId}/`);
        return data;
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        throw error;
      }
    },

    // Update user role (admin only)
    updateRole: async (userId, roleData) => {
      try {
        const data = await makeRequest(`/api/accounts/${userId}/`, {
          method: 'PATCH',
          body: roleData
        });
        return data;
      } catch (error) {
        console.error(`Error updating user ${userId} role:`, error);
        throw error;
      }
    }
  },

  // ========================
  // NOTIFICATION APIs
  // ========================
  notifications: {
    // Fetch user notifications
    fetchAll: async (type = null) => {
      try {
        const queryParams = new URLSearchParams();
        if (type) queryParams.append('type', type);
        
        const endpoint = queryParams.toString() 
          ? `/api/notifications/?${queryParams}` 
          : '/api/notifications/';
        
        const data = await makeRequest(endpoint);
        return data;
      } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
    },

    // Get notification by ID
    getById: async (notificationId) => {
      try {
        const data = await makeRequest(`/api/notifications/${notificationId}/`);
        return data;
      } catch (error) {
        console.error(`Error fetching notification ${notificationId}:`, error);
        throw error;
      }
    },

    // Mark notification as read
    markAsRead: async (notificationId) => {
      try {
        const data = await makeRequest(`/api/notifications/${notificationId}/`, {
          method: 'PATCH',
          body: { is_read: true }
        });
        return data;
      } catch (error) {
        console.error(`Error marking notification ${notificationId} as read:`, error);
        throw error;
      }
    },

    // Delete notification
    delete: async (notificationId) => {
      try {
        await makeRequest(`/api/notifications/${notificationId}/delete/`, {
          method: 'DELETE'
        });
        return true;
      } catch (error) {
        console.error(`Error deleting notification ${notificationId}:`, error);
        throw error;
      }
    },

    // Send custom notification (admin only)
    sendCustom: async (notificationData) => {
      try {
        const data = await makeRequest('/api/notifications/admin/send/', {
          method: 'POST',
          body: notificationData
        });
        return data;
      } catch (error) {
        console.error('Error sending custom notification:', error);
        throw error;
      }
    },

    // Get all notifications (admin only)
    fetchAllAdmin: async (filters = {}) => {
      try {
        const queryParams = new URLSearchParams();
        
        if (filters.user_id) queryParams.append('user_id', filters.user_id);
        if (filters.type) queryParams.append('type', filters.type);
        if (filters.is_read !== undefined) queryParams.append('is_read', filters.is_read);
        
        const endpoint = queryParams.toString() 
          ? `/api/notifications/all/?${queryParams}` 
          : '/api/notifications/all/';
        
        const data = await makeRequest(endpoint);
        return data;
      } catch (error) {
        console.error('Error fetching all notifications (admin):', error);
        throw error;
      }
    },

    // Get notification statistics (admin only)
    getStats: async () => {
      try {
        const data = await makeRequest('/api/notifications/stats/');
        return data;
      } catch (error) {
        console.error('Error fetching notification stats:', error);
        throw error;
      }
    }
  },

  cases: {
    // Fetch cases with pagination and filters
    fetchAll: async (page = 1, filters = {}) => {
      try {
        const queryParams = new URLSearchParams();
        
        // Add pagination
        queryParams.append('page', page.toString());
        
        // Add filters
        if (filters.search) queryParams.append('name_or_location', filters.search);
        if (filters.gender) queryParams.append('gender', filters.gender);
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.submission_status) queryParams.append('submission_status', filters.submission_status);
        if (filters.age_min) queryParams.append('age_min', filters.age_min);
        if (filters.age_max) queryParams.append('age_max', filters.age_max);

        const data = await makeRequest(`/api/cases/?${queryParams}`);
        return data;
      } catch (error) {
        console.error('Error fetching cases:', error);
        throw error;
      }
    },

    // NEW: Fetch cases that can receive updates (have reporters)
    fetchCasesForUpdates: async (filters = {}) => {
      try {
        const queryParams = new URLSearchParams();
        
        // Add search filter if provided
        if (filters.search) queryParams.append('search', filters.search);
        
        const endpoint = queryParams.toString() 
          ? `/api/cases/for-updates/?${queryParams}` 
          : '/api/cases/for-updates/';

        const data = await makeRequest(endpoint);
        return data;
      } catch (error) {
        console.error('Error fetching cases for updates:', error);
        throw error;
      }
    },

    // Create a new case
    create: async (caseData) => {
      try {
        // Create FormData for file upload
        const formData = new FormData();
        
        // Add all fields to FormData
        Object.keys(caseData).forEach(key => {
          if (caseData[key] !== null && caseData[key] !== undefined) {
            formData.append(key, caseData[key]);
          }
        });

        const data = await makeFileRequest('/api/cases/', formData);
        return data;
      } catch (error) {
        console.error('Error creating case:', error);
        throw error;
      }
    },

    // Update case with possible file upload
    update: async (caseId, updateData) => {
      try {
        // Check if we have a file to upload
        const hasFile = Object.values(updateData).some(value => value instanceof File);
        
        if (hasFile) {
          const formData = new FormData();
          Object.keys(updateData).forEach(key => {
            if (updateData[key] !== null && updateData[key] !== undefined) {
              formData.append(key, updateData[key]);
            }
          });
          
          const data = await makeFileRequest(`/api/cases/${caseId}/`, formData, {
            method: 'PATCH'
          });
          return data;
        } else {
          // Use regular JSON request if no files
          const data = await makeRequest(`/api/cases/${caseId}/`, {
            method: 'PATCH',
            body: updateData
          });
          return data;
        }
      } catch (error) {
        console.error(`Error updating case ${caseId}:`, error);
        throw error;
      }
    },

    // Bulk update cases status
    bulkUpdateStatus: async (caseIds, newStatus) => {
      try {
        const promises = caseIds.map(caseId =>
          API.cases.update(caseId, { status: newStatus })
        );
        const results = await Promise.all(promises);
        return results;
      } catch (error) {
        console.error('Error in bulk status update:', error);
        throw error;
      }
    },

    // Bulk update cases submission status
    bulkUpdateSubmissionStatus: async (caseIds, newSubmissionStatus) => {
      try {
        const promises = caseIds.map(caseId =>
          API.cases.update(caseId, { submission_status: newSubmissionStatus })
        );
        const results = await Promise.all(promises);
        return results;
      } catch (error) {
        console.error('Error in bulk submission status update:', error);
        throw error;
      }
    },

    // Get a single case by ID
    getById: async (caseId) => {
      try {
        const data = await makeRequest(`/api/cases/${caseId}/`);
        return data;
      } catch (error) {
        console.error(`Error fetching case ${caseId}:`, error);
        throw error;
      }
    },

    // Delete a case
    delete: async (caseId) => {
      try {
        const result = await makeRequest(`/api/cases/${caseId}/`, {
          method: 'DELETE'
        });
        console.log(`Case ${caseId} deleted successfully`);
        return true; // Return true to indicate success
      } catch (error) {
        console.error(`Error deleting case ${caseId}:`, error);
        throw error;
      }
    },

    // Get cases statistics
    getStats: async () => {
      try {
        const data = await makeRequest('/api/cases/stats/');
        return data;
      } catch (error) {
        console.error('Error fetching cases stats:', error);
        throw error;
      }
    },
     getStats: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to the stats request (same as main cases endpoint)
      if (filters.search) queryParams.append('name_or_location', filters.search);
      if (filters.gender) queryParams.append('gender', filters.gender);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.submission_status) queryParams.append('submission_status', filters.submission_status);
      if (filters.age_min) queryParams.append('age_min', filters.age_min);
      if (filters.age_max) queryParams.append('age_max', filters.age_max);

      const endpoint = queryParams.toString() 
        ? `/api/cases/stats/?${queryParams}` 
        : '/api/cases/stats/';

      const data = await makeRequest(endpoint);
      return data;
    } catch (error) {
      console.error('Error fetching cases stats:', error);
      throw error;
    }
  },

    // Add case update
    addCaseUpdate: async (caseId, updateData) => {
      try {
        const data = await makeRequest(`/api/cases/${caseId}/add-update/`, {
          method: 'POST',
          body: updateData
        });
        return data;
      } catch (error) {
        console.error(`Error adding case update for case ${caseId}:`, error);
        throw error;
      }
    },

    // Get case updates
    getCaseUpdates: async (caseId) => {
      try {
        const data = await makeRequest(`/api/cases/${caseId}/updates/`);
        return data;
      } catch (error) {
        console.error(`Error fetching case updates for case ${caseId}:`, error);
        throw error;
      }
    },
  },

  reports: {
    // Fetch all reports
    fetchAll: async () => {
      try {
        const data = await makeRequest('/api/reports/');
        return data;
      } catch (error) {
        console.error('Error fetching reports:', error);
        throw error;
      }
    },

    // Get a single report by ID
    getById: async (reportId) => {
      try {
        const data = await makeRequest(`/api/reports/${reportId}/`);
        return data;
      } catch (error) {
        console.error(`Error fetching report ${reportId}:`, error);
        throw error;
      }
    },

    // Update report status
    updateStatus: async (reportId, newStatus) => {
      try {
        const data = await makeRequest(`/api/reports/${reportId}/update-status/`, {
          method: 'PATCH',
          body: { report_status: newStatus }
        });
        return data;
      } catch (error) {
        console.error(`Error updating report ${reportId} status:`, error);
        throw error;
      }
    },

    // Bulk update report status
    bulkUpdateStatus: async (reportIds, newStatus) => {
      try {
        const promises = reportIds.map(reportId =>
          API.reports.updateStatus(reportId, newStatus)
        );
        const results = await Promise.all(promises);
        return results;
      } catch (error) {
        console.error('Error in bulk report status update:', error);
        throw error;
      }
    },

    // Delete a report
    delete: async (reportId) => {
      try {
        await makeRequest(`/api/reports/${reportId}/`, {
          method: 'DELETE'
        });
        return true;
      } catch (error) {
        console.error(`Error deleting report ${reportId}:`, error);
        throw error;
      }
    }
  },

  // AI Matches API functions
  aiMatches: {
    // Fetch all AI matches with filters
    fetchAll: async (filters = {}) => {
      try {
        const queryParams = new URLSearchParams();
        
        // Add filters
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.confidence) queryParams.append('confidence', filters.confidence);
        if (filters.search) queryParams.append('search', filters.search);

        const data = await makeRequest(`/api/ai-matches/?${queryParams}`);
        return data;
      } catch (error) {
        console.error('Error fetching AI matches:', error);
        throw error;
      }
    },

    // Get AI match statistics
    getStats: async () => {
      try {
        const data = await makeRequest('/api/ai-matches/stats/');
        return data;
      } catch (error) {
        console.error('Error fetching AI match stats:', error);
        throw error;
      }
    },

    // Get a single AI match by ID
    getById: async (matchId) => {
      try {
        const data = await makeRequest(`/api/ai-matches/${matchId}/`);
        return data;
      } catch (error) {
        console.error(`Error fetching AI match ${matchId}:`, error);
        throw error;
      }
    },

    // Review an AI match (confirm or reject)
    review: async (matchId, action, adminNotes = '') => {
      try {
        const data = await makeRequest(`/api/ai-matches/${matchId}/review/`, {
          method: 'POST',
          body: {
            action, // 'confirm' or 'reject'
            admin_notes: adminNotes
          }
        });
        return data;
      } catch (error) {
        console.error(`Error reviewing AI match ${matchId}:`, error);
        throw error;
      }
    },

    // Confirm an AI match
    confirm: async (matchId, adminNotes = '') => {
      try {
        return await API.aiMatches.review(matchId, 'confirm', adminNotes);
      } catch (error) {
        console.error(`Error confirming AI match ${matchId}:`, error);
        throw error;
      }
    },

    // Reject an AI match
    reject: async (matchId, adminNotes = '') => {
      try {
        return await API.aiMatches.review(matchId, 'reject', adminNotes);
      } catch (error) {
        console.error(`Error rejecting AI match ${matchId}:`, error);
        throw error;
      }
    }
  }
};

export default API;