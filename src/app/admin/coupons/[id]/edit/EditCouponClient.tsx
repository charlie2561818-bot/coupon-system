'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import styles from '../../new/new.module.css'; // Reusing new form styles

interface EditCouponClientProps {
  coupon: any;
}

export default function EditCouponClient({ coupon }: EditCouponClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State initialized with existing data
  const [title, setTitle] = useState(coupon.title);
  const [englishTitle, setEnglishTitle] = useState(coupon.englishTitle || '');
  const [usageRules, setUsageRules] = useState(coupon.usageRules || '');
  const [totalQuantity, setTotalQuantity] = useState(coupon.totalQuantity.toString());
  // Need to format dates to YYYY-MM-DDThh:mm for datetime-local input
  const formatForInput = (isoString: string) => isoString.slice(0, 16);
  
  const [validFrom, setValidFrom] = useState(formatForInput(coupon.validFrom));
  const [validUntil, setValidUntil] = useState(formatForInput(coupon.validUntil));
  const [applicableBrand, setApplicableBrand] = useState(coupon.applicableBrand);
  const [discountType, setDiscountType] = useState(coupon.discountType || 'FIXED_AMOUNT');
  const [discountValue, setDiscountValue] = useState(coupon.discountValue?.toString() || '');
  const [showInCart, setShowInCart] = useState(coupon.showInCart ?? true);
  const [isDraw, setIsDraw] = useState(coupon.isDraw ?? true);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/coupons/${coupon.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          englishTitle,
          usageRules,
          totalQuantity: parseInt(totalQuantity),
          validFrom: new Date(validFrom).toISOString(),
          validUntil: new Date(validUntil).toISOString(),
          applicableBrand,
          discountType,
          discountValue: discountType === 'FREE_GIFT' ? 0 : parseFloat(discountValue),
          showInCart,
          isDraw,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || '更新優惠券失敗');
      }

      router.push(`/admin/coupons/${coupon.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className={styles.header}>
        <Link href={`/admin/coupons/${coupon.id}`} className="btn btn-outline" style={{ border: 'none', paddingLeft: 0 }}>
          <ArrowLeft size={20} />
          返回詳情
        </Link>
        <h1 className="h2" style={{ marginTop: '0.5rem' }}>編輯優惠券</h1>
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
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                {coupon.mode === 'SINGLE_USE' ? 'A 模式：一券一碼' : 'B 模式：一碼多用'}
                <span style={{ fontSize: '0.85rem', marginLeft: '0.5rem' }}>(發行後不可更改)</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">互動模式</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="isDraw" value="true" checked={isDraw === true} onChange={() => setIsDraw(true)} />
                  抽獎模式 (30%中獎機率 + 動畫)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="isDraw" value="false" checked={isDraw === false} onChange={() => setIsDraw(false)} />
                  直接領取 (100%獲得 + 無動畫)
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

            <div className="form-group">
              <label className="form-label" htmlFor="totalQuantity">
                {coupon.mode === 'SINGLE_USE' ? '發行總張數' : '可兌換總次數'}
              </label>
              <input
                id="totalQuantity"
                type="number"
                min={coupon.redeemedQuantity}
                className="form-input"
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(e.target.value)}
                required
                disabled={coupon.mode === 'SINGLE_USE'}
                style={{ opacity: coupon.mode === 'SINGLE_USE' ? 0.6 : 1 }}
              />
              {coupon.mode === 'SINGLE_USE' && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  一券一碼模式無法在此增加張數，若需更多請發行新活動。
                </p>
              )}
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

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <input
                id="showInCart"
                type="checkbox"
                checked={showInCart}
                onChange={(e) => setShowInCart(e.target.checked)}
                style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
              />
              <label htmlFor="showInCart" style={{ cursor: 'pointer', margin: 0, color: 'var(--text-primary)' }}>
                顯示於線上購物車結帳頁
              </label>
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
                <option value="FREE_GIFT">商品兌換 (GIFT)</option>
              </select>
            </div>

            {discountType !== 'FREE_GIFT' && (
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
                  placeholder={discountType === 'PERCENTAGE' ? '例如 90 (表示 9 折)' : '輸入折扣金額'}
                />
              </div>
            )}

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
          <button type="button" className="btn btn-outline" onClick={() => router.push(`/admin/coupons/${coupon.id}`)} disabled={loading}>
            取消
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={20} />
            {loading ? '儲存中...' : '儲存變更'}
          </button>
        </div>
      </form>
    </div>
  );
}
