// Global Types Mapping the DNA Certificate System Domain 
// and Express API Gateway Response Shapes

export type Role = 'SuperAdmin' | 'HOD' | 'Clerk';

export type CertificateStatus = 'active' | 'revoked';

export interface AdminUser {
    _id: string;
    email: string;
    role: Role;
    department?: string;
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
}

export interface DecryptedMetadata {
    studentName: string;
    rollNumber: string;
    degree: string;
    department: string;
    graduationYear: number;
    cgpa: number;
}

export interface Certificate {
    public_id: string;
    status: CertificateStatus;
    issued_at: string;
    issued_by: string; // Admin reference ID
    verification_count: number;
    last_verified_at?: string;
    // Expanded conditionally depending on route/decode state
    metadata?: DecryptedMetadata;
    dna_payload?: string; // Restricted explicitly based on the return block
}

// ---- API Response Generics ---- //

export interface ApiResponse {
    success: boolean;
    error?: string;
}

// Authentication API Responses
export interface AuthLoginResponse extends ApiResponse {
    token: string;
    admin: AdminUser;
}

export interface AuthProfileResponse extends ApiResponse {
    admin: AdminUser;
}

// Certificate API Responses
export interface CertificateListResponse extends ApiResponse {
    certificates: Certificate[];
    total: number;
    page: number;
    pages?: number;
}

export interface CertificateIssuePayload {
    name: string;
    roll: string;
    degree: string;
    department: string;
    year: number;
    cgpa: number;
}

export interface CertificateIssueResponse extends ApiResponse {
    public_id: string;
    qr_code: string;
    verification_url: string;
}

export interface CertificateVerificationResponse extends ApiResponse {
    data: DecryptedMetadata;
    verified_at: string;
}
