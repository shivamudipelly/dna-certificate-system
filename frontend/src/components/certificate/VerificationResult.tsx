import React from 'react';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import { PrinterIcon, ArrowDownTrayIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import CertificateTemplate from './CertificateTemplate';
import { DecryptedMetadata } from '../../types';

interface VerificationResultProps {
    publicId: string;
    metadata: DecryptedMetadata;
    verifiedAt: string;
    issueDate?: string;
    verificationCount?: number;
    qrCodeDataUrl?: string; // Standard verification link wrapped locally
}

export default function VerificationResult({ publicId, metadata, verifiedAt, issueDate = new Date().toISOString(), verificationCount = 1, qrCodeDataUrl }: VerificationResultProps) {

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in-up">

            {/* Header Success Animation Banner */}
            <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden text-center flex flex-col items-center justify-center p-8 sm:p-12 relative print:hidden">
                <div className="absolute top-0 inset-x-0 h-4 bg-green-500"></div>
                <div className="bg-green-50 rounded-full p-4 mb-6 shadow-inner ring-4 ring-green-100 animate-bounce-short">
                    <CheckBadgeIcon className="h-20 w-20 text-green-500" />
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center">
                    Valid Authentic Record
                </h2>

                <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto font-medium">
                    This document's cryptographic DNA hash matches the immutable university ledger structurally.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 w-full max-w-3xl justify-items-center">
                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl shadow-sm text-center w-full">
                        <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Public ID Block</p>
                        <p className="font-mono text-gray-800 font-bold text-lg mt-1">{publicId}</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl shadow-sm text-center w-full">
                        <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Global Pings</p>
                        <p className="text-gray-800 font-bold text-lg mt-1">{verificationCount} Validation Hits</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl shadow-sm text-center w-full">
                        <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Timestamp</p>
                        <p className="text-gray-800 font-bold text-sm mt-1">{new Date(verifiedAt).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Print Specific CSS Hook / Component Render Wrapper */}
            <div className="print:block">
                <CertificateTemplate
                    metadata={metadata}
                    publicId={publicId}
                    issueDate={issueDate}
                    verificationDate={verifiedAt}
                    qrCodeDataUrl={qrCodeDataUrl}
                />
            </div>

            {/* Action Bar Footer */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">

                {/* Visual Security Metadata */}
                <div className="text-sm text-gray-500 font-medium">
                    <p>Secured by Cryptographic DNA Sequencing Microservices</p>
                </div>

                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-bold rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors flex-1 sm:flex-none"
                    >
                        <PrinterIcon className="h-5 w-5 mr-2" /> Print Verification Copy
                    </button>

                    {/* PDF hook would utilize external library like jsPDF in production */}
                    <button
                        onClick={() => toast.success('PDF Engine Generation Triggered... (Simulating)')}
                        className="inline-flex items-center justify-center px-4 py-2 border border-primary-600 shadow-sm text-sm font-bold rounded-lg text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors flex-1 sm:flex-none"
                    >
                        <ArrowDownTrayIcon className="h-5 w-5 mr-2" /> Download PDF
                    </button>

                    <a
                        href="/contact"
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex-1 sm:flex-none"
                    >
                        <ShieldExclamationIcon className="h-5 w-5 mr-2" /> Report Issue
                    </a>
                </div>
            </div>

            {/* Minimal CSS for print control isolated visually without polluting global */}
            <style>{`
                @media print {
                    body { background: white; margin: 0; padding: 0; }
                    .print\\:hidden { display: none !important; }
                    .print\\:block { display: block !important; }
                    #print-certificate-target {
                        box-shadow: none !important;
                        border: 2px solid black !important;
                        margin: 0 !important;
                        max-width: 100% !important;
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    );
};
