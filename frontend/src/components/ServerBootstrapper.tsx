import React, { useState, useEffect } from 'react';
import { apiGatewayHealth, cryptoEngineHealth } from '../services/api';

interface ServerBootstrapperProps {
    children: React.ReactNode;
}

interface ServiceStatus {
    type: 'checking' | 'waking' | 'online';
    uptime?: number;
    functional?: boolean;
    version?: string;
    message?: string;
}

const SESSION_KEY = 'dna_server_awake';

const ServerBootstrapper: React.FC<ServerBootstrapperProps> = ({ children }) => {
    // If the session says it's awake, we initialize states as 'online' instantly.
    const isAwakeSession = sessionStorage.getItem(SESSION_KEY) === 'true';
    
    const [gatewayStatus, setGatewayStatus] = useState<ServiceStatus>({ type: isAwakeSession ? 'online' : 'checking' });
    const [cryptoStatus, setCryptoStatus] = useState<ServiceStatus>({ type: isAwakeSession ? 'online' : 'checking' });
    const [showLoader, setShowLoader] = useState(false);

    useEffect(() => {
        let mounted = true;
        
        // --- OFFLINE OBSERVER ---
        // If api.ts dispatches an offline event mid-session (e.g. timeout on dashboard)
        // we wipe memory and force the bootstrapper back up.
        const handleServerOffline = () => {
            sessionStorage.removeItem(SESSION_KEY);
            if (mounted) {
                setGatewayStatus({ type: 'checking' });
                setCryptoStatus({ type: 'checking' });
                setShowLoader(true);
                initiateChecks(); // Restart checks
            }
        };
        window.addEventListener('server:offline', handleServerOffline);

        // --- PREVENT BLINK ON LOCAL ---
        const timer = setTimeout(() => {
            if (mounted && !isAwakeSession) setShowLoader(true);
        }, 200);

        // --- PROGRESSIVE HEALTH CHECKING ---
        // Exponential backoff so we don't bombard the sleeping server if 10,000 users launch at once
        const pingGateway = async (attempt = 1) => {
            try {
                const data = await apiGatewayHealth();
                if (mounted) setGatewayStatus({ 
                    type: 'online', 
                    uptime: data.uptime, 
                    version: data.version 
                });
            } catch (error: any) {
                if (mounted) {
                    setGatewayStatus({ type: 'waking', message: error.error || 'Starting Node.js Gateway...' });
                    const waitTime = Math.min(attempt * 3000, 15000);
                    setTimeout(() => pingGateway(attempt + 1), waitTime);
                }
            }
        };

        const pingCrypto = async (attempt = 1) => {
            try {
                const data = await cryptoEngineHealth();
                if (mounted) setCryptoStatus({ 
                    type: 'online', 
                    uptime: data.uptime, 
                    functional: data.functional,
                    version: data.version
                });
            } catch (error: any) {
                if (mounted) {
                    const msg = error.is_cold_start ? 'Waking up Python Engine...' : 'Verifying Cryptography Pipeline...';
                    setCryptoStatus({ type: 'waking', message: msg });
                    const waitTime = Math.min(attempt * 3000, 15000);
                    setTimeout(() => pingCrypto(attempt + 1), waitTime); 
                }
            }
        };

        const initiateChecks = () => {
            // Only fire the network checks if we didn't bypass via Session memory
            if (sessionStorage.getItem(SESSION_KEY) !== 'true') {
                pingGateway();
                pingCrypto();
            }
        };

        // Fire on mount
        initiateChecks();

        return () => {
            mounted = false;
            clearTimeout(timer);
            window.removeEventListener('server:offline', handleServerOffline);
        };
    }, [isAwakeSession]);

    const isReady = gatewayStatus.type === 'online' && cryptoStatus.type === 'online';

    // Store in session once both hit online
    useEffect(() => {
        if (isReady) {
            sessionStorage.setItem(SESSION_KEY, 'true');
        }
    }, [isReady]);

    // If it's ready, immediately render the children!
    if (isReady) {
        return <>{children}</>;
    }

    // If it's not ready yet, but 200ms hasn't passed, render a blank frame 
    // instead of the wrapper to prevent a jarring visual "blink".
    if (!showLoader) {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--c-background, #0a0a0a)',
            color: 'var(--c-text, #ffffff)',
            zIndex: 9999,
            padding: '2rem',
            textAlign: 'center',
            animation: 'fadeIn 0.3s ease-in-out'
        }}>
            <div style={{
                position: 'relative',
                width: '64px',
                height: '64px',
                marginBottom: '2rem'
            }}>
                <div className="spinner-ring" style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: '4px solid rgba(255, 255, 255, 0.1)',
                    borderTopColor: 'var(--c-primary, #3b82f6)',
                    animation: 'spin 1s linear infinite'
                }}></div>
            </div>
            
            <h1 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 600, 
                marginBottom: '1rem',
                background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>
                Waking Up Secure Core
            </h1>
            
            <p style={{ 
                color: 'var(--c-text-muted, #9ca3af)', 
                maxWidth: '430px', 
                lineHeight: 1.6,
                fontSize: '0.95rem',
                marginBottom: '2rem'
            }}>
                Because we use free-tier hosting for demonstrations, the internal engines might take up to 50 seconds to initialize themselves.
            </p>

            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '1.5rem',
                width: '100%',
                maxWidth: '430px',
                textAlign: 'left'
            }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <StatusIcon status={gatewayStatus.type} />
                            <span style={{ fontWeight: 500 }}>API Core (Node.js)</span>
                        </div>
                        <StatusText status={gatewayStatus} />
                    </div>
                    {gatewayStatus.type === 'online' && (
                        <div style={{ marginLeft: '1.75rem', fontSize: '0.75rem', color: 'var(--c-text-muted, #9ca3af)' }}>
                            Uptime: {gatewayStatus.uptime}s • v{gatewayStatus.version}
                        </div>
                    )}
                </div>
                
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <StatusIcon status={cryptoStatus.type} />
                            <span style={{ fontWeight: 500 }}>Secure Cryptography (Python)</span>
                        </div>
                        <StatusText status={cryptoStatus} />
                    </div>
                    {cryptoStatus.type === 'online' && (
                        <div style={{ marginLeft: '1.75rem', fontSize: '0.75rem', color: 'var(--c-text-muted, #9ca3af)' }}>
                            Uptime: {cryptoStatus.uptime}s • Pipeline: {cryptoStatus.functional ? 'Functional ✅' : 'Failed ❌'}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

// Helper components for the checklist UI
const StatusIcon = ({ status }: { status: ServiceStatus['type'] }) => {
    if (status === 'online') {
        return (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        );
    }
    return (
        <div style={{ 
            width: '20px', 
            height: '20px', 
            borderRadius: '50%', 
            border: '2.5px solid #fbbf24',
            borderTopColor: 'transparent',
            animation: 'spin 1s linear infinite'
        }}></div>
    );
}

const StatusText = ({ status }: { status: ServiceStatus }) => {
    if (status.type === 'online') return <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>ONLINE</span>;
    if (status.type === 'waking') return (
        <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#fbbf24', fontSize: '0.85rem', fontWeight: 600, animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>WAKING UP</div>
            <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '2px' }}>{status.message}</div>
        </div>
    );
    return <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>CHECKING...</span>;
}

export default ServerBootstrapper;
