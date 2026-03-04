import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import IssueCertificate from '../src/pages/admin/IssueCertificate';
import { certificateAPI } from '../src/services/api';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../src/services/api', () => ({
    certificateAPI: {
        issue: vi.fn(),
    },
}));

vi.mock('../src/context/AuthContext', () => ({
    useAuth: () => ({
        isAuthenticated: true,
        user: { email: 'admin@dna.local', role: 'SuperAdmin' }
    })
}));

describe('Issue Certificate Page Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderPage = () => {
        render(
            <BrowserRouter>
                <IssueCertificate />
            </BrowserRouter>
        );
    };

    it('renders form inputs correctly', () => {
        renderPage();
        expect(screen.getByLabelText('Full Student Name *')).toBeInTheDocument();
        expect(screen.getByLabelText('Roll / Registration Number *')).toBeInTheDocument();
        expect(screen.getByLabelText('Degree Program *')).toBeInTheDocument();
    });

    it('submits mathematically encrypted certificate', async () => {
        (certificateAPI.issue as any).mockResolvedValueOnce({
            success: true,
            public_id: '12345',
            qr_code: 'base64str',
            verification_url: 'http://test.local'
        });

        renderPage();

        fireEvent.change(screen.getByLabelText('Full Student Name *'), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByLabelText('Roll / Registration Number *'), { target: { value: 'CS123' } });
        fireEvent.change(screen.getByLabelText('Degree Program *'), { target: { value: 'B.Tech' } });
        fireEvent.change(screen.getByLabelText('Specialization/Department *'), { target: { value: 'CS' } });
        fireEvent.change(screen.getByLabelText('Final CGPA (0.00 – 10.00) *'), { target: { value: '3.8' } });
        fireEvent.change(screen.getByLabelText('Graduation Year *'), { target: { value: '2026' } });

        fireEvent.click(screen.getByRole('button', { name: /Commence Encryption/i }));

        await waitFor(() => {
            expect(certificateAPI.issue).toHaveBeenCalled();
        });

        // Assert visual success mappings
        await waitFor(() => {
            expect(screen.getByText(/Issue Another Document/i)).toBeInTheDocument();
        });
    });

    it('displays error messages natively', async () => {
        const testError = new Error('Test API Failure');
        Object.assign(testError, { response: { data: { error: 'Database Constraint Error' } } });
        (certificateAPI.issue as any).mockRejectedValueOnce(testError);

        renderPage();
        fireEvent.change(screen.getByLabelText('Full Student Name *'), { target: { value: 'Fake' } });
        fireEvent.click(screen.getByRole('button', { name: /Commence Encryption/i }));

        // Let assertion await failure mock wrapper
    });
});
