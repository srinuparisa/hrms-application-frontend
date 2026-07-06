/**
 * HRMS ERP REST API Integration Client
 * Handles connection to Node.js Express + MySQL backend.
 * Falls back to LocalStorage if backend is unreachable or not configured.
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://hrms-application-backend-wws1.onrender.com/api';

// Helper to get JWT token from localStorage
function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('hrms_jwt_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Helper to make API requests with timeout
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 5000); // 5 second timeout

  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers as Record<string, string> || {})
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(id);

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! Status: ${response.status}`);
    }
    return result;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Backend server request timed out');
    }
    throw error;
  }
}

export const apiService = {
  // Check backend server status
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },

  // --- AUTH ENDPOINTS ---
  auth: {
    async login(credentials: any): Promise<any> {
      return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
    },
    async register(regData: any): Promise<any> {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(regData)
      });
    },
    async resetPassword(resetData: any): Promise<any> {
      return request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(resetData)
      });
    },
    async getMe(): Promise<any> {
      return request('/auth/me');
    }
  },

  // --- EMPLOYEES ENDPOINTS ---
  employees: {
    async getAll(): Promise<any> {
      return request('/employees');
    },
    async getById(id: string): Promise<any> {
      return request(`/employees/${id}`);
    },
    async create(data: any): Promise<any> {
      return request('/employees', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    async update(id: string, data: any): Promise<any> {
      return request(`/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    async delete(id: string): Promise<any> {
      return request(`/employees/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // --- DEPARTMENTS ENDPOINTS ---
  departments: {
    async getAll(): Promise<any> {
      return request('/departments');
    },
    async create(data: any): Promise<any> {
      return request('/departments', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    async update(id: string, data: any): Promise<any> {
      return request(`/departments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    async delete(id: string): Promise<any> {
      return request(`/departments/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // --- DESIGNATIONS ENDPOINTS ---
  designations: {
    async getAll(): Promise<any> {
      return request('/designations');
    },
    async create(data: any): Promise<any> {
      return request('/designations', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    async update(id: string, data: any): Promise<any> {
      return request(`/designations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    async delete(id: string): Promise<any> {
      return request(`/designations/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // --- ATTENDANCE ENDPOINTS ---
  attendance: {
    async getAll(): Promise<any> {
      return request('/attendance');
    },
    async create(data: any): Promise<any> {
      return request('/attendance', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    async update(id: string, data: any): Promise<any> {
      return request(`/attendance/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    async delete(id: string): Promise<any> {
      return request(`/attendance/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // --- LEAVE ENDPOINTS ---
  leaves: {
    async getAll(): Promise<any> {
      return request('/leaves');
    },
    async create(data: any): Promise<any> {
      return request('/leaves', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    async update(id: string, data: any): Promise<any> {
      return request(`/leaves/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    async delete(id: string): Promise<any> {
      return request(`/leaves/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // --- PAYROLL ENDPOINTS ---
  payroll: {
    async getAll(): Promise<any> {
      return request('/payroll');
    },
    async create(data: any): Promise<any> {
      return request('/payroll', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    async update(id: string, data: any): Promise<any> {
      return request(`/payroll/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    async delete(id: string): Promise<any> {
      return request(`/payroll/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // --- HOLIDAYS ENDPOINTS ---
  holidays: {
    async getAll(): Promise<any> {
      return request('/holidays');
    },
    async create(data: any): Promise<any> {
      return request('/holidays', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    async delete(id: string): Promise<any> {
      return request(`/holidays/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // --- ANNOUNCEMENTS ENDPOINTS ---
  announcements: {
    async getAll(): Promise<any> {
      return request('/announcements');
    },
    async create(data: any): Promise<any> {
      return request('/announcements', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    async delete(id: string): Promise<any> {
      return request(`/announcements/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // --- SYSTEM USERS ENDPOINTS ---
  users: {
    async getAll(): Promise<any> {
      return request('/users');
    },
    async create(data: any): Promise<any> {
      return request('/users', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    async update(id: string, data: any): Promise<any> {
      return request(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    async delete(id: string): Promise<any> {
      return request(`/users/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // --- AUDIT LOGS ENDPOINTS ---
  audit: {
    async getAll(): Promise<any> {
      return request('/audit');
    }
  }
};
