'use client';

import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import styles from './liff.module.css';

interface ClaimResult {
  success: boolean;
  code?: string;
  message?: string;
  alreadyClaimed?: boolean;
}

export default function LiffClaimPage() {
  const [liffError, setLiffError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [qrValue, setQrValue] = useState('');

  useEffect(() => {
    if (result?.code && typeof window !== 'undefined') {
      setQrValue(`${window.location.origin}/c/${result.code}`);
    }
  }, [result?.code]);

  useEffect(() => {
    // 由於 liff 是 client-side library，必須在 useEffect 中載入與執行
    const initLiff = async () => {
      try {
        const liff = (await import('@line/liff')).default;
        
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) {
          throw new Error('請在 Vercel 環境變數中設定 NEXT_PUBLIC_LIFF_ID');
        }

        await liff.init({ liffId });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const profile = await liff.getProfile();
        
        // 開始呼叫後端領券 API
        await claimCoupon(profile.userId, profile.displayName);

      } catch (err: any) {
        console.error('LIFF 初始化失敗:', err);
        setLiffError(err.message || '初始化失敗，請在 LINE App 中開啟此連結。');
        setIsInitializing(false);
      }
    };

    initLiff();
  }, []);

  const claimCoupon = async (userId: string, displayName: string) => {
    setIsClaiming(true);
    try {
      // 假設未來 API 叫做 /api/line-claim
      // 這裡先使用 setTimeout 模擬打 API 的過程 (前端先完成畫面規劃)
      
      const res = await fetch('/api/line-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, displayName })
      });
      
      // 如果 API 還沒開通，會回傳 404，我們在此捕捉並顯示提示
      if (!res.ok) {
        // 為了讓您先預覽畫面，這邊做一個假成功/假失敗的處理
        if (res.status === 404) {
          setResult({
            success: true,
            code: 'TDM-X9A-8B2',
            message: '(此為預覽畫面，後端 API 尚未串接)'
          });
        } else {
          const data = await res.json();
          setResult(data);
        }
      } else {
        const data = await res.json();
        setResult(data);
      }

    } catch (err) {
      console.error(err);
      setResult({ success: false, message: '網路連線異常，請稍後再試。' });
    } finally {
      setIsClaiming(false);
      setIsInitializing(false);
    }
  };

  const handleClose = async () => {
    const liff = (await import('@line/liff')).default;
    if (liff.isInClient()) {
      liff.closeWindow();
    } else {
      window.close();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>專屬優惠領取</h1>
        <p className={styles.subtitle}>LINE 官方帳號會員限定</p>

        {isInitializing || isClaiming ? (
          <div className={styles.loadingWrapper}>
            <div className={styles.spinner}></div>
            <p className={styles.instructions}>
              {isInitializing ? '正在驗證您的身分...' : '正在為您保留優惠券...'}
            </p>
          </div>
        ) : liffError ? (
          <div className={styles.errorBox}>
            <strong>驗證失敗</strong>
            <p style={{ marginTop: '0.5rem' }}>{liffError}</p>
          </div>
        ) : result?.success ? (
          <div className={styles.successWrapper}>
            {result.alreadyClaimed ? (
              <p style={{ color: '#7a8b7a', marginBottom: '1rem' }}>您已經領取過此優惠囉！</p>
            ) : (
              <p style={{ color: '#2c3e2e', marginBottom: '1rem', fontWeight: 500 }}>領取成功！您的專屬兌換碼為：</p>
            )}
            
            {qrValue && (
              <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0', background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <QRCodeCanvas 
                  value={qrValue}
                  size={200}
                  level={"H"}
                  includeMargin={true}
                  bgColor={"#ffffff"}
                  fgColor={"#2c3e2e"}
                />
              </div>
            )}
            
            <div className={styles.codeBox}>
              <div className={styles.codeLabel}>專屬序號</div>
              <div className={styles.codeValue}>{result.code}</div>
            </div>
            
            <p className={styles.instructions}>
              請在結帳時出示此畫面，或主動告知店員此序號以進行核銷。<br/>
              <span style={{ fontSize: '0.8rem', color: '#999', display: 'block', marginTop: '1rem' }}>
                {result.message}
              </span>
            </p>
            
            <button className={styles.btn} onClick={handleClose}>
              關閉畫面
            </button>
          </div>
        ) : (
          <div className={styles.successWrapper}>
            <div className={styles.errorBox} style={{ borderLeftColor: '#7a8b7a', background: '#f5f7f5', color: '#5c6e5c' }}>
              <p>{result?.message || '優惠券發送完畢或活動已結束。'}</p>
            </div>
            <button className={`${styles.btn} ${styles.btnOutline}`} onClick={handleClose}>
              關閉畫面
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
