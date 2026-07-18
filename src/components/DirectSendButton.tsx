'use client';

import { useState } from 'react';
import { Gift, X } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

interface DirectSendButtonProps {
  couponId: string;
}

export default function DirectSendButton({ couponId }: DirectSendButtonProps) {
  const [isSending, setIsSending] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDirectSend = async () => {
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/coupons/${couponId}/direct-send`, {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setGeneratedCode(data.code);
        setIsModalOpen(true);
      } else {
        setError(data.error || '派發失敗');
        alert(data.error || '派發失敗，可能已無可用序號');
      }
    } catch (err) {
      console.error(err);
      setError('網路異常');
      alert('網路異常，請稍後再試');
    } finally {
      setIsSending(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setGeneratedCode(null);
  };

  return (
    <>
      <button 
        className="btn" 
        onClick={handleDirectSend} 
        disabled={isSending}
        style={{ backgroundColor: 'var(--primary-color)', color: 'white', border: 'none' }}
      >
        <Gift size={20} />
        {isSending ? '派發中...' : '直接送券'}
      </button>

      {isModalOpen && generatedCode && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '90%',
            width: '400px',
            position: 'relative',
            textAlign: 'center'
          }}>
            <button 
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              <X size={24} />
            </button>
            
            <h2 className="h3" style={{ marginBottom: '1.5rem', color: '#2c3e2e' }}>🎁 送券成功</h2>
            <p style={{ marginBottom: '1.5rem', color: '#666' }}>請讓客人掃描下方 QR Code，或提供這組序號：</p>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: '1.5rem',
              background: '#f9f9f9',
              padding: '1rem',
              borderRadius: '8px'
            }}>
              <QRCodeCanvas 
                value={`${window.location.origin}/c/${generatedCode}`}
                size={200}
                level={"H"}
                includeMargin={true}
              />
            </div>
            
            <div style={{
              background: '#e8f0e8',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: '#2c3e2e',
              letterSpacing: '2px'
            }}>
              {generatedCode}
            </div>
            
            <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#999' }}>
              此序號已標記為發送，可直接由客人核銷。
            </p>
          </div>
        </div>
      )}
    </>
  );
}
