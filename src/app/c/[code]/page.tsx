import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { QrCode, AlertCircle, Calendar, Tag } from 'lucide-react';
import styles from './coupon.module.css';
import { Metadata } from 'next';
import InlineQRCode from '@/components/InlineQRCode';

interface PageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const couponCode = await prisma.couponCode.findUnique({
    where: { code: resolvedParams.code },
    include: { coupon: true }
  });

  if (!couponCode) {
    return { title: '無效的優惠券' };
  }

  return {
    title: `${couponCode.coupon.applicableBrand} - ${couponCode.coupon.title}`,
    description: `您已獲得 ${couponCode.coupon.applicableBrand} 的優惠券！`,
  };
}

function getBrandClass(brandName: string) {
  if (brandName.includes('源發')) return styles.brand_YuanFa;
  if (brandName.includes('茶雲居')) return styles.brand_TeaCloud;
  if (brandName.includes('聯合')) return styles.brand_Joint;
  return styles.brand_Default;
}

function formatDiscount(type: string, value: number) {
  switch (type) {
    case 'FIXED_AMOUNT':
      return `折抵 ${value} 元`;
    case 'PERCENTAGE':
      // Backend stores 90 for 90%, usually we say "9 折". If it's 85, we say "85 折".
      if (value % 10 === 0) {
        return `${value / 10} 折`;
      }
      return `${value} 折`;
    case 'FREE_GIFT':
      return '免費兌換';
    default:
      return `${value}`;
  }
}

export default async function CouponPublicPage({ params }: PageProps) {
  const resolvedParams = await params;
  
  // Fetch couponCode from DB
  const couponCode = await prisma.couponCode.findUnique({
    where: { code: resolvedParams.code },
    include: { coupon: true }
  });

  if (!couponCode) {
    return (
      <div className={`${styles.pageContainer} ${styles.brand_Default}`}>
        <div className={`${styles.couponCard} ${styles.invalidCard}`}>
          <AlertCircle size={64} className={styles.invalidIcon} />
          <h1 className={styles.invalidTitle}>無效的優惠券</h1>
          <p className={styles.invalidText}>此優惠券序號不存在或已失效。</p>
        </div>
      </div>
    );
  }

  const { coupon } = couponCode;

  const brandClass = getBrandClass(coupon.applicableBrand);
  
  const now = new Date();
  let statusText = '可使用';
  let statusClass = styles.statusActive;
  let canShowQr = true;

  if (coupon.status !== 'ACTIVE') {
    statusText = coupon.status === 'PAUSED' ? '已暫停' : '已過期';
    statusClass = styles.statusExpired;
    canShowQr = false;
  } else if (now < coupon.validFrom) {
    statusText = '尚未生效';
    statusClass = styles.statusExpired;
    canShowQr = false;
  } else if (now > coupon.validUntil) {
    statusText = '已過期';
    statusClass = styles.statusExpired;
    canShowQr = false;
  } else if (coupon.mode === 'MULTI_USE' && couponCode.redeemedQuantity >= couponCode.maxUsage) {
    statusText = '活動名額已額滿';
    statusClass = styles.statusExpired;
    canShowQr = false;
  } else if (coupon.mode === 'SINGLE_USE' && couponCode.redeemedQuantity > 0) {
    statusText = '已核銷';
    statusClass = styles.statusExpired;
    canShowQr = false;
  }

  // Formatting dates
  const validFromStr = coupon.validFrom.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const validUntilStr = coupon.validUntil.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`${styles.pageContainer} ${brandClass}`}>
      {/* Decorative blobs for glassmorphism effect */}
      <div className={styles.blob1}></div>
      <div className={styles.blob2}></div>

      <div className={styles.couponCard}>
        <div className={styles.brandLogo}>
          <img src="/logo-teacloud.png" alt={`${coupon.applicableBrand} Logo`} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '5px' }} />
        </div>
        
        <div className={styles.brandName}>{coupon.applicableBrand}</div>
        <h1 className={styles.couponTitle}>{coupon.title}</h1>
        
        <div className={styles.discountBadge}>
          {formatDiscount(coupon.discountType, coupon.discountValue)}
        </div>

        <div className={styles.divider}></div>

        <div className={styles.detailsSection}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}><Tag size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> 優惠代碼</span>
            <span className={styles.detailValue}>{couponCode.code}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}><Calendar size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> 狀態</span>
            <span className={`${styles.detailValue} ${statusClass}`}>{statusText}</span>
          </div>
          <div className={styles.detailRow} style={{ marginTop: '0.75rem', flexDirection: 'column', gap: '0.25rem' }}>
            <span className={styles.detailLabel}>有效期限</span>
            <span className={styles.detailValue} style={{ fontSize: '0.85rem' }}>
              {validFromStr} <br/>至 {validUntilStr}
            </span>
          </div>
        </div>

        {canShowQr ? (
          <>
            <div className={styles.instructions}>
              本優惠券僅供現場人員核銷使用。<br/>
              請於結帳時向服務人員出示此畫面。
            </div>

            <div style={{
              marginTop: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              background: 'rgba(255,255,255,0.95)',
              padding: '1.5rem',
              borderRadius: '16px',
              width: '100%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}>
              <h3 style={{ margin: 0, color: '#333', fontSize: '1.1rem', fontWeight: 'bold' }}>請出示給店員掃描</h3>
              
              <InlineQRCode code={couponCode.code} />
              
              <p style={{ margin: 0, color: '#666', fontSize: '1.2rem', letterSpacing: '2px', fontWeight: 'bold' }}>
                {couponCode.code}
              </p>
            </div>
          </>
        ) : (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            color: '#ef4444',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            {statusText === '已核銷' || statusText === '活動名額已額滿' ? 
              `此優惠券${statusText}，無法再被掃描使用。` : 
              `此優惠券目前${statusText}，無法進行掃描核銷。`
            }
          </div>
        )}
      </div>
    </div>
  );
}
