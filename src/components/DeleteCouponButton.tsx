'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

interface DeleteCouponButtonProps {
  id: string;
  title: string;
  isIconOnly?: boolean;
  onDeleted?: () => void;
}

export default function DeleteCouponButton({ id, title, isIconOnly = false, onDeleted }: DeleteCouponButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`確定要刪除優惠券「${title}」嗎？\n⚠️ 注意：這將會連同刪除該優惠券的所有核銷紀錄，且無法復原！`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '刪除失敗');
      }

      if (onDeleted) {
        onDeleted();
      } else {
        router.push('/admin');
        router.refresh();
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      alert(errMsg);
      setIsDeleting(false);
    }
  };

  if (isIconOnly) {
    return (
      <button 
        onClick={handleDelete} 
        disabled={isDeleting}
        style={{ 
          background: 'none', 
          border: 'none', 
          color: 'var(--danger-color)', 
          cursor: isDeleting ? 'not-allowed' : 'pointer',
          padding: '0.25rem',
          opacity: isDeleting ? 0.5 : 1
        }}
        title="刪除"
      >
        <Trash2 size={18} />
      </button>
    );
  }

  return (
    <button 
      onClick={handleDelete} 
      disabled={isDeleting}
      className="btn"
      style={{ 
        backgroundColor: 'var(--danger-color-light)', 
        color: 'var(--danger-color)' 
      }}
    >
      <Trash2 size={20} />
      {isDeleting ? '刪除中...' : '刪除'}
    </button>
  );
}
