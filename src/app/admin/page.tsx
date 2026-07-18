import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { PlusCircle, Ticket, CheckCircle, Clock, MapPin } from 'lucide-react';
import DeleteCouponButton from '@/components/DeleteCouponButton';
import QrLocationManager from '@/components/QrLocationManager';
import styles from './admin.module.css';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // Fetch stats and recent coupons
  const totalCoupons = await prisma.coupon.count();
  const validCoupons = await prisma.coupon.findMany({
    where: {
      validUntil: { gte: new Date() },
      validFrom: { lte: new Date() },
    }
  });
  const activeCoupons = validCoupons.filter(c => c.totalQuantity > c.redeemedQuantity).length;
  
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return (
    <div className="animate-fade-in">
      <div className={styles.header}>
        <div>
          <h1 className="h2">總覽</h1>
          <p className="text-muted">歡迎回到優惠券管理系統</p>
        </div>
        <Link href="/admin/coupons/new" className="btn btn-primary">
          <PlusCircle size={20} />
          發行新優惠券
        </Link>
      </div>

      <div className={styles.statsGrid}>
        <div className="card">
          <div className={styles.statHeader}>
            <h3 className={styles.statTitle}>總發行種類</h3>
            <Ticket className={styles.statIcon} />
          </div>
          <p className={styles.statValue}>{totalCoupons}</p>
        </div>
        <div className="card">
          <div className={styles.statHeader}>
            <h3 className={styles.statTitle}>進行中活動</h3>
            <CheckCircle className={styles.statIcon} style={{ color: 'var(--success-color)' }} />
          </div>
          <p className={styles.statValue}>{activeCoupons}</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 className="h3" style={{ marginBottom: '1.5rem' }}>最近發行的優惠券</h2>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>名稱</th>
                <th>發行模式</th>
                <th>適用品牌</th>
                <th>折扣內容</th>
                <th>已核銷 / 總量</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => {
                const now = new Date();
                let status = '進行中';
                let badgeClass = 'badge-success';
                
                if (now < coupon.validFrom) {
                  status = '未開始';
                  badgeClass = 'badge-warning';
                } else if (now > coupon.validUntil) {
                  status = '已過期';
                  badgeClass = 'badge-warning'; // normally danger, using warning for demo
                } else if (coupon.redeemedQuantity >= coupon.totalQuantity) {
                  status = '已使用';
                  badgeClass = 'badge-warning';
                }

                return (
                  <tr key={coupon.id}>
                    <td className={styles.fw500}>{coupon.title}</td>
                    <td>
                      <span className={`badge ${coupon.mode === 'SINGLE_USE' ? 'badge-primary' : 'badge-secondary'}`} style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                        {coupon.mode === 'SINGLE_USE' ? 'A: 一券一碼' : 'B: 一碼多用'}
                      </span>
                    </td>
                    <td>{coupon.applicableBrand}</td>
                    <td>{coupon.discountType} ({coupon.discountValue})</td>
                    <td>
                      <div className={styles.progressWrapper}>
                        <div className={styles.progressText}>
                          {coupon.redeemedQuantity} / {coupon.totalQuantity}
                        </div>
                        <div className={styles.progressBar}>
                          <div 
                            className={styles.progressFill} 
                            style={{ width: `${Math.min(100, (coupon.redeemedQuantity / coupon.totalQuantity) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${badgeClass}`}>{status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Link href={`/admin/coupons/${coupon.id}`} className={styles.actionLink}>
                          檢視詳情
                        </Link>
                        <DeleteCouponButton id={coupon.id} title={coupon.title} isIconOnly={true} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    目前尚未發行任何優惠券
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 實體立牌管理 */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <MapPin size={22} style={{ color: 'var(--primary-color)' }} />
          <h2 className="h3" style={{ margin: 0 }}>實體立牌管理 (QR Code Stands)</h2>
        </div>
        <QrLocationManager />
      </div>
    </div>
  );
}
