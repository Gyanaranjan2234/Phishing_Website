// src/lib/api-backend.ts
// Backend API integration - connects React frontend to FastAPI backend
console.log("Using backend API");

const API_BASE_URL = 'http://127.0.0.1:8000/api/auth';
const SCAN_API_URL = 'http://127.0.0.1:8000/api/scans';  // ADDED: Scan history API

/**
 * User Signup - sends request to backend
 * @param email - User's email
 * @param username - User's chosen username  
 * @param password - User's password
 * @returns Response with status, message, and user data
 */
export const signup = async (email: string, username: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/signup`, {
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
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    // If login successful, store user data in localStorage
    if (data.status === 'success' && data.data) {
      // Store complete user session with user_id (CRITICAL for data isolation)
      localStorage.setItem('user_session', JSON.stringify(data.data));
      localStorage.setItem('username', data.data.username);
      localStorage.setItem('user_id', data.data.id.toString());  // ADDED: Store user_id
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
 * @returns Session object with user data or null
 */
export const getSession = async () => {
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
  localStorage.removeItem('user_id');  // ADDED: Clear user_id
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
 * Update password
 * Note: This would need a backend endpoint to be implemented
 * For now, returns success (not functional without backend support)
 */
export const updatePassword = async (data: { password: string }) => {
  const session = localStorage.getItem('user_session');
  if (!session) {
    throw new Error('Unauthorized');
  }

  if (!data.password || data.password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Note: This doesn't actually update the backend password
  // You would need a backend endpoint for this
  return { success: true };
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

// Export as apiAuth object for compatibility with existing code
export const apiAuth = {
  signup,
  login,
  getSession,
  logout,
  updateProfile,
  updatePassword,
  deleteAccount,
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
  resultDetails?: string
) => {
  try {
    console.log('📡 API: Saving scan...', { userId, scanType, target, status });
    
    const response = await fetch(`${SCAN_API_URL}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        scan_type: scanType,
        target: target,
        status: status,
        result_details: resultDetails || null
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
export const getScanHistory = async (userId: number, limit: number = 50) => {
  try {
    console.log('📡 API: Fetching scan history for user_id:', userId);
    
    const response = await fetch(`${SCAN_API_URL}/history?user_id=${userId}&limit=${limit}`);
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
    const response = await fetch(`${SCAN_API_URL}/stats?user_id=${userId}`);
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
 * Delete a scan record
 * @param scanId - Scan record ID to delete
 * @param userId - User ID for authorization
 */
export const deleteScan = async (scanId: number, userId: number) => {
  try {
    const response = await fetch(`${SCAN_API_URL}/${scanId}?user_id=${userId}`, {
      method: 'DELETE',
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

// Export as apiScans object for compatibility with existing code
export const apiScans = {
  saveScan,
  getHistory: getScanHistory,
  getStats: getScanStats,
  deleteScan,
};
