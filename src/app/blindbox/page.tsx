'use client';

import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import styles from './blindbox.module.css';

type Phase = 'IDLE' | 'PLAYING' | 'REVEAL';

export default function BlindboxPage() {
  const [phase, setPhase] = useState<Phase>('IDLE');
  const [showFlash, setShowFlash] = useState(false);
  
  // 模擬抽中的中獎資料
  const [mockPrize, setMockPrize] = useState({
    title: '免費霜淇淋兌換券',
    englishTitle: 'Free Ice Cream Voucher',
    code: 'BLIND-BOX-WINNER-001',
  });
  const [qrValue, setQrValue] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setQrValue(`${window.location.origin}/c/${mockPrize.code}`);
    }
  }, [mockPrize.code]);

  const handleStartDraw = () => {
    setPhase('PLAYING');

    // 模擬 3.5 秒的影片播放時間
    // 在 3.5 秒時，剛好是茶杯摔破的瞬間
    setTimeout(() => {
      setShowFlash(true); // 觸發碎裂閃光特效
      setPhase('REVEAL'); // 切換到揭曉畫面
      
      // 閃光特效持續一下後移除
      setTimeout(() => setShowFlash(false), 500);
    }, 3500);
  };

  return (
    <div className={styles.container}>
      {showFlash && <div className={styles.shatterFlash}></div>}

      {phase === 'IDLE' && (
        <div className={styles.idleWrapper}>
          <h1 className={styles.title}>🎁 隱藏盲盒抽獎</h1>
          <p style={{ fontSize: '1.2rem', color: '#666' }}>試試手氣，看看今天老闆準備了什麼驚喜！</p>
          <button className={styles.drawBtn} onClick={handleStartDraw}>
            馬上開抽！
          </button>
        </div>
      )}

      {phase === 'PLAYING' && (
        <div className={styles.videoContainer}>
          <div className={styles.videoPlaceholder}>
            <h2>☕️ 老闆正在喝熱茶...</h2>
            <p style={{ opacity: 0.8 }}>(這裡未來可以放入老闆喝茶燙到並摔破茶杯的影片)</p>
            <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <span style={{ fontSize: '2rem', animation: 'shakeText 0.3s infinite' }}>🔥</span>
              <span style={{ fontSize: '2rem', animation: 'shakeText 0.4s infinite' }}>💦</span>
              <span style={{ fontSize: '2rem', animation: 'shakeText 0.5s infinite' }}>💥</span>
            </div>
          </div>
        </div>
      )}

      {phase === 'REVEAL' && (
        <div className={styles.resultContainer}>
          <h2 className={styles.prizeTitle}>🎉 恭喜中獎！</h2>
          <p className={styles.prizeSubtitle}>您獲得了：</p>
          
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.8rem', color: '#2c3e2e', margin: '0 0 0.5rem 0' }}>{mockPrize.title}</h3>
            <div style={{ color: '#666', fontSize: '1.1rem' }}>{mockPrize.englishTitle}</div>
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
            <div className={styles.codeLabel}>專屬序號</div>
            <div className={styles.codeValue}>{mockPrize.code}</div>
          </div>
        </div>
      )}
    </div>
  );
}
