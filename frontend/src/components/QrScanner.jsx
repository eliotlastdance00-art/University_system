import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { verifyQrCode } from '../api/attendance';
import { Camera, CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react';

const QrScanner = ({ onScanSuccess, onScanFailure }) => {
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // html5-qrcode scanner setup
        const scanner = new Html5QrcodeScanner(
            "qr-reader",
            { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
            false
        );

        const onScan = async (decodedText) => {
            scanner.clear(); // Stop scanning after successful read
            
            try {
                // Decode Base64 JSON
                const decodedData = JSON.parse(atob(decodedText));
                
                if (!decodedData.sid || !decodedData.tkn) {
                    throw new Error("Invalid QR format");
                }

                setLoading(true);
                setError(null);
                
                const response = await verifyQrCode({
                    session_id: decodedData.sid,
                    token: decodedData.tkn
                });

                setScanResult(response.data);
                if (onScanSuccess) onScanSuccess();

            } catch (err) {
                console.error(err);
                if (err.name === 'SyntaxError' || err.message === "Invalid QR format") {
                    setError("Scanned QR code is not valid for this system.");
                } else {
                    setError(err.response?.data?.detail || "Verification failed. You might have scanned an expired code or are not enrolled.");
                }
                if (onScanFailure) onScanFailure();
            } finally {
                setLoading(false);
            }
        };

        scanner.render(onScan, (err) => {
             // Ignoring continuous scan errors (usually "no qr found")
        });

        // Cleanup
        return () => {
            scanner.clear().catch(e => console.error("Failed to clear scanner", e));
        };
    }, [onScanSuccess, onScanFailure]);


    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <RefreshCw size={40} className="spin" color="var(--accent-primary)" style={{ marginBottom: 'var(--space-4)' }}/>
                <h3>Verifying...</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Checking attendance records</p>
            </div>
        );
    }

    if (scanResult) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                <div style={{ 
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
                    width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: 'var(--success)',
                    marginBottom: 'var(--space-4)'
                }}>
                    <CheckCircle size={32} />
                </div>
                <h3>{scanResult.message}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>You have been marked {scanResult.status}.</p>
                <button className="btn btn-secondary" onClick={() => setScanResult(null)} style={{ marginTop: 'var(--space-4)' }}>
                    Scan Another
                </button>
            </div>
        );
    }

    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                <Camera size={18} /> Point your camera at the teacher's QR code
            </div>
            
            {error && (
                <div style={{ marginBottom: 'var(--space-4)', color: 'var(--error)', padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', textAlign: 'left', display: 'flex', gap: 8 }}>
                    <AlertCircle size={20} style={{ flexShrink: 0 }}/>
                    <div style={{ fontSize: 14 }}>{error}</div>
                </div>
            )}

            <div style={{ borderRadius: '16px', overflow: 'hidden', border: '2px solid var(--border-color)' }}>
                <div id="qr-reader" style={{ width: '100%', border: 'none' }}></div>
            </div>
            
            {error && (
                <button className="btn btn-secondary" onClick={() => setError(null)} style={{ marginTop: 'var(--space-4)', width: '100%' }}>
                    Try Again
                </button>
            )}
        </div>
    );
};

export default QrScanner;
