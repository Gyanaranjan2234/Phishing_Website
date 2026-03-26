// src/lib/api.ts
// Mock API - using localStorage for session management

const mockUsers: any = {
  'test@example.com': {
    id: 1,
    username: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  }
};

const mockScans = [
  { id: '1', type: 'url', target: 'example.com', status: 'safe', timestamp: new Date(Date.now() - 86400000) },
  { id: '2', type: 'email', target: 'test@example.com', status: 'safe', timestamp: new Date(Date.now() - 172800000) },
];

export const apiAuth = {
  register: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    if (mockUsers[data.email]) {
      throw new Error('Email already registered');
    }
    
    mockUsers[data.email] = {
      id: Math.random(),
      username: data.username,
      email: data.email,
      password: data.password
    };
    
    localStorage.setItem('user_session', JSON.stringify({
      id: mockUsers[data.email].id,
      username: mockUsers[data.email].username,
      email: mockUsers[data.email].email
    }));
    
    return { success: true };
  },

  login: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = mockUsers[data.email];
    if (!user || user.password !== data.password) {
      throw new Error('Invalid credentials');
    }
    
    localStorage.setItem('user_session', JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email
    }));
    
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    };
  },

  logout: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    localStorage.removeItem('user_session');
    return { success: true };
  },

  getSession: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const session = localStorage.getItem('user_session');
    
    if (session) {
      return { session: { user: JSON.parse(session) } };
    }
    
    return { session: null };
  },

  updateProfile: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const session = localStorage.getItem('user_session');
    if (!session) {
      throw new Error('Unauthorized');
    }
    
    const user = JSON.parse(session);
    user.username = data.username;
    mockUsers[user.email].username = data.username;
    localStorage.setItem('user_session', JSON.stringify(user));
    
    return { success: true };
  },

  updatePassword: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const session = localStorage.getItem('user_session');
    if (!session) {
      throw new Error('Unauthorized');
    }
    
    if (!data.password || data.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    
    const user = JSON.parse(session);
    mockUsers[user.email].password = data.password;
    
    return { success: true };
  },

  deleteAccount: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const session = localStorage.getItem('user_session');
    if (!session) {
      throw new Error('Unauthorized');
    }
    
    const user = JSON.parse(session);
    
    // Verify password
    if (!data.password) {
      throw new Error('Password required to delete account');
    }
    
    const existingUser = mockUsers[user.email];
    if (!existingUser || existingUser.password !== data.password) {
      throw new Error('Invalid password');
    }
    
    // Delete user data
    delete mockUsers[user.email];
    localStorage.removeItem('user_session');
    
    return { success: true };
  },
};

export const apiScans = {
  saveScan: async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newScan = {
      id: Math.random().toString(),
      type: data.type,
      target: data.target,
      status: data.status,
      timestamp: new Date()
    };
    
    mockScans.push(newScan);
    return { success: true, id: newScan.id };
  },

  getHistory: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      history: mockScans.slice().reverse()
    };
  },

  getStats: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      stats: {
        totalScans: mockScans.length,
        threats: mockScans.filter(s => s.status !== 'safe').length,
        safe: mockScans.filter(s => s.status === 'safe').length,
        activeUsers: 1,
        userTotalScans: mockScans.length,
        userThreats: mockScans.filter(s => s.status !== 'safe').length
      }
    };
  },
};
