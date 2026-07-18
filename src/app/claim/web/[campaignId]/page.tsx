'use client';

import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useParams } from 'next/navigation';
// Using the same styles as LIFF for consistency
import styles from '@/app/liff/claim/liff.module.css';

interface ClaimResult {
  success: boolean;
  won?: boolean;
  code?: string;
  couponTitle?: string;
  couponEnglishTitle?: string;
  message?: string;
  campaignId?: string;
}

export default function WebClaimPage() {
  const params = useParams();
  const campaignId = params.campaignId as string;

  const [isInitializing, setIsInitializing] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [qrValue, setQrValue] = useState('');
  
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (result?.code && typeof window !== 'undefined') {
      setQrValue(`${window.location.origin}/c/${result.code}`);
    }
  }, [result?.code]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const drawn = localStorage.getItem(`hasDrawn_${campaignId}`);
      if (drawn === 'true') {
        setHasDrawn(true);
      }
      setIsInitializing(false);
    }
  }, [campaignId]);

  const claimCoupon = async () => {
    setIsClaiming(true);
    try {
      const res = await fetch(`/api/claim/web/${campaignId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await res.json();
      setResult(data);
      
      if (res.ok) {
        localStorage.setItem(`hasDrawn_${campaignId}`, 'true');
        setHasDrawn(true);
      }
    } catch (err) {
      console.error(err);
      setResult({ success: false, message: '網路連線異常，請稍後再試。' });
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>專屬優惠抽獎</h1>
        <p className={styles.subtitle}>幸運輪盤，試試手氣！</p>

        {isInitializing || isClaiming ? (
          <div className={styles.loadingWrapper}>
            <div className={styles.spinner}></div>
            <p className={styles.instructions}>
              {isInitializing ? '正在準備抽獎系統...' : '正在為您開獎...'}
            </p>
          </div>
        ) : result ? (
          <div className={styles.successWrapper}>
            {result.success ? (
              result.won ? (
                <>
                  <p style={{ color: '#2c3e2e', marginBottom: '1rem', fontWeight: 500, fontSize: '1.2rem' }}>🎉 恭喜中獎！您的專屬兌換碼為：</p>
                  
                  {result.couponTitle && (
                    <div style={{ textAlign: 'center', margin: '0 0 1rem 0' }}>
                      <h2 style={{ margin: '0 0 0.25rem 0', color: '#2c3e2e', fontSize: '1.3rem' }}>{result.couponTitle}</h2>
                      {result.couponEnglishTitle && (
                        <h3 style={{ margin: 0, color: '#666', fontSize: '1rem', fontWeight: 'normal' }}>{result.couponEnglishTitle}</h3>
                      )}
                    </div>
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
                  
                  <div className={styles.instructions} style={{ textAlign: 'left', lineHeight: '1.6', fontSize: '0.9rem' }}>
                    <strong>本優惠適用於現場結帳與線上客服（LINE/FB/IG）。</strong><br/>
                    <span style={{ fontSize: '0.85em', opacity: 0.8 }}>(Valid for in-store and online messages (LINE/FB/IG).)</span><br/><br/>
                    <strong>現場結帳：</strong>請於結帳時向服務人員出示此畫面。<br/>
                    <span style={{ fontSize: '0.85em', opacity: 0.8 }}>(In-store: Please present this screen to our staff at checkout.)</span><br/><br/>
                    <strong>線上客服：</strong>請截圖此畫面或提供上方的『優惠代碼』傳送給我們。<br/>
                    <span style={{ fontSize: '0.85em', opacity: 0.8 }}>(Online: Please send a screenshot of this page or the Promo Code to us via message.)</span>
                    <span style={{ fontSize: '0.8rem', color: '#999', display: 'block', marginTop: '1rem', textAlign: 'center' }}>
                      {result.message}
                    </span>
                  </div>
                </>
              ) : (
                <div className={styles.errorBox} style={{ borderLeftColor: '#7a8b7a', background: '#f5f7f5', color: '#5c6e5c' }}>
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>未中獎 (Not a Winner)</p>
                  <p>{result.message || '哎呀，差一點點！下次再來試試手氣吧！ (Oops, so close! Better luck next time!)'}</p>
                </div>
              )
            ) : (
              <div className={styles.errorBox} style={{ borderLeftColor: '#ef4444', background: '#fef2f2', color: '#b91c1c' }}>
                <p>{result.message}</p>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.6', opacity: 0.9 }}>
              本公司保有最終修改、變更、活動解釋及取消本優惠之權利。<br/>
              We reserve the right to modify, interpret, or cancel this promotion at any time.
            </div>
            
          </div>
        ) : (
          <div className={styles.successWrapper}>
            {hasDrawn ? (
              <div className={styles.errorBox} style={{ borderLeftColor: '#7a8b7a', background: '#f5f7f5', color: '#5c6e5c' }}>
                <p>您已經抽過囉！把機會留給別人吧！<br/>(You have already played. Please leave the chance to others!)</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#2c3e2e' }}>點擊下方按鈕，測試您的好手氣！<br/>(Click the button below to test your luck!)</p>
                <button className={styles.btn} onClick={claimCoupon} style={{ fontSize: '1.1rem', padding: '1rem', marginBottom: '1rem' }}>
                  🎁 抽獎去！ (Draw Now!)
                </button>
              </>
            )}
            
            <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.6', opacity: 0.9 }}>
              本公司保有最終修改、變更、活動解釋及取消本優惠之權利。<br/>
              We reserve the right to modify, interpret, or cancel this promotion at any time.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
