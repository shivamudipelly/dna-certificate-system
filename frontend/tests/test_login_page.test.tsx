import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../src/pages/Login';
import { AuthProvider } from '../src/context/AuthContext';
import { authAPI } from '../src/services/api';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Fix matchMedia error in JSDOM testing
if (typeof window !== 'undefined') {
    window.matchMedia = window.matchMedia || function () {
        return {
            matches: false,
            addListener: function () { },
            removeListener: function () { }
        };
    };
}

vi.mock('../src/services/api', () => ({
    authAPI: {
        login: vi.fn(),
        getProfile: vi.fn()
    },
    certificateAPI: {}
}));

describe('Login Page Tests', () => {

    const renderLogin = () => {
        render(
            <BrowserRouter>
                <AuthProvider>
                    <Login />
                </AuthProvider>
            </BrowserRouter>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders login form properly', () => {
        renderLogin();
        expect(screen.getByPlaceholderText(/staff@university.edu/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    });

    it('shows validation errors for empty fields', async () => {
        renderLogin();
        fireEvent.click(screen.getByRole('button', { name: /Authenticate Access/i }));

        await waitFor(() => {
            expect(screen.getByText(/Email address is required/i)).toBeInTheDocument();
        });
    });

    it('calls logic natively on correct submit', async () => {
        authAPI.login.mockResolvedValueOnce({
            success: true,
            token: 'mock-token',
            admin: { email: 'superadmin@dna.local', role: 'SuperAdmin' }
        });

        renderLogin();
        fireEvent.change(screen.getByPlaceholderText(/staff@university.edu/i), { target: { value: 'superadmin@dna.local' } });
        fireEvent.change(screen.getByPlaceholderText(/••••••••/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /Authenticate Access/i }));

        await waitFor(() => {
            expect(authAPI.login).toHaveBeenCalledWith('superadmin@dna.local', 'password123');
        });
    });
});
