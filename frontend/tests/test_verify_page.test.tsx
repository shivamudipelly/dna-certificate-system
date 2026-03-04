import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Verify from '../src/pages/public/Verify';
import { certificateAPI } from '../src/services/api';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../src/services/api', () => ({
    certificateAPI: {
        verify: vi.fn(),
    },
}));

vi.mock('../src/context/AuthContext', () => ({
    useAuth: () => ({
        isAuthenticated: false,
        user: null
    })
}));

describe('Verify Page Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderVerify = (initialRoute = '/verify/test_id_123') => {
        render(
            <MemoryRouter initialEntries={[initialRoute]}>
                <Routes>
                    <Route path="/verify/:id" element={<Verify />} />
                    <Route path="/verify" element={<Verify />} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('loads standard verified certificate template view', async () => {
        (certificateAPI.verify as any).mockResolvedValueOnce({
            success: true,
            data: {
                name: 'Test Student',
                roll: '22EG105J38',
                degree: 'B.Tech',
                department: 'IT',
                year: 2026,
                cgpa: 9.85
            },
            verified_at: new Date().toISOString(),
            qr_code: 'data:image/png;base64,mock_qr'
        });

        renderVerify();

        expect(screen.getByText(/Deconstructing Cryptographic Blocks/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(certificateAPI.verify).toHaveBeenCalledWith('test_id_123');
        });

        await waitFor(() => {
            expect(screen.getByText(/Authentic Record Verified/i)).toBeInTheDocument();
        });
    });

    it('maps explicitly to Tamper Warning natively', async () => {
        const tamperErr = new Error('TAMPERED');
        Object.assign(tamperErr, { response: { status: 403, data: { error: 'TAMPERED' } }, error: 'TAMPERED', status: 403 });

        (certificateAPI.verify as any).mockRejectedValueOnce(tamperErr);

        renderVerify();

        await waitFor(() => {
            expect(screen.getByText(/Forged \/ Tampered Certificate/i)).toBeInTheDocument();
        });
    });

    it('blocks natively resolving Revoked blocks', async () => {
        const revokedErr = new Error('Revoked');
        Object.assign(revokedErr, { response: { status: 403, data: { error: 'revoked admin' } }, error: 'revoked' });

        (certificateAPI.verify as any).mockRejectedValueOnce(revokedErr);

        renderVerify();

        await waitFor(() => {
            expect(screen.getByText(/Access Revoked/i)).toBeInTheDocument();
        });
    });

    it('catches non-existent strings returning 404 cleanly', async () => {
        const notFoundErr = new Error('Not found');
        Object.assign(notFoundErr, { response: { status: 404 }, error: 'Not found' });

        (certificateAPI.verify as any).mockRejectedValueOnce(notFoundErr);

        renderVerify();

        await waitFor(() => {
            expect(screen.getByText(/Certificate Hash Unmatched/i)).toBeInTheDocument();
        });
    });

    it('searches correctly without initial dynamic route', async () => {
        renderVerify('/verify');

        expect(screen.getByText(/Cryptographic Integrity Search/i)).toBeInTheDocument();

        const input = screen.getByPlaceholderText(/Enter Public ID/i);
        fireEvent.change(input, { target: { value: 'some_long_id' } });

        const btn = screen.getByRole('button', { name: /Verify/i });
        fireEvent.click(btn);
    });

});
