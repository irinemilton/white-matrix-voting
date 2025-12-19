import axios from 'axios'; // Add this import

export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';

// Global Axios configuration to ensure cookies are sent to the backend
axios.defaults.withCredentials = true;