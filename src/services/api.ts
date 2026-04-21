import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // default local backend URL
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem('business_nexus_user');
    const storedToken = localStorage.getItem('business_nexus_token');
    
    if (storedToken) {
      config.headers.Authorization = `Bearer ${storedToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (optional to handle global 401s here)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Potentially dispatch a logout event or clear local storage
    }
    return Promise.reject(error);
  }
);

export default api;
