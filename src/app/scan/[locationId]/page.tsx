'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import styles from './scan.module.css';

type PageState = 'LOADING' | 'EMPTY' | 'BLOCKED' | 'IDLE' | 'FETCHING' | 'PLAYING' | 'REVEAL';

function formatMessage(msg: string | undefined) {
  if (!msg) return null;
  const parts = msg.split(' (');
  if (parts.length === 2) {
    return (
      <>
        {parts[0]}<br/>
        <span style={{ fontSize: '0.85em', opacity: 0.8 }}>({parts[1]}</span>
      </>
    );
  }
  return msg;
}

interface LocationInfo {
  status: 'EMPTY' | 'SINGLE_ITEM' | 'BLINDBOX';
  locationName: string;
  campaignId?: string;
  campaignTitle?: string;
  campaignEnglishTitle?: string;
  message?: string;
}

export default function ScanPage() {
  const params = useParams();
  const locationId = params.locationId as string;

  const [pageState, setPageState] = useState<PageState>('LOADING');
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [qrValue, setQrValue] = useState('');
  const [emptyMessage, setEmptyMessage] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);
  const loseAudioRef = useRef<HTMLAudioElement | null>(null);

  // 預載音效
  useEffect(() => {
    if (typeof window !== 'undefined') {
      winAudioRef.current = new window.Audio('/win-sound.mp3');
      loseAudioRef.current = new window.Audio('/lose-sound.mp3');
    }
  }, []);

  // 設定 QR Code 值
  useEffect(() => {
    if (typeof window !== 'undefined' && result?.code) {
      setQrValue(`${window.location.origin}/c/${result.code}`);
    }
  }, [result?.code]);

  // 1. 進入頁面時，取得立牌狀態
  useEffect(() => {
    async function fetchLocationInfo() {
      try {
        const res = await fetch(`/api/scan/${locationId}`);
        const data = await res.json();

        if (!data.success || data.status === 'EMPTY' || data.status === 'NOT_FOUND') {
          setEmptyMessage(data.message || '本次活動已結束，敬請期待下一波專屬驚喜！');
          setLocationInfo({ status: 'EMPTY', locationName: data.locationName || '' });
          setPageState('EMPTY');
          return;
        }

        setLocationInfo(data);

        // 2. 預先攔截防刷機制 — 以 campaignId 為 Key
        const campaignKey = data.campaignId;
        if (campaignKey) {
          const claimed = localStorage.getItem(`claimed_campaign_${campaignKey}`);
          if (claimed === 'true') {
            const savedResult = localStorage.getItem(`result_campaign_${campaignKey}`);
            if (savedResult) {
              setResult(JSON.parse(savedResult));
              setPageState('RESULT');
              return;
            }
            setPageState('BLOCKED');
            return;
          }
        }

        setPageState('IDLE');
      } catch (err) {
        console.error('Failed to fetch location info:', err);
        setEmptyMessage('無法連線至伺服器，請稍後再試。');
        setPageState('EMPTY');
      }
    }

    fetchLocationInfo();
  }, [locationId]);

  // 3. 點擊開始抽獎
  const handleStartDraw = async () => {
    // 同步解鎖 iOS/Mobile Safari 的媒體播放限制
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
      videoRef.current.pause();
    }
    if (winAudioRef.current) {
      winAudioRef.current.play().catch(() => {});
      winAudioRef.current.pause();
    }
    if (loseAudioRef.current) {
      loseAudioRef.current.play().catch(() => {});
      loseAudioRef.current.pause();
    }

    setPageState('FETCHING');
    setResult(null);

    try {
      const res = await fetch(`/api/scan/${locationId}`, { method: 'POST' });
      const data = await res.json();
      setResult(data);

      // 寫入 LocalStorage 防刷紀錄（不管中獎或未中獎都寫入）
      const campaignKey = data.campaignId || locationInfo?.campaignId;
      if (campaignKey) {
        localStorage.setItem(`claimed_campaign_${campaignKey}`, 'true');
        localStorage.setItem(`result_campaign_${campaignKey}`, JSON.stringify(data));
      }

      // 設定影片並播放
      if (videoRef.current) {
        videoRef.current.src = data.won ? '/win-animation.mp4' : '/lose-animation.mp4';
        videoRef.current.play().catch(e => console.error('Video play blocked:', e));
      }
      setPageState('PLAYING');
    } catch (err) {
      console.error('Draw failed:', err);
      setResult({ success: false, won: false, message: '網路連線異常，請稍後再試。' });
      setPageState('REVEAL');
    }
  };

  // 4. 影片播完，觸發音效並切換到揭曉畫面
  const handleVideoEnded = () => {
    if (result && result.success) {
      const audio = result.won ? winAudioRef.current : loseAudioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.error('Audio play failed:', e));
      }

      // 未中獎時，觸發碎裂閃光特效
      if (!result.won) {
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 500);
      }
    }

    setPageState('REVEAL');
  };

  // 5. 完成 / 回到初始狀態
  const handleReset = () => {
    // 重新檢查是否已抽過（因為剛才已經寫入防刷紀錄）
    const campaignKey = locationInfo?.campaignId || result?.campaignId;
    if (campaignKey) {
      const claimed = localStorage.getItem(`claimed_campaign_${campaignKey}`);
      if (claimed === 'true') {
        setPageState('BLOCKED');
        return;
      }
    }
    setPageState('IDLE');
    setResult(null);
  };

  return (
    <div className={styles.container}>
      {showFlash && <div className={styles.shatterFlash}></div>}

      {/* ===== 載入中 ===== */}
      {pageState === 'LOADING' && (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p style={{ color: '#666' }}>載入中... (Loading...)</p>
        </div>
      )}

      {/* ===== 敬請期待（無綁定/無庫存） ===== */}
      {pageState === 'EMPTY' && (
        <div className={styles.emptyContainer}>
          <div className={styles.emptyIcon}>🍵</div>
          <h1 className={styles.emptyTitle}>
            {locationInfo?.locationName || ''}
          </h1>
          <p className={styles.emptySubtitle}>
            {emptyMessage}
          </p>
        </div>
      )}

      {/* ===== 已領取過（防重刷） ===== */}
      {pageState === 'BLOCKED' && (
        <div className={styles.blockedContainer}>
          <div className={styles.blockedIcon}>🎁</div>
          <h2 className={styles.blockedTitle}>
            您已經領取過本次活動的專屬好禮囉！
          </h2>
          <p className={styles.blockedSubtitle}>
            把機會留給下一位幸運兒吧～<br/>
            <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              (You have already participated in this event. Leave the chance for the next lucky person!)
            </span>
          </p>
        </div>
      )}

      {/* ===== 準備抽獎 ===== */}
      {pageState === 'IDLE' && locationInfo && (
        <div className={styles.idleWrapper}>
          <div style={{ marginBottom: '1rem' }}>
            <img 
              src="/logo-teacloud.png" 
              alt="茶雲居 Logo" 
              style={{ width: '80px', height: 'auto', borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
            />
          </div>
          <h1 className={styles.title}>
            {locationInfo.status === 'BLINDBOX' ? '🎁 驚喜盲盒' : '茶雲居專屬優惠'}
            <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 'normal', marginTop: '0.5rem', opacity: 0.8 }}>
              {locationInfo.status === 'BLINDBOX' ? 'Mystery Blind Box' : 'Exclusive Offer'}
            </span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#666', textAlign: 'center', lineHeight: '1.6' }}>
            試試手氣，看看今天老闆準備了什麼驚喜！<br/>
            <span style={{ fontSize: '1rem', opacity: 0.8 }}>(Test your luck and see what surprise the boss prepared today!)</span>
          </p>
          <button className={styles.drawBtn} onClick={handleStartDraw}>
            <div style={{ fontWeight: 'bold' }}>馬上開抽！</div>
            <div style={{ fontSize: '1rem', fontWeight: 'normal', opacity: 0.9 }}>(Draw Now!)</div>
          </button>
        </div>
      )}

      {/* ===== 正在開獎 ===== */}
      {pageState === 'FETCHING' && (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p style={{ fontSize: '1.2rem', color: '#666' }}>
            正在為您開獎...<br/>
            <span style={{ fontSize: '1rem', opacity: 0.8 }}>(Drawing...)</span>
          </p>
        </div>
      )}

      {/* ===== 影片播放器（始終存在 DOM 中） ===== */}
      <div 
        className={styles.videoContainer}
        style={{ 
          opacity: pageState === 'PLAYING' ? 1 : 0, 
          pointerEvents: pageState === 'PLAYING' ? 'auto' : 'none',
          zIndex: pageState === 'PLAYING' ? 9999 : -1
        }}
      >
        <video 
          ref={videoRef}
          playsInline 
          onEnded={handleVideoEnded}
          style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', top: 0, left: 0, zIndex: 1, backgroundColor: 'black' }}
        />
      </div>

      {/* ===== 揭曉結果 ===== */}
      {pageState === 'REVEAL' && (
        <div className={styles.resultContainer}>
          {result && result.success ? (
            result.won ? (
              <>
                <h2 className={styles.prizeTitle}>🎉 恭喜中獎！<br/><span style={{fontSize: '1.2rem', fontWeight: 'normal'}}>(Congratulations!)</span></h2>
                <p className={styles.prizeSubtitle}>您獲得了 (You won)：</p>
                
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.8rem', color: '#2c3e2e', margin: '0 0 0.5rem 0' }}>{result.couponTitle}</h3>
                  {result.couponEnglishTitle && (
                    <div style={{ color: '#666', fontSize: '1.1rem' }}>{result.couponEnglishTitle}</div>
                  )}
                </div>

                <div className={styles.qrWrapper}>
                  <QRCodeCanvas 
                    value={qrValue}
                    size={220}
                    level={"H"}
                    includeMargin={true}
                    bgColor={"#ffffff"}
                    fgColor={"#2c3e2e"}
                  />
                </div>

                <div className={styles.codeBox}>
                  <div className={styles.codeLabel}>專屬序號 (Promo Code)</div>
                  <div className={styles.codeValue}>{result.code}</div>
                </div>
                
                <div style={{ textAlign: 'left', lineHeight: '1.6', fontSize: '0.9rem', marginTop: '1.5rem', background: '#f5f7f5', padding: '1rem', borderRadius: '12px', color: '#4a5568', width: '100%' }}>
                  <strong>兌換說明：</strong>{result.message}<br/>
                  <span style={{ fontSize: '0.85em', opacity: 0.8 }}>(Instruction: Please present this screen to our staff.)</span>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div className={styles.qrWrapper} style={{ background: 'transparent', boxShadow: 'none' }}>
                  <div>
                    <h2 className={styles.prizeTitle} style={{ color: '#5c6e5c' }}>未中獎<br/><span style={{fontSize: '1.2rem', fontWeight: 'normal'}}>(Not a Winner)</span></h2>
                    <p className={styles.prizeSubtitle} style={{ marginTop: '1rem', fontSize: '1.2rem' }}>{formatMessage(result.message)}</p>
                  </div>
                </div>
              </div>
            )
          ) : (
            <>
              <h2 className={styles.prizeTitle} style={{ color: '#ef4444' }}>😅 哎呀！<br/><span style={{fontSize: '1.2rem', fontWeight: 'normal'}}>(Oops!)</span></h2>
              <p className={styles.prizeSubtitle}>{formatMessage(result?.message || '抽獎失敗，請稍後再試。 (Draw failed, please try again later.)')}</p>
            </>
          )}

          <button className={styles.resetBtn} onClick={handleReset}>
            完成<br/><span style={{fontSize:'0.85rem'}}>(Finish)</span>
          </button>
        </div>
      )}
    </div>
  );
}
