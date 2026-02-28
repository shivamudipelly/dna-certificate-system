import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ClipboardDocumentIcon, EyeIcon, NoSymbolIcon, LinkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Certificate } from '../../types';

interface CertificateTableProps {
    certificates: Certificate[];
    onView: (cert: Certificate) => void;
    onRevoke: (cert: Certificate) => void;
}

export default function CertificateTable({ certificates, onView, onRevoke }: CertificateTableProps) {
    const { user } = useAuth();

    const handleCopyId = (id: string) => {
        navigator.clipboard.writeText(id);
        toast.success('Public ID copied to clipboard');
    };

    const handleCopyLink = (id: string) => {
        // We assume the frontend URL structure for verification here
        const url = `${window.location.origin}/verify/${id}`;
        navigator.clipboard.writeText(url);
        toast.success('Verification Link copied to clipboard');
    };

    if (!certificates || certificates.length === 0) {
        return (
            <div className="text-center p-12 bg-white border border-gray-100 rounded-lg shadow-sm">
                <p className="text-gray-500 text-sm">No DNA Certificates found matching current filters.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Public ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student & Roll</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Data</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">Date Issued</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Checks</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {certificates.map((cert) => {
                        if (!cert) return null;
                        const meta = cert.metadata || ({} as any);

                        return (
                            <tr key={cert.public_id || Math.random()} className="hover:bg-gray-50 transition-colors">

                                {/* ID & Copy */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                                    <span className="font-mono text-primary-700">{cert.public_id || 'UNKNOWN'}</span>
                                    <button onClick={() => cert.public_id && handleCopyId(cert.public_id)} className="ml-2 text-gray-400 hover:text-gray-600 focus:outline-none">
                                        <ClipboardDocumentIcon className="h-4 w-4" />
                                    </button>
                                </td>

                                {/* Student Info */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{meta.studentName || 'Restricted Payload'}</div>
                                    <div className="text-sm text-gray-500">{meta.rollNumber || 'N/A'}</div>
                                </td>

                                {/* Batch/Degree */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{meta.degree || 'N/A'}</div>
                                    <div className="text-xs text-gray-500">{meta.department || 'N/A'}</div>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(cert.issued_at).toLocaleDateString()}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-600">
                                    {cert.verification_count} Logs
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${cert.status === 'revoked' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {cert.status ? cert.status.toUpperCase() : 'ACTIVE'}
                                    </span>
                                </td>

                                {/* Secure Action Links */}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-3">
                                        <button
                                            onClick={() => handleCopyLink(cert.public_id)}
                                            className="text-gray-400 hover:text-primary-600 transition-colors"
                                            title="Copy Verification Link"
                                        >
                                            <LinkIcon className="h-5 w-5" />
                                        </button>

                                        <button
                                            onClick={() => onView(cert)}
                                            className="text-primary-600 hover:text-primary-900 transition-colors"
                                            title="Inspect Full Decryption"
                                        >
                                            <EyeIcon className="h-5 w-5" />
                                        </button>

                                        {/* Role Based Rendering specifically locking out standard Admins */}
                                        {user?.role === 'SuperAdmin' && cert.status !== 'revoked' && (
                                            <button
                                                onClick={() => onRevoke(cert)}
                                                className="text-red-500 hover:text-red-900 transition-colors"
                                                title="Revoke Certificate (Danger Zone)"
                                            >
                                                <NoSymbolIcon className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
