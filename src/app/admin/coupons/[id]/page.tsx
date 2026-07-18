import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Tag, CheckCircle2, Ticket, Percent, Edit, QrCode } from 'lucide-react';
import CouponCodeTable from '@/components/CouponCodeTable';
import DeleteCouponButton from '@/components/DeleteCouponButton';
import DirectSendButton from '@/components/DirectSendButton';
import CopyWebLinkButton from '@/components/CopyWebLinkButton';
import styles from './detail.module.css';

export const dynamic = 'force-dynamic';

export default async function CouponDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const coupon = await prisma.coupon.findUnique({
    where: { id: resolvedParams.id },
    include: { codes: true }
  });

  if (!coupon) {
    notFound();
  }

  const now = new Date();
  let status = '進行中';
  let badgeClass = 'badge-success';
  
  if (now < coupon.validFrom) {
    status = '未開始';
    badgeClass = 'badge-warning';
  } else if (now > coupon.validUntil) {
    status = '已過期';
    badgeClass = 'badge-warning';
  } else if (coupon.redeemedQuantity >= coupon.totalQuantity) {
    status = '已使用';
    badgeClass = 'badge-warning';
  }

  const getDiscountDisplay = () => {
    switch (coupon.discountType) {
      case 'FIXED_AMOUNT':
        return `折抵 ${coupon.discountValue} 元`;
      case 'PERCENTAGE':
        return `打 ${coupon.discountValue / 10} 折`;
      case 'FREE_GIFT':
        return '兌換券 / 滿額贈';
      default:
        return String(coupon.discountValue);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className={styles.header}>
        <div>
          <Link href="/admin" className="btn btn-outline" style={{ border: 'none', paddingLeft: 0 }}>
            <ArrowLeft size={20} />
            返回總覽
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <h1 className="h2">優惠券詳情</h1>
            <span className={`badge ${badgeClass}`}>{status}</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          {coupon.mode === 'SINGLE_USE' && (
            <>
              <CopyWebLinkButton campaignId={coupon.id} />
              <DirectSendButton couponId={coupon.id} />
            </>
          )}
          <Link href={`/admin/coupons/${coupon.id}/edit`} className="btn btn-outline">
            <Edit size={20} />
            編輯
          </Link>
          <DeleteCouponButton id={coupon.id} title={coupon.title} />
        </div>
      </div>

      <div className={styles.grid}>
        {/* Full width details */}
        <div style={{ gridColumn: '1 / -1' }}>
          <div className={`card ${styles.infoCardGrid}`}>
            <div>
              <h3 className="h3" style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>基本資訊</h3>
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>優惠券名稱</div>
                  <div className={styles.infoValue}>{coupon.title}</div>
                </div>
                
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>發行模式</div>
                  <div className={styles.infoValue}>
                    <span className={`badge ${coupon.mode === 'SINGLE_USE' ? 'badge-primary' : 'badge-secondary'}`} style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                      {coupon.mode === 'SINGLE_USE' ? 'A 模式：一券一碼' : 'B 模式：一碼多用'}
                    </span>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>適用品牌</div>
                  <div className={styles.infoValue}>
                    <Tag size={16} style={{ color: 'var(--text-secondary)' }} />
                    {coupon.applicableBrand}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="h3" style={{ marginBottom: '1.5rem', color: 'var(--primary-color)' }}>規則與狀態</h3>
              <div className={styles.infoList}>
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>折扣內容</div>
                  <div className={styles.infoValue}>
                    <Percent size={16} style={{ color: 'var(--text-secondary)' }} />
                    {getDiscountDisplay()}
                  </div>
                </div>
                
                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>使用期間</div>
                  <div className={styles.infoValue}>
                    <Calendar size={16} style={{ color: 'var(--text-secondary)' }} />
                    {coupon.validFrom.toLocaleString('zh-TW')} - {coupon.validUntil.toLocaleString('zh-TW')}
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <div className={styles.infoLabel}>總核銷進度</div>
                  <div className={styles.infoValue}>
                    <CheckCircle2 size={16} style={{ color: 'var(--success-color)' }} />
                    {coupon.redeemedQuantity} / {coupon.mode === 'SINGLE_USE' ? coupon.totalQuantity : (coupon.totalQuantity * coupon.codes.length)} 已核銷
                  </div>
                </div>
              </div>
            </div>
          </div>

          <CouponCodeTable title={coupon.title} codes={coupon.codes} />
        </div>
      </div>
    </div>
  );
}
