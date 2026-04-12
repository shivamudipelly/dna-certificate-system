import axios from 'axios';
import type {
    AuthLoginResponse,
    AuthProfileResponse,
    CertificateListResponse,
    CertificateIssueResponse,
    CertificateIssuePayload,
    CertificateVerificationResponse,
    ApiResponse
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

const SESSION_KEY = 'dna_session_token';

// Persist token in sessionStorage (survives tab refresh, clears on tab close)
export const setAuthToken = (token: string | null) => {
    if (token) {
        sessionStorage.setItem(SESSION_KEY, token);
    } else {
        sessionStorage.removeItem(SESSION_KEY);
    }
};

export const getStoredToken = (): string | null => {
    return sessionStorage.getItem(SESSION_KEY);
};

// Request interceptor — attach JWT from sessionStorage on every request
api.interceptors.request.use(
    (config) => {
        const token = getStoredToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        config.headers['X-Request-ID'] = crypto.randomUUID();
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — unified error handling
api.interceptors.response.use(
    (response) => {
        window.dispatchEvent(new CustomEvent('server:online'));
        return response.data;
    },
    (error) => {
        const { response } = error;
        if (!response) {
            window.dispatchEvent(new CustomEvent('server:offline'));
            return Promise.reject({ success: false, error: 'Network connection failed. Check your connection.' });
        }

        window.dispatchEvent(new CustomEvent('server:online'));
        console.error('[API Error Body]:', response.data);

        if (response.status === 401) {
            setAuthToken(null);
            window.dispatchEvent(new CustomEvent('auth:expired'));
            return Promise.reject({ success: false, error: 'Session expired. Please log in again.' });
        }
        if (response.status === 403) {
            return Promise.reject({ success: false, error: response.data?.error || 'Access forbidden.' });
        }
        if (response.status >= 500) {
            return Promise.reject({ success: false, error: response.data?.error || 'Server error. Please try again shortly.' });
        }
        const message = response.data?.error || response.data?.message || 'An unexpected error occurred';
        return Promise.reject({ success: false, error: message });
    }
);


export const authAPI = {
    login: (email: string, password: string): Promise<AuthLoginResponse> => api.post('/auth/login', { email, password }),
    getProfile: (): Promise<AuthProfileResponse> => api.get('/auth/profile'),
};

export const certificateAPI = {
    verify: (publicId: string): Promise<CertificateVerificationResponse> => api.get(`/certificates/verify/${publicId}`),
    listMe: (page: number = 1): Promise<CertificateListResponse> => api.get(`/certificates?page=${page}`),
    issue: (certData: CertificateIssuePayload): Promise<CertificateIssueResponse> => api.post('/certificates', certData),
    revoke: (publicId: string): Promise<ApiResponse> => api.put(`/certificates/${publicId}/revoke`),
    reissue: (publicId: string, certData: CertificateIssuePayload): Promise<ApiResponse> => api.put(`/certificates/${publicId}/reissue`, certData),
};

export const draftAPI = {
    create: (certData: CertificateIssuePayload): Promise<any> => api.post('/drafts', certData),
    edit: (id: string, certData: CertificateIssuePayload): Promise<any> => api.put(`/drafts/${id}`, certData),
    list: (): Promise<any> => api.get('/drafts'),
    submit: (id: string): Promise<any> => api.put(`/drafts/${id}/submit`),
    verify: (id: string): Promise<any> => api.put(`/drafts/${id}/verify`),
    revertClerk: (id: string, remarks: string): Promise<any> => api.put(`/drafts/${id}/revert-clerk`, { remarks }),
    revertHOD: (id: string, remarks: string): Promise<any> => api.put(`/drafts/${id}/revert-hod`, { remarks }),
    approve: (id: string): Promise<any> => api.put(`/drafts/${id}/approve`),
};

export const userAPI = {
    list: (): Promise<any> => api.get('/auth/users'),
    edit: (id: string, data: { role?: string; department?: string }): Promise<any> => api.put(`/auth/users/${id}`, data),
    delete: (id: string): Promise<any> => api.delete(`/auth/users/${id}`),
};

export default api;
