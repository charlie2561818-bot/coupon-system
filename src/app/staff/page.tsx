'use client';

import { useState, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, Scan, Camera } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import styles from './page.module.css';

export default function StaffScannerPage() {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error', message: string, detail?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastScannedCode = useRef<string | null>(null);
  const lastScannedTime = useRef<number>(0);
  const isLoadingRef = useRef<boolean>(false);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto focus on mount
  useEffect(() => {
    if (!isScanning) {
      inputRef.current?.focus();
    }
  }, [isScanning]);

  const handleContainerClick = () => {
    if (!isScanning) {
      inputRef.current?.focus();
    }
  };

  const extractCode = (input: string) => {
    try {
      const url = new URL(input);
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length > 0 && segments[0] === 'c') {
        return segments[segments.length - 1];
      }
      return input.trim();
    } catch {
      return input.trim();
    }
  };

  const processRedeem = async (rawInput: string) => {
    if (!rawInput.trim() || isLoadingRef.current) return;

    const code = extractCode(rawInput);
    setIsLoading(true);
    isLoadingRef.current = true;
    setResult(null);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ type: 'error', message: '核銷失敗', detail: data.error || '未知的錯誤' });
      } else {
        setResult({ 
          type: 'success', 
          message: '核銷成功！', 
          detail: `優惠券：${data.coupon.title} (已核銷: ${data.coupon.redeemedQuantity}/${data.coupon.totalQuantity})` 
        });
      }
    } catch (err) {
      setResult({ type: 'error', message: '系統錯誤', detail: '無法連接至伺服器' });
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
      setInputValue(''); 
      setTimeout(() => inputRef.current?.focus(), 100);

      toastTimerRef.current = setTimeout(() => {
        setResult(null);
      }, 3000);
    }
  };

  const handleRedeemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processRedeem(inputValue);
  };

  const handleCameraScan = (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const scannedValue = detectedCodes[0].rawValue;
      const now = Date.now();

      // If currently loading/processing an API request, ignore
      if (isLoadingRef.current) return;

      // If same code scanned within 2 seconds, ignore
      if (scannedValue === lastScannedCode.current && (now - lastScannedTime.current) < 2000) {
        return;
      }

      lastScannedCode.current = scannedValue;
      lastScannedTime.current = now;

      setInputValue(scannedValue);
      processRedeem(scannedValue);
    }
  };

  return (
    <div className={styles.container} onClick={handleContainerClick}>
      <div className={`card ${styles.scannerCard} glass-panel`}>
        <div className={styles.iconWrapper}>
          <Scan size={40} className={styles.scanIcon} />
        </div>
        <h1 className="h2" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>掃描優惠券</h1>
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          請使用掃描槍或相機讀取顧客的 QR Code
        </p>

        {isScanning ? (
          <div style={{ width: '100%', marginBottom: '1rem' }}>
            <Scanner 
              onScan={handleCameraScan} 
              onError={(error) => console.log(error?.message)} 
            />
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ width: '100%', marginTop: '1rem' }}
              onClick={() => setIsScanning(false)}
            >
              取消相機掃描
            </button>
          </div>
        ) : (
          <form onSubmit={handleRedeemSubmit} className={styles.form} suppressHydrationWarning>
            <input
              ref={inputRef}
              type="text"
              className={`form-input ${styles.hugeInput}`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="等待掃描或輸入序號..."
              disabled={isLoading}
              autoComplete="off"
              autoFocus
              suppressHydrationWarning
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-outline"
                style={{ flex: 1, padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                onClick={() => setIsScanning(true)}
              >
                <Camera size={24} />
              </button>
              <button 
                type="submit" 
                className={`btn btn-primary ${styles.submitBtn}`}
                style={{ flex: 4 }}
                disabled={isLoading || !inputValue.trim()}
              >
                {isLoading ? <Loader2 className={styles.spinner} /> : '確認核銷'}
              </button>
            </div>
          </form>
        )}

        {result && (
          <div className={`${styles.resultAlert} ${result.type === 'success' ? styles.resultSuccess : styles.resultError}`}>
            {result.type === 'success' ? <CheckCircle size={32} /> : <XCircle size={32} />}
            <div className={styles.resultText}>
              <div className={styles.resultTitle}>{result.message}</div>
              {result.detail && <div className={styles.resultDetail}>{result.detail}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
