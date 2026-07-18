'use client';

import { QRCodeCanvas } from 'qrcode.react';
import { Download } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import styles from './QRCodeDisplay.module.css';

interface QRCodeDisplayProps {
  value: string;
  title: string;
}

export default function QRCodeDisplay({ value, title }: QRCodeDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrValue, setQrValue] = useState(value);

  useEffect(() => {
    // Generate a full URL for the QR code so scanning it opens the browser directly
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/c/${value}`;
      if (qrValue !== url) {
        // Use setTimeout to avoid synchronous setState warning during render cycle
        setTimeout(() => setQrValue(url), 0);
      }
    }
  }, [value, qrValue]);

  const downloadQRCode = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = `QR_${title}_${value}.png`;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.qrWrapper} ref={qrRef}>
        <QRCodeCanvas 
          value={qrValue}
          size={256}
          level={"H"}
          includeMargin={true}
          bgColor={"#ffffff"}
          fgColor={"#1a2e1a"}
        />
      </div>
      <button onClick={downloadQRCode} className="btn btn-outline" style={{ marginTop: '1.5rem', width: '100%' }}>
        <Download size={20} />
        下載 QR Code 圖片
      </button>
      <a 
        href={`/c/${value}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="btn btn-primary" 
        style={{ marginTop: '0.75rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
      >
        開啟顧客展示頁 (另開視窗)
      </a>
    </div>
  );
}
