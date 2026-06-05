import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // --- Attach Database Context ---
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
    // FIX: Catch 401 response and redirect them cleanly if they aren't on the root login screen
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('activeDashboard'); 
      sessionStorage.removeItem('role'); // Also drop user role details if stored

      // Avoid infinite redirect loops if they are already at the login root screen
      if (window.location.pathname !== '/') {
        alert("Your session has been terminated because this account was logged in from another device.");
        window.location.href = '/'; 
      }
    }
    return Promise.reject(error);
  }
);

export default api;