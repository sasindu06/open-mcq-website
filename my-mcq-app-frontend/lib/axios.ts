// lib/axios.ts

import axios from 'axios';

// --- THIS IS THE FIX ---
// Use the environment variable, but keep localhost as a fallback for local development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
// -----------------------

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor to attach the token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    // Read the token from localStorage right before the request is sent
    const token = localStorage.getItem('authToken');
    
    if (token) {
      // If the token exists, add it to the Authorization header
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Do something with request error
    return Promise.reject(error);
  }
);

export default axiosInstance;
