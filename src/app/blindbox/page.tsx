'use client';

import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import styles from './blindbox.module.css';

type Phase = 'IDLE' | 'PLAYING' | 'REVEAL';

export default function BlindboxPage() {
  const [phase, setPhase] = useState<Phase>('IDLE');
  const [showFlash, setShowFlash] = useState(false);
  
  const [result, setResult] = useState<any>(null);
  const [qrValue, setQrValue] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && result?.code) {
      setQrValue(`${window.location.origin}/c/${result.code}`);
    }
  }, [result?.code]);

  const handleStartDraw = async () => {
    setPhase('PLAYING');
    setResult(null);

    // 1. 在背景立刻發送抽獎請求
    fetch('/api/blindbox', { method: 'POST' })
      .then(res => res.json())
      .then(data => setResult(data))
      .catch(err => {
        console.error(err);
        setResult({ success: false, message: '網路連線異常，請稍後再試。' });
      });

    // 2. 在 10 秒時，剛好是影片播完、茶杯摔破的瞬間
    setTimeout(() => {
      setShowFlash(true); // 觸發碎裂閃光特效
      setPhase('REVEAL'); // 切換到揭曉畫面
      
      // 閃光特效持續一下後移除
      setTimeout(() => setShowFlash(false), 500);
    }, 10000);
  };

  const handleReset = () => {
    setPhase('IDLE');
    setResult(null);
  };

  return (
    <div className={styles.container}>
      {showFlash && <div className={styles.shatterFlash}></div>}

      {phase === 'IDLE' && (
        <div className={styles.idleWrapper}>
          <h1 className={styles.title} style={{ textAlign: 'center' }}>
            🎁 隱藏盲盒抽獎
            <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 'normal', marginTop: '0.5rem', opacity: 0.8 }}>Mystery Blind Box</span>
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

      {phase === 'PLAYING' && (
        <div className={styles.videoContainer}>
          {/* 這是真正的影片播放器，它會去抓取 public/blindbox-animation.mp4 */}
          <video 
            src="/blindbox-animation.mp4" 
            autoPlay 
            playsInline 
            muted 
            style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', top: 0, left: 0, zIndex: 1, backgroundColor: 'black' }}
          />
        </div>
      )}

      {phase === 'REVEAL' && (
        <div className={styles.resultContainer}>
          {result && result.success ? (
            result.won ? (
              <>
                <h2 className={styles.prizeTitle}>🎉 恭喜中獎！<br/><span style={{fontSize: '1.2rem', fontWeight: 'normal'}}>(Congratulations!)</span></h2>
                <p className={styles.prizeSubtitle}>您獲得了 (You won)：</p>
                
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.8rem', color: '#2c3e2e', margin: '0 0 0.5rem 0' }}>{result.couponTitle}</h3>
                  <div style={{ color: '#666', fontSize: '1.1rem' }}>{result.couponEnglishTitle}</div>
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
                
                <div style={{ textAlign: 'left', lineHeight: '1.6', fontSize: '0.9rem', marginTop: '1.5rem', background: '#f5f7f5', padding: '1rem', borderRadius: '12px', color: '#4a5568' }}>
                  <strong>兌換說明：</strong>{result.message}<br/>
                  <span style={{ fontSize: '0.85em', opacity: 0.8 }}>(Instruction: Please present this screen to our staff.)</span>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <h2 className={styles.prizeTitle} style={{ color: '#5c6e5c' }}>未中獎<br/><span style={{fontSize: '1.2rem', fontWeight: 'normal'}}>(Not a Winner)</span></h2>
                <p className={styles.prizeSubtitle} style={{ marginTop: '1rem', fontSize: '1.2rem' }}>{result.message}</p>
              </div>
            )
          ) : (
            <>
              <h2 className={styles.prizeTitle} style={{ color: '#ef4444' }}>😅 哎呀！<br/><span style={{fontSize: '1.2rem', fontWeight: 'normal'}}>(Oops!)</span></h2>
              <p className={styles.prizeSubtitle}>{result?.message || '抽獎失敗，請稍後再試。 (Draw failed, please try again later.)'}</p>
            </>
          )}

          <button 
            onClick={handleReset} 
            style={{ 
              marginTop: '2rem', 
              padding: '0.75rem 2rem', 
              fontSize: '1.1rem', 
              borderRadius: '9999px', 
              border: 'none', 
              background: '#e5e7eb', 
              color: '#374151',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            完成 / 換下一位<br/><span style={{fontSize:'0.85rem'}}>(Finish / Next)</span>
          </button>
        </div>
      )}
    </div>
  );
}
