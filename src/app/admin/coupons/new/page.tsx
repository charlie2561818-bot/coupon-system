'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import styles from './new.module.css';

export default function NewCouponPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [mode, setMode] = useState('MULTI_USE'); // 'SINGLE_USE' or 'MULTI_USE'
  const [title, setTitle] = useState('');
  const [englishTitle, setEnglishTitle] = useState('');
  const [usageRules, setUsageRules] = useState('');
  const [code, setCode] = useState(''); 
  const [totalQuantity, setTotalQuantity] = useState('100');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [applicableBrand, setApplicableBrand] = useState('源發茶業');
  const [discountType, setDiscountType] = useState('FIXED_AMOUNT');
  const [discountValue, setDiscountValue] = useState('');

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(`CPN-${result}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode,
          title,
          englishTitle,
          usageRules,
          code: mode === 'MULTI_USE' ? code : undefined,
          totalQuantity: parseInt(totalQuantity),
          validFrom: new Date(validFrom).toISOString(),
          validUntil: new Date(validUntil).toISOString(),
          applicableBrand,
          discountType,
          discountValue: parseFloat(discountValue),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || '發行優惠券失敗');
      }

      const data = await res.json();
      router.push(`/admin/coupons/${data.coupon.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className={styles.header}>
        <Link href="/admin" className="btn btn-outline" style={{ border: 'none', paddingLeft: 0 }}>
          <ArrowLeft size={20} />
          返回總覽
        </Link>
        <h1 className="h2" style={{ marginTop: '0.5rem' }}>發行新優惠券</h1>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className={styles.formGrid}>
          {/* Left Column */}
          <div className={styles.column}>
            <h3 className="h3" style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>基本資訊</h3>
            
            <div className="form-group">
              <label className="form-label">發行模式</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="mode" value="SINGLE_USE" checked={mode === 'SINGLE_USE'} onChange={() => setMode('SINGLE_USE')} />
                  A 模式：一券一碼 (產生多組獨立序號)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="mode" value="MULTI_USE" checked={mode === 'MULTI_USE'} onChange={() => setMode('MULTI_USE')} />
                  B 模式：一碼多用 (產生單一 QR Code)
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="title">活動/優惠券名稱</label>
              <input
                id="title"
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="例如：春季新品上市 9 折券"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="englishTitle">英文活動/優惠券名稱 (English Name)</label>
              <input
                id="englishTitle"
                type="text"
                className="form-input"
                value={englishTitle}
                onChange={(e) => setEnglishTitle(e.target.value)}
                placeholder="例如：Spring New Arrival 10% OFF"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="usageRules">使用規則說明</label>
              <textarea
                id="usageRules"
                className="form-input"
                value={usageRules}
                onChange={(e) => setUsageRules(e.target.value)}
                placeholder="例如：住宿限定假日使用、限購特定商品（選填）"
                rows={4}
                style={{ resize: 'vertical' }}
              />
            </div>

            {mode === 'MULTI_USE' && (
              <div className="form-group">
                <label className="form-label" htmlFor="code">自訂序號 (QR Code 內容)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    id="code"
                    type="text"
                    className="form-input"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    required
                    placeholder="輸入序號或自動產生"
                  />
                  <button type="button" onClick={generateRandomCode} className="btn btn-outline" style={{ whiteSpace: 'nowrap' }}>
                    自動產生
                  </button>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="totalQuantity">
                {mode === 'SINGLE_USE' ? '發行總張數' : '可兌換總次數'}
              </label>
              <input
                id="totalQuantity"
                type="number"
                min="1"
                className="form-input"
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(e.target.value)}
                required
                placeholder={mode === 'SINGLE_USE' ? '例如 100 張' : '例如 500 次'}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="applicableBrand">適用品牌</label>
              <select
                id="applicableBrand"
                className="form-input form-select"
                value={applicableBrand}
                onChange={(e) => setApplicableBrand(e.target.value)}
              >
                <option value="源發茶業">源發茶業</option>
                <option value="茶雲居">茶雲居</option>
                <option value="聯合活動">聯合活動 (通用)</option>
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.column}>
            <h3 className="h3" style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>規則設定</h3>
            
            <div className="form-group">
              <label className="form-label" htmlFor="discountType">折扣類型</label>
              <select
                id="discountType"
                className="form-input form-select"
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
              >
                <option value="FIXED_AMOUNT">固定金額折抵 (元)</option>
                <option value="PERCENTAGE">打折 (%)</option>
                <option value="FREE_GIFT">滿額贈 / 兌換券</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="discountValue">折扣數值</label>
              <input
                id="discountValue"
                type="number"
                min="0"
                step="0.1"
                className="form-input"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                required
                placeholder={discountType === 'PERCENTAGE' ? '例如 90 (表示 9 折)' : '輸入金額或 0 (若為兌換券)'}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="validFrom">生效時間</label>
              <input
                id="validFrom"
                type="datetime-local"
                className="form-input"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="validUntil">失效時間</label>
              <input
                id="validUntil"
                type="datetime-local"
                className="form-input"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className="btn btn-outline" onClick={() => router.push('/admin')} disabled={loading}>
            取消
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={20} />
            {loading ? '發行中...' : '確認發行'}
          </button>
        </div>
      </form>
    </div>
  );
}
