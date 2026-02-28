import React from 'react';
import { Certificate, DecryptedMetadata } from '../../types';

interface TemplateProps {
    metadata: DecryptedMetadata;
    publicId: string;
    issueDate: string;
    verificationDate: string;
    qrCodeDataUrl?: string; // Standard verification link wrapped locally
}

const CertificateTemplate = ({ metadata, publicId, issueDate, verificationDate, qrCodeDataUrl }: TemplateProps) => {

    return (
        <div id="print-certificate-target" className="relative w-full max-w-4xl mx-auto bg-white p-8 sm:p-12 md:p-16 border-[12px] border-double border-gray-800 shadow-2xl rounded-sm">

            {/* Background Watermark SVG Logo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <svg viewBox="0 0 100 100" fill="currentColor" className="w-[80%] h-[80%] text-primary-900">
                    <path d="M50 0 C77.6 0 100 22.4 100 50 C100 77.6 77.6 100 50 100 C22.4 100 0 77.6 0 50 C0 22.4 22.4 0 50 0 Z M50 90 C72.1 90 90 72.1 90 50 C90 27.9 72.1 10 50 10 C27.9 10 10 27.9 10 50 C10 72.1 27.9 90 50 90 Z" />
                    <circle cx="50" cy="50" r="30" />
                </svg>
            </div>

            <div className="relative z-10 text-center space-y-8">

                {/* Header Sequence */}
                <div className="border-b-[3px] border-primary-800 pb-8 flex flex-col items-center">
                    <div className="h-20 w-20 bg-primary-800 text-white flex items-center justify-center rounded-full mb-6">
                        <span className="text-4xl">🎓</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-serif font-bold text-gray-900 tracking-wider">
                        University of Cryptography
                    </h1>
                    <p className="tracking-[0.2em] text-gray-500 uppercase mt-2 font-medium">Veritas in Numeris</p>
                </div>

                {/* Body Mapping */}
                <div className="py-8 space-y-6">
                    <p className="text-xl sm:text-2xl text-gray-600 font-serif italic">
                        This is to certify that
                    </p>
                    <h2 className="text-5xl sm:text-6xl font-bold text-primary-900 font-serif pb-4 tracking-tight">
                        {metadata.studentName}
                    </h2>

                    <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-8 text-gray-700 bg-gray-50 py-4 px-8 rounded-full shadow-inner inline-flex">
                        <p><span className="text-gray-500 font-medium">Roll No:</span> <strong className="font-mono">{metadata.rollNumber}</strong></p>
                        <span className="hidden sm:inline w-1 h-1 bg-gray-300 rounded-full"></span>
                        <p><span className="text-gray-500 font-medium">CGPA:</span> <strong>{metadata.cgpa}</strong></p>
                    </div>

                    <div className="text-xl sm:text-2xl text-gray-800 font-serif py-4">
                        <p>has successfully met the academic conditions to receive the</p>
                    </div>

                    <div className="space-y-2 text-primary-800 pb-8">
                        <h3 className="text-3xl sm:text-4xl font-black uppercase tracking-widest">{metadata.degree}</h3>
                        <h4 className="text-2xl sm:text-3xl font-medium text-gray-700">Department of {metadata.department}</h4>
                        <p className="text-lg text-gray-500 tracking-wider uppercase pt-2">Class of {metadata.graduationYear}</p>
                    </div>
                </div>

                {/* Signatures & Output Metas */}
                <div className="flex flex-col sm:flex-row justify-between items-end mt-16 pt-8 border-t border-gray-200">

                    {/* QR Placeholder Grid */}
                    <div className="w-full sm:w-1/3 flex flex-col items-center sm:items-start mb-8 sm:mb-0">
                        {qrCodeDataUrl ? (
                            <img src={qrCodeDataUrl} alt="Verify Block Signature" className="w-32 h-32 border p-1 rounded bg-white shadow-sm" />
                        ) : (
                            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded bg-gray-50 flex items-center justify-center text-xs text-gray-400">QR Sync Loss</div>
                        )}
                        <span className="text-[10px] text-gray-500 font-mono mt-2 tracking-widest bg-gray-100 px-2 py-1 rounded">ID: {publicId}</span>
                    </div>

                    {/* Meta Dates & Security Signature */}
                    <div className="w-full sm:w-2/3 flex flex-col sm:flex-row justify-end space-y-6 sm:space-y-0 sm:space-x-12">

                        <div className="text-center">
                            <div className="border-b border-gray-400 w-32 mx-auto pb-2 mb-2">
                                <p className="font-medium text-gray-800 text-sm">{new Date(issueDate).toLocaleDateString()}</p>
                            </div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Date Issued</p>
                        </div>

                        <div className="text-center">
                            <div className="border-b border-gray-400 w-48 mx-auto pb-4 mb-2 flex justify-center items-end">
                                {/* Digital Sig Font Replacement Map */}
                                <span className="font-serif italic text-2xl text-primary-800 leading-none">A. Controller</span>
                            </div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Controller of Examinations</p>
                        </div>

                    </div>
                </div>

                {/* Cryptographic Footprint Banner */}
                <div className="absolute -bottom-[20px] left-1/2 transform -translate-x-1/2 bg-gray-900 text-gray-400 px-6 py-1.5 rounded-full text-[10px] uppercase font-mono tracking-[0.2em] shadow-lg border border-gray-700 whitespace-nowrap hidden sm:block">
                    Validating DNA Decryption Block: <span className="text-white bg-gray-800 px-2 rounded ml-1">{new Date(verificationDate).toISOString()}</span>
                </div>

            </div>
        </div>
    );
};

export default CertificateTemplate;
