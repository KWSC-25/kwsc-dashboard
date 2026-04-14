import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // --- NEW LOGIC: Attach Database Context ---
  const activeDashboard = sessionStorage.getItem('activeDashboard');
  if (activeDashboard) {
    config.headers['x-dashboard-context'] = activeDashboard;
  }
  // ------------------------------------------

  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/')) {
      sessionStorage.removeItem('token');
      // Clean up dashboard context on logout too
      sessionStorage.removeItem('activeDashboard'); 
      window.location.href = '/'; 
    }
    return Promise.reject(error);
  }
);

export default api;