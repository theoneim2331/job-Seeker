// API Service - Handles all backend communication
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Get auth token from localStorage
function getToken() {
  return localStorage.getItem('jobmatch_token');
}

// Generic fetch wrapper with auth
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  // Handle auth errors
  if (response.status === 401) {
    localStorage.removeItem('jobmatch_token');
    localStorage.removeItem('jobmatch_user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  
  return response;
}

// Auth API
export const authAPI = {
  async login(email, password) {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');
    return data;
  },
  
  async logout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('jobmatch_token');
      localStorage.removeItem('jobmatch_user');
    }
  },
  
  async getMe() {
    const response = await apiFetch('/api/auth/me');
    if (!response.ok) throw new Error('Failed to get user');
    return response.json();
  },
};

// Jobs API
export const jobsAPI = {
  async getJobs(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else {
          params.set(key, value);
        }
      }
    });
    
    const response = await apiFetch(`/api/jobs?${params}`);
    if (!response.ok) throw new Error('Failed to fetch jobs');
    return response.json();
  },
  
  async refreshJobs() {
    const response = await apiFetch('/api/jobs/refresh', { method: 'POST' });
    return response.json();
  },
};

// Resume API
export const resumeAPI = {
  async uploadResume(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = getToken();
    const response = await fetch(`${API_URL}/api/resume/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },
  
  async getResume() {
    const response = await apiFetch('/api/resume');
    if (!response.ok) throw new Error('Failed to get resume');
    return response.json();
  },
  
  async deleteResume() {
    const response = await apiFetch('/api/resume', { method: 'DELETE' });
    return response.json();
  },
};

// Applications API
export const applicationsAPI = {
  async getApplications() {
    const response = await apiFetch('/api/applications');
    if (!response.ok) throw new Error('Failed to get applications');
    return response.json();
  },
  
  async createApplication(data) {
    const response = await apiFetch('/api/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to create application');
    return result;
  },
  
  async updateStatus(id, status, note = '') {
    const response = await apiFetch(`/api/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to update status');
    return result;
  },
  
  async checkApplied(jobId) {
    const response = await apiFetch(`/api/applications/check/${jobId}`);
    return response.json();
  },
};

// Assistant API
export const assistantAPI = {
  async sendMessage(message) {
    const response = await apiFetch('/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to send message');
    return data;
  },
  
  async getHistory() {
    const response = await apiFetch('/api/assistant/history');
    return response.json();
  },
  
  async clearHistory() {
    const response = await apiFetch('/api/assistant/history', { method: 'DELETE' });
    return response.json();
  },
  
  async getStarters() {
    const response = await apiFetch('/api/assistant/starters');
    return response.json();
  },
};

export default {
  auth: authAPI,
  jobs: jobsAPI,
  resume: resumeAPI,
  applications: applicationsAPI,
  assistant: assistantAPI,
};
