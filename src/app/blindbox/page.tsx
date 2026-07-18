'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import styles from './blindbox.module.css';

type Phase = 'IDLE' | 'FETCHING' | 'PLAYING' | 'REVEAL';

export default function BlindboxPage() {
  const [phase, setPhase] = useState<Phase>('IDLE');
  const [showFlash, setShowFlash] = useState(false);
  
  const [result, setResult] = useState<any>(null);
  const [qrValue, setQrValue] = useState('');

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
    if (typeof window !== 'undefined' && result?.code) {
      setQrValue(`${window.location.origin}/c/${result.code}`);
    }
  }, [result?.code]);

  const handleStartDraw = async () => {
    // 0. 同步解鎖 iOS/Mobile Safari 的媒體播放限制
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

    setPhase('FETCHING');
    setResult(null);

    // 1. 顯示載入中，並向 API 請求結果
    fetch('/api/blindbox', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        setResult(data);
        if (videoRef.current) {
          videoRef.current.src = data.won ? "/win-animation.mp4" : "/lose-animation.mp4";
          videoRef.current.play().catch(e => console.error("Video play blocked:", e));
        }
        // 2. 取得結果後，進入 PLAYING 狀態開始播放對應的影片
        setPhase('PLAYING');
      })
      .catch(err => {
        console.error(err);
        setResult({ success: false, message: '網路連線異常，請稍後再試。' });
        setPhase('REVEAL');
      });
  };

  const handleVideoEnded = () => {
    // 根據抽獎結果播放對應音效
    if (result && result.success) {
      const audio = result.won ? winAudioRef.current : loseAudioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.error('Audio play failed:', e));
      }
      
      // 未中獎（摔破茶杯）時，保留碎裂閃光特效
      if (!result.won) {
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 500);
      }
    }
    
    // 切換到揭曉畫面
    setPhase('REVEAL');
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

      {phase === 'FETCHING' && (
        <div className={styles.idleWrapper} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className={styles.spinner} style={{ marginBottom: '1rem', width: '40px', height: '40px', border: '3px solid #e0e5e0', borderTopColor: '#6b8c6a', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ fontSize: '1.2rem', color: '#666' }}>正在為您開獎...<br/><span style={{ fontSize: '1rem', opacity: 0.8 }}>(Drawing...)</span></p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* 提早渲染 Video，確保解鎖與播放不受阻礙 */}
      <div 
        className={styles.videoContainer}
        style={{ 
          opacity: phase === 'PLAYING' ? 1 : 0, 
          pointerEvents: phase === 'PLAYING' ? 'auto' : 'none',
          zIndex: phase === 'PLAYING' ? 9999 : -1
        }}
      >
        <video 
          ref={videoRef}
          playsInline 
          onEnded={handleVideoEnded}
          style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', top: 0, left: 0, zIndex: 1, backgroundColor: 'black' }}
        />
      </div>

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
                <div className={styles.qrWrapper} style={{ background: 'transparent', boxShadow: 'none' }}>
                  <div>
                    <h2 className={styles.prizeTitle} style={{ color: '#5c6e5c' }}>未中獎<br/><span style={{fontSize: '1.2rem', fontWeight: 'normal'}}>(Not a Winner)</span></h2>
                    <p className={styles.prizeSubtitle} style={{ marginTop: '1rem', fontSize: '1.2rem' }}>{result.message}</p>
                  </div>
                </div>
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
