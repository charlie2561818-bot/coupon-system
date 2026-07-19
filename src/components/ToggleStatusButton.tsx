'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Power, PowerOff } from 'lucide-react';

interface ToggleStatusButtonProps {
  id: string;
  currentStatus: string;
  isExpired: boolean;
}

export default function ToggleStatusButton({ id, currentStatus, isExpired }: ToggleStatusButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // 如果已過期，不允許切換，只顯示「已過期」標籤
  if (isExpired) {
    return <span className="badge badge-warning">已過期</span>;
  }

  const handleToggle = async () => {
    if (loading) return;
    
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const confirmMessage = newStatus === 'ACTIVE' 
      ? '確定要啟用此活動嗎？啟用後，使用者將可開始領取與核銷。'
      : '確定要停用此活動嗎？停用後，使用者將無法再領取此優惠券。';

    if (!confirm(confirmMessage)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('切換狀態失敗');
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      alert('切換狀態時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const isActive = currentStatus === 'ACTIVE';

  return (
    <button
      onClick={handleToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.25rem 0.5rem',
        borderRadius: '9999px',
        border: 'none',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: loading ? 'not-allowed' : 'pointer',
        backgroundColor: isActive ? 'var(--success-color)' : '#9ca3af',
        color: '#fff',
        transition: 'all 0.2s',
        opacity: loading ? 0.7 : (isHovered ? 0.9 : 1),
      }}
    >
      {isActive ? <Power size={14} /> : <PowerOff size={14} />}
      {isActive ? '進行中' : '已停用'}
    </button>
  );
}
