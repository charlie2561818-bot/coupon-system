'use client';

import { useEffect, useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import styles from './liff.module.css';

interface ClaimResult {
  success: boolean;
  won?: boolean;
  code?: string;
  couponTitle?: string;
  couponEnglishTitle?: string;
  message?: string;
  campaignId?: string;
  alreadyClaimed?: boolean;
}

export default function LiffClaimPage() {
  const [liffError, setLiffError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [phase, setPhase] = useState<'IDLE' | 'FETCHING' | 'PLAYING' | 'REVEAL'>('IDLE');
  const [showFlash, setShowFlash] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [qrValue, setQrValue] = useState('');
  
  const [profile, setProfile] = useState<{ userId: string, displayName: string } | null>(null);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);
  const loseAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      winAudioRef.current = new window.Audio('/win-sound.mp3');
      loseAudioRef.current = new window.Audio('/lose-sound.mp3');
    }
  }, []);

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

        const userProfile = await liff.getProfile();
        setProfile({ userId: userProfile.userId, displayName: userProfile.displayName });
        
        // 檢查是否有進行中的活動
        const res = await fetch('/api/claim/active');
        const data = await res.json();
        
        if (data.success && data.campaignId) {
          setActiveCampaignId(data.campaignId);
          // 檢查 LocalStorage 是否已經抽過
          const drawn = localStorage.getItem(`hasDrawn_${data.campaignId}`);
          if (drawn === 'true') {
            setHasDrawn(true);
          }
        } else {
          setLiffError(data.message || '目前沒有進行中的活動');
        }
      } catch (err: any) {
        console.error('LIFF 初始化失敗:', err);
        setLiffError(err.message || '初始化失敗，請在 LINE App 中開啟此連結。');
      } finally {
        setIsInitializing(false);
      }
    };

    initLiff();
  }, []);

  const claimCoupon = async () => {
    if (!profile || !activeCampaignId) return;

    // Trigger audio/video unlock
    videoRef.current?.load();
    winAudioRef.current?.load();
    loseAudioRef.current?.load();
    
    setPhase('FETCHING');
    
    fetch(`/api/claim/line/${activeCampaignId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: profile.userId, displayName: profile.displayName })
    })
      .then(res => res.json())
      .then(data => {
        setResult(data);
        if (data.campaignId) {
          localStorage.setItem(`hasDrawn_${data.campaignId}`, 'true');
        }
        if (data.alreadyClaimed) {
          // 如果已經領取過，直接跳轉到結果頁，不播影片
          setPhase('REVEAL');
          return;
        }

        if (videoRef.current) {
          videoRef.current.src = data.won ? "/win-animation.mp4" : "/lose-animation.mp4";
          videoRef.current.play().catch(e => console.error("Video play blocked:", e));
        }
        setPhase('PLAYING');
      })
      .catch(err => {
        console.error(err);
        setResult({ success: false, message: '網路連線異常，請稍後再試。' });
        setPhase('REVEAL');
      });
  };

  const handleVideoEnded = () => {
    if (result && result.success) {
      const audio = result.won ? winAudioRef.current : loseAudioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.error('Audio play failed:', e));
      }
      
      if (!result.won) {
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 500);
      }
    }
    
    setPhase('REVEAL');
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
        {showFlash && <div className={styles.shatterFlash}></div>}

        {phase === 'FETCHING' ? (
          <div className={styles.loadingWrapper}>
            <div className={styles.spinner}></div>
            <p className={styles.instructions}>正在為您開獎 (Drawing for you...)</p>
          </div>
        ) : phase === 'PLAYING' ? (
          <></>
        ) : phase === 'IDLE' ? (
          <div className={styles.successWrapper}>
            <h1 className={styles.title}>專屬優惠抽獎</h1>
            <p className={styles.subtitle}>LINE 官方帳號會員限定</p>

            {isInitializing ? (
              <div className={styles.loadingWrapper}>
                <div className={styles.spinner}></div>
                <p className={styles.instructions}>正在準備抽獎系統 (Preparing the system...)</p>
              </div>
            ) : liffError ? (
              <div className={styles.errorBox}>
                <strong>活動提示</strong>
                <p style={{ marginTop: '0.5rem' }}>{liffError}</p>
              </div>
            ) : hasDrawn ? (
              <>
                <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#2c3e2e' }}>您之前已經參加過此活動囉！</p>
                <button className={styles.btn} onClick={claimCoupon} style={{ fontSize: '1.1rem', padding: '1rem', marginBottom: '1rem', background: '#5c6e5c' }}>
                  🎫 查看我的優惠券
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#2c3e2e' }}>點擊下方按鈕，測試您的好手氣！</p>
                <button className={styles.btn} onClick={claimCoupon} style={{ fontSize: '1.1rem', padding: '1rem', marginBottom: '1rem' }}>
                  🎁 抽獎去！
                </button>
              </>
            )}

            <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.6', opacity: 0.9 }}>
              本公司保有最終修改、變更、活動解釋及取消本優惠之權利。<br/>
              We reserve the right to modify, interpret, or cancel this promotion at any time.
            </div>
          </div>
        ) : (
          <div className={styles.successWrapper}>
            <h1 className={styles.title} style={{ marginTop: '1rem' }}>抽獎結果</h1>
            {result?.success ? (
              result.won ? (
                <>
                  {result.alreadyClaimed ? (
                    <p style={{ color: '#7a8b7a', marginBottom: '1rem' }}>您已經領取過此優惠囉！</p>
                  ) : (
                    <p style={{ color: '#2c3e2e', marginBottom: '1rem', fontWeight: 500, fontSize: '1.2rem' }}>🎉 恭喜中獎！您的專屬兌換碼為：</p>
                  )}
                  
                  {result.couponTitle && (
                    <div style={{ textAlign: 'center', margin: '0 0 1rem 0' }}>
                      <h2 style={{ margin: '0 0 0.25rem 0', color: '#2c3e2e', fontSize: '1.3rem' }}>{result.couponTitle}</h2>
                      {result.couponEnglishTitle && (
                        <h3 style={{ margin: 0, color: '#666', fontSize: '1rem', fontWeight: 'normal' }}>{result.couponEnglishTitle}</h3>
                      )}
                    </div>
                  )}

                  {qrValue && (
                    <div className={styles.qrWrapper}>
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
                    <div className={styles.codeLabel}>專屬序號 (Promo Code)</div>
                    <div className={styles.codeValue}>{result.code}</div>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '1.5rem' }}>
                    <a 
                      href={`https://yuanfateaorder.netlify.app/?discount_code=${result.code}`}
                      className={styles.btn}
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        textDecoration: 'none', 
                        background: '#5c6e5c', 
                        color: '#fff',
                        padding: '0.875rem 1.5rem',
                        fontSize: '1.1rem',
                        borderRadius: '12px',
                        fontWeight: 600,
                        gap: '0.5rem',
                        width: '100%',
                      }}
                    >
                      🛒 立即去購物車使用
                    </a>
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
                  <div className={styles.qrWrapper} style={{ background: 'transparent', boxShadow: 'none', margin: 0, padding: 0 }}>
                    <div>
                      <p style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>未中獎 (Not a Winner)</p>
                      <p>{result.message || '哎呀，差一點點！下次再來試試手氣吧！ (Oops, so close! Better luck next time!)'}</p>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className={styles.errorBox} style={{ borderLeftColor: '#ef4444', background: '#fef2f2', color: '#b91c1c' }}>
                <p>{result?.message}</p>
              </div>
            )}

            <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.6', opacity: 0.9 }}>
              本公司保有最終修改、變更、活動解釋及取消本優惠之權利。<br/>
              We reserve the right to modify, interpret, or cancel this promotion at any time.
            </div>
            
            <button className={styles.btn} onClick={handleClose}>
              關閉畫面
            </button>
          </div>
        )}
      </div>

      <div 
        className={styles.videoContainer}
        style={{ 
          opacity: phase === 'PLAYING' ? 1 : 0, 
          pointerEvents: phase === 'PLAYING' ? 'auto' : 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: phase === 'PLAYING' ? 9999 : -1
        }}
      >
        <video 
          ref={videoRef}
          playsInline 
          onEnded={handleVideoEnded}
          style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: 'black' }}
        />
      </div>
    </div>
  );
}
