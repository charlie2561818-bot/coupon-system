'use client';

import { useState, useRef, useEffect } from 'react';
import { Gift, X, Check, Copy } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

interface DirectSendButtonProps {
  couponId: string;
}

export default function DirectSendButton({ couponId }: DirectSendButtonProps) {
  const [isSending, setIsSending] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleDirectSend = async () => {
    setIsSending(true);
    try {
      const res = await fetch(`/api/coupons/${couponId}/direct-send`, {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setGeneratedCode(data.code);
        setIsModalOpen(true);
      } else {
        alert(data.error || '派發失敗，可能已無可用序號');
      }
    } catch (err) {
      console.error(err);
      alert('網路異常，請稍後再試');
    } finally {
      setIsSending(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setGeneratedCode(null);
    setIsCopied(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleCopyLink = async () => {
    if (!generatedCode) return;
    const url = `${window.location.origin}/c/${generatedCode}`;
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for older Line browsers or non-HTTPS environments
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!successful) throw new Error('execCommand copy failed');
      }
      
      setIsCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('複製失敗，請手動複製');
    }
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
              letterSpacing: '2px',
              marginBottom: '1.5rem'
            }}>
              {generatedCode}
            </div>

            <button 
              onClick={handleCopyLink}
              className="btn btn-outline"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                width: '100%',
                justifyContent: 'center',
                backgroundColor: isCopied ? 'var(--success-color)' : 'transparent',
                color: isCopied ? '#fff' : 'var(--primary-color)',
                borderColor: isCopied ? 'var(--success-color)' : 'var(--primary-color)',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {isCopied ? (
                <>
                  <Check size={18} />
                  已複製！(Copied!)
                </>
              ) : (
                <>
                  <Copy size={18} />
                  複製專屬連結 (Copy Link)
                </>
              )}
            </button>
            
            <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#999' }}>
              此序號已標記為發送，可直接由客人核銷。
            </p>
          </div>
        </div>
      )}
    </>
  );
}
