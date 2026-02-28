import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { EnvelopeIcon, ArrowPathIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

const TamperWarning = ({ publicId }: { publicId: string }) => {
    return (
        <div className="bg-white rounded-2xl shadow-2xl border border-red-100 overflow-hidden max-w-2xl mx-auto transform transition-all">

            {/* Header Red Massive Banner */}
            <div className="bg-red-600 px-6 py-8 text-center flex flex-col items-center justify-center">
                <div className="bg-white rounded-full p-4 shadow-lg mb-4 animate-pulse">
                    <ExclamationTriangleIcon className="h-16 w-16 text-red-600" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-widest uppercase">
                    ❌ Forged / Tampered Certificate
                </h1>
            </div>

            {/* Content Context */}
            <div className="px-6 py-8 sm:p-10 text-center space-y-6">
                <div className="space-y-3">
                    <p className="text-xl font-bold text-gray-900 border-b pb-4">
                        Critical Security Alert
                    </p>
                    <p className="text-base text-red-700 font-semibold bg-red-50 p-4 rounded-lg border border-red-100">
                        This certificate has been mathematically altered or corrupted.
                    </p>
                    <p className="text-gray-600">
                        The cryptographic DNA sequence XOR hash (<span className="font-mono text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{publicId}</span>) does strictly not match our immutable engine records.
                    </p>
                    <p className="text-lg font-bold text-gray-900 mt-4">
                        Do not accept this document as valid proof of identity or academic record.
                    </p>
                </div>

                {/* Actions Flex */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-8">
                    <button
                        onClick={() => window.open(`mailto:security@university.edu?subject=Fraudulent Certificate Report: ${publicId}`)}
                        className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-red-600 hover:text-red-700"
                    >
                        <EnvelopeIcon className="h-8 w-8 mb-2" />
                        <span className="text-sm font-bold">Report Fraud</span>
                    </button>

                    <a
                        href="/contact"
                        className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
                    >
                        <BuildingOfficeIcon className="h-8 w-8 mb-2 text-gray-400" />
                        <span className="text-sm font-semibold">Contact University</span>
                    </a>

                    <button
                        onClick={() => window.location.reload()}
                        className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-primary-600 hover:text-primary-700"
                    >
                        <ArrowPathIcon className="h-8 w-8 mb-2" />
                        <span className="text-sm font-semibold">Try Scan Again</span>
                    </button>
                </div>
            </div>

            {/* Security Footer Tracking Line */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-xs text-center text-gray-400">
                Tamper attempt logged natively by Central Systems to IP / Server Security at {new Date().toISOString()}
            </div>
        </div>
    );
};

export default TamperWarning;
