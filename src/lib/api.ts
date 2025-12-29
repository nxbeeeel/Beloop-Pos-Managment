import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_TRACKER_URL || (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : (() => { throw new Error("Missing NEXT_PUBLIC_TRACKER_URL environment variable"); })());

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Add Auth Token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor: Handle Offline/Errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            // Network Error - Offline
            console.warn('Network Error: App is offline. Action should be queued.');
            // TODO: Trigger Offline Queue Logic here
        }
        return Promise.reject(error);
    }
);

export const MenuService = {
    getAll: (branchId: string) => api.get(`/menu?branch_id=${branchId}`),
};

export const OrderService = {
    create: (orderData: any) => api.post('/orders', orderData),
};
