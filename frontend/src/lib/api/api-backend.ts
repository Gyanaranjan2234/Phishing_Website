// src/lib/api-backend.ts
// Backend API integration - connects React frontend to FastAPI backend
console.log("Using backend API");

const BASE_URL = 'http://127.0.0.1:8000';
const AUTH_API_URL = `${BASE_URL}/api/auth`;
const SCAN_API_URL = `${BASE_URL}/api/scans`;
const CONTACT_API_URL = `${BASE_URL}/api/contact`;

/**
 * Helper to get authentication headers
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Get global platform statistics
 * Returns total registered users and total performed scans
 */
export const getPlatformStats = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/stats`, { cache: 'no-store' });
    return await response.json();
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return { total_users: 0, total_scans: 0 };
  }
};

/**
 * User Signup - sends request to backend
 * @param email - User's email
 * @param username - User's chosen username  
 * @param password - User's password
 * @returns Response with status, message, and user data
 */
export const signup = async (email: string, username: string, password: string) => {
  try {
    const response = await fetch(`${AUTH_API_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, username, password }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Signup error:', error);
    return {
      status: 'error',
      message: 'Network error. Please check your connection.',
      data: null
    };
  }
};

/**
 * User Login - sends request to backend
 * @param email - User's email
 * @param password - User's password
 * @returns Response with status, message, and user data (including user_id and username)
 */
export const login = async (email: string, password: string) => {
  try {
    const response = await fetch(`${AUTH_API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    // If login successful, store user data in localStorage
    if (data.status === 'success' && data.data) {
      console.log("🔐 Login successful, storing user data:", data.data);
      localStorage.setItem('user_session', JSON.stringify(data.data));
      localStorage.setItem('user', JSON.stringify(data.data));
      localStorage.setItem('username', data.data.username);
      localStorage.setItem('user_id', data.data.id.toString());
      
      // Store JWT token if provided
      if (data.data.token) {
        localStorage.setItem('auth_token', data.data.token);
      }
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    return {
      status: 'error',
      message: 'Network error. Please check your connection.',
      data: null
    };
  }
};

/**
 * Get current user session from localStorage
 * Checks both regular session and Google OAuth token
 * @returns Session object with user data or null
 */
export const getSession = async () => {
  // First, check for Google OAuth token
  const authToken = localStorage.getItem('auth_token');
  
  if (authToken) {
    try {
      // Decode JWT token to get user info
      const payload = JSON.parse(atob(authToken.split('.')[1]));
      const userData = {
        id: payload.user_id,
        email: payload.email,
        username: payload.username,
      };
      
      // Also store in user_session for compatibility
      localStorage.setItem('user_session', JSON.stringify(userData));
      localStorage.setItem('username', userData.username);
      localStorage.setItem('user_id', userData.id.toString());
      
      return { session: { user: userData } };
    } catch (error) {
      console.error('Error parsing auth token:', error);
      // Token is invalid, clear it
      localStorage.removeItem('auth_token');
    }
  }
  
  // Fall back to regular session
  const session = localStorage.getItem('user_session');
  
  if (session) {
    try {
      const userData = JSON.parse(session);
      return { session: { user: userData } };
    } catch (error) {
      console.error('Error parsing session:', error);
      return { session: null };
    }
  }
  
  return { session: null };
};

/**
 * Logout user - clears session from localStorage
 */
export const logout = async () => {
  localStorage.removeItem('user_session');
  localStorage.removeItem('username');
  localStorage.removeItem('user_id');
  localStorage.removeItem('auth_token');  // Clear Google OAuth token
  return { success: true };
};

/**
 * Update user profile (username)
 * Note: This would need a backend endpoint to be implemented
 * For now, updates localStorage only
 */
export const updateProfile = async (data: { username: string }) => {
  const session = localStorage.getItem('user_session');
  if (!session) {
    throw new Error('Unauthorized');
  }

  const user = JSON.parse(session);
  user.username = data.username;
  localStorage.setItem('user_session', JSON.stringify(user));
  localStorage.setItem('username', data.username);

  return { success: true };
};

/**
 * Update password (Authenticated)
 * @param data Object containing user_id, current_password, and new_password
 */
export const updatePassword = async (data: { user_id: number, current_password: string, new_password: string }) => {
  try {
    const response = await fetch(`${AUTH_API_URL}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return {
      success: result.status === 'success',
      message: result.message
    };
  } catch (error) {
    console.error('Update password error:', error);
    return {
      success: false,
      message: 'Network error. Please try again later.'
    };
  }
};

/**
 * Delete account
 * Note: This would need a backend endpoint to be implemented
 * For now, only clears localStorage
 */
export const deleteAccount = async (data: { password: string }) => {
  const session = localStorage.getItem('user_session');
  if (!session) {
    throw new Error('Unauthorized');
  }

  if (!data.password) {
    throw new Error('Password required to delete account');
  }

  // Note: This doesn't actually delete the account from backend
  // You would need a backend endpoint for this
  localStorage.removeItem('user_session');
  localStorage.removeItem('username');

  return { success: true };
};

/**
 * Forgot password
 * @param email User's email to send reset link to
 */
export const forgotPassword = async (email: string) => {
  try {
    const response = await fetch(`${AUTH_API_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return await response.json();
  } catch (error) {
    console.error('Forgot password error:', error);
    return { status: 'error', message: 'Network error. Please try again later.' };
  }
};

/**
 * Reset password
 * @param token Secure token from email link
 * @param new_password New password
 */
export const resetPassword = async (token: string, new_password: string) => {
  try {
    const response = await fetch(`${AUTH_API_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password }),
    });
    return await response.json();
  } catch (error) {
    console.error('Reset password error:', error);
    return { status: 'error', message: 'Network error. Please try again later.' };
  }
};

