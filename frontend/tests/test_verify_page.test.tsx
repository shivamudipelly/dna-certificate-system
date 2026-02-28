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
        certificateAPI.verify.mockResolvedValueOnce({
            success: true,
            data: { studentName: 'Test Student', stringData: 'map' },
            verified_at: new Date().toISOString()
        });

        renderVerify();

        expect(screen.getByText(/Deconstructing Cryptographic Blocks/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(certificateAPI.verify).toHaveBeenCalledWith('test_id_123');
        });

        await waitFor(() => {
            expect(screen.getByText(/Valid Authentic Record/i)).toBeInTheDocument();
        });
    });

    it('maps explicitly to Tamper Warning natively', async () => {
        const tamperErr = new Error('TAMPERED');
        Object.assign(tamperErr, { response: { status: 403, data: { error: 'TAMPERED' } }, error: 'TAMPERED', status: 403 });

        certificateAPI.verify.mockRejectedValueOnce(tamperErr);

        renderVerify();

        await waitFor(() => {
            expect(screen.getByText(/Forged \/ Tampered Certificate/i)).toBeInTheDocument();
        });
    });

    it('blocks natively resolving Revoked blocks', async () => {
        const revokedErr = new Error('Revoked');
        Object.assign(revokedErr, { response: { status: 403, data: { error: 'revoked admin' } }, error: 'revoked' });

        certificateAPI.verify.mockRejectedValueOnce(revokedErr);

        renderVerify();

        await waitFor(() => {
            expect(screen.getByText(/Access Revoked/i)).toBeInTheDocument();
        });
    });

    it('catches non-existent strings returning 404 cleanly', async () => {
        const notFoundErr = new Error('Not found');
        Object.assign(notFoundErr, { response: { status: 404 }, error: 'Not found' });

        certificateAPI.verify.mockRejectedValueOnce(notFoundErr);

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
