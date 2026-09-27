import axios from 'axios';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const customUrl = process.env.NEXT_PUBLIC_API_URL;
    if (customUrl && !customUrl.includes('localhost')) {
      return customUrl;
    }
    return ''; // Relative path -> Proxied via Next.js rewrite rule to NestJS backend
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('ghanshyam_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An API error occurred';
    return Promise.reject(new Error(message));
  }
);