// Export as apiAuth object for compatibility with existing code
export const apiAuth = {
  signup,
  login,
  getSession,
  logout,
  updateProfile,
  updatePassword,
  deleteAccount,
  forgotPassword,
  resetPassword,
};

/**
 * Analyze a URL for phishing using backend AI and VT
 * @param url - The URL to analyze
 * @param mode - Scan mode: 'quick' or 'deep'
 * @param userId - Optional user ID for history saving
 */
export const analyzeUrl = async (url: string, mode: string = 'quick', userId?: number) => {
  try {
    console.log(`📡 API: Analyzing URL (${mode} mode)...`, url);
    const response = await fetch(`${SCAN_API_URL}/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ url, mode, user_id: userId }),
    });
    return await response.json();
  } catch (error) {
    console.error('Analyze URL error:', error);
    throw error;
  }
};

// ============ SCAN HISTORY API FUNCTIONS ============

/**
 * Save scan result to backend database
 * @param userId - Unique user ID (NOT username)
 * @param scanType - Type of scan: url, email, file, password
 * @param target - What was scanned (URL, email, filename)
 * @param status - Scan result: safe, suspicious, phishing, breached, etc.
 * @param resultDetails - Optional JSON string with detailed results
 */
export const saveScan = async (
  userId: number,
  scanType: string,
  target: string,
  status: string,
  resultDetails?: string,
  rawTarget?: string
) => {
  try {
    console.log('📡 API: Saving scan...', { userId, scanType, target, status });
    
    const response = await fetch(`${SCAN_API_URL}/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        user_id: userId,
        scan_type: scanType,
        target: target,
        status: status,
        result_details: resultDetails || null,
        raw_target: rawTarget || null
      }),
    });

    const data = await response.json();
    console.log('📡 API: Save scan response:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Save scan error:', error);
    return {
      status: 'error',
      message: 'Network error. Failed to save scan.',
      data: null
    };
  }
};

/**
 * Get scan history for a specific user
 * @param userId - Unique user ID (NOT username)
 * @param limit - Maximum number of records to return (default 50)
 */
export const getScanHistory = async (userId: number, limit: number = 1000) => {
  try {
    console.log('📡 API: Fetching scan history for user_id:', userId);
    
    const response = await fetch(`${SCAN_API_URL}/history?user_id=${userId}&limit=${limit}`, { 
      cache: 'no-store',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    
    console.log('📡 API: Scan history response:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Get scan history error:', error);
    return {
      status: 'error',
      message: 'Network error. Failed to fetch history.',
      data: []
    };
  }
};

/**
 * Get scan statistics for dashboard
 * @param userId - Unique user ID (NOT username)
 */
export const getScanStats = async (userId: number) => {
  try {
    const response = await fetch(`${SCAN_API_URL}/stats?user_id=${userId}`, { 
      cache: 'no-store',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get scan stats error:', error);
    return {
      status: 'error',
      message: 'Network error. Failed to fetch stats.',
      data: {
        totalScans: 0,
        safeScans: 0,
        suspiciousScans: 0,
        threatScans: 0
      }
    };
  }
};

/**
 * Get comprehensive dashboard data for user profile
 * Returns stats, recent scans, and chart data
 * @param userId - Unique user ID
 */
export const getDashboardData = async (userId: number) => {
  try {
    console.log('📡 API: Fetching dashboard data for user_id:', userId);
    
    const response = await fetch(`${SCAN_API_URL}/dashboard?user_id=${userId}`, { 
      cache: 'no-store',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    
    console.log('📡 API: Dashboard data response:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Get dashboard data error:', error);
    return {
      status: 'error',
      message: 'Network error. Failed to fetch dashboard data.',
      data: {
        totalScans: 0,
        threats: 0,
        safe: 0,
        suspicious: 0,
        successRate: 0,
        lastScan: null,
        recentScans: [],
        chartData: []
      }
    };
  }
};

/**
 * Delete a scan record
 * @param scanId - Scan record ID to delete
 * @param userId - User ID for authorization
 */
export const deleteScan = async (scanId: number, userId: number) => {
  try {
    const response = await fetch(`${SCAN_API_URL}/${scanId}?user_id=${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Delete scan error:', error);
    return {
      status: 'error',
      message: 'Network error. Failed to delete scan.',
      data: null
    };
  }
};

/**
 * Clear all scan history for a user
 * @param userId - Unique user ID for authorization
 */
export const clearHistory = async (userId: number) => {
  try {
    console.log(`📡 API: Clearing history for user_id: ${userId} via path parameter...`);
    const response = await fetch(`${SCAN_API_URL}/clear-history/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Clear history error:', error);
    return {
      status: 'error',
      message: 'Network error. Failed to clear history.',
      data: null
    };
  }
};

/**
 * API for Contact Form
 */
export const apiContacts = {
  sendMessage: async (data: { name: string; email: string; message: string }) => {
    try {
      console.log('📡 API: Sending contact message');
      const response = await fetch(`${AUTH_API_URL}/contact/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      console.log('📡 API: Contact response:', result);
      return result;
    } catch (error) {
      console.error('❌ Contact submission error:', error);
      return {
        status: 'error',
        message: 'Network error. Failed to send message. Please try again later.'
      };
    }
  }
};

// Export as apiScans object for compatibility with existing code
export const apiScans = {
  analyzeUrl,
  saveScan,
  getHistory: getScanHistory,
  getStats: getScanStats,
  deleteScan,
  clearHistory,
};
