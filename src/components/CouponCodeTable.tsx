'use client';

import { useState, useEffect } from 'react';
import { QrCode, X, Check, Send } from 'lucide-react';
import QRCodeDisplay from './QRCodeDisplay';

interface CouponCode {
  id: string;
  code: string;
  maxUsage: number;
  redeemedQuantity: number;
  isDistributed: boolean;
}

interface CouponCodeTableProps {
  title: string;
  codes: CouponCode[];
}

export default function CouponCodeTable({ title, codes: initialCodes }: CouponCodeTableProps) {
  const [codes, setCodes] = useState(initialCodes);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Sync with server data on soft refreshes
  useEffect(() => {
    setCodes(initialCodes);
  }, [initialCodes]);

  // Restore page and scroll position from sessionStorage
  useEffect(() => {
    const savedPage = sessionStorage.getItem(`coupon_page_${title}`);
    if (savedPage) {
      setCurrentPage(parseInt(savedPage, 10));
    }

    // Restore scroll position after DOM updates
    const savedScroll = sessionStorage.getItem(`coupon_scroll_${title}`);
    if (savedScroll) {
      setTimeout(() => {
        const scrollContainer = document.querySelector('main');
        if (scrollContainer) {
          scrollContainer.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'instant' });
        } else {
          window.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'instant' });
        }
      }, 100);
    }

    // Save scroll position before reload
    const handleBeforeUnload = () => {
      const scrollContainer = document.querySelector('main');
      const scrollY = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
      sessionStorage.setItem(`coupon_scroll_${title}`, scrollY.toString());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [title]);

  const handlePageChange = (updater: (prev: number) => number) => {
    setCurrentPage(prev => {
      const next = updater(prev);
      sessionStorage.setItem(`coupon_page_${title}`, next.toString());
      return next;
    });
  };

  const totalPages = Math.ceil(codes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCodes = codes.slice(startIndex, startIndex + itemsPerPage);

  const handleMarkDistributed = async (id: string) => {
    try {
      setIsUpdating(id);
      const res = await fetch(`/api/codes/${id}/distribute`, {
        method: 'PATCH',
      });
      
      if (res.ok) {
        setCodes(prev => prev.map(c => 
          c.id === id ? { ...c, isDistributed: true } : c
        ));
      } else {
        alert('標記失敗，請稍後再試');
      }
    } catch (error) {
      console.error(error);
      alert('發生錯誤');
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 className="h3" style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>
        序號清單 ({codes.length} 組)
      </h3>
      
      <div style={{ overflowX: 'auto', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', fontWeight: 600 }}>序號 (Code)</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>使用次數限制</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>已核銷次數</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>狀態</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {currentCodes.map(c => {
              const isUsedUp = c.redeemedQuantity >= c.maxUsage;
              const rowStyle = c.isDistributed && !isUsedUp ? { backgroundColor: 'rgba(0, 0, 0, 0.02)' } : {};
              
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', ...rowStyle }}>
                  <td style={{ padding: '1rem' }}><code style={{ backgroundColor: 'var(--bg-color)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{c.code}</code></td>
                  <td style={{ padding: '1rem' }}>{c.maxUsage}</td>
                  <td style={{ padding: '1rem' }}>{c.redeemedQuantity}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className={`badge ${isUsedUp ? 'badge-warning' : 'badge-success'}`}>
                        {isUsedUp ? '已使用' : '可使用'}
                      </span>
                      {c.isDistributed && !isUsedUp && (
                        <span className="badge badge-secondary" style={{ backgroundColor: '#e2e8f0', color: '#475569' }}>
                          <Check size={12} style={{ marginRight: '2px' }}/> 已發出
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-outline" 
                        onClick={() => setSelectedCode(c.code)}
                        style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <QrCode size={16} />
                        顯示 QR Code
                      </button>
                      
                      {!c.isDistributed && !isUsedUp && (
                        <button 
                          className="btn btn-primary" 
                          onClick={() => handleMarkDistributed(c.id)}
                          disabled={isUpdating === c.id}
                          style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          <Send size={16} />
                          {isUpdating === c.id ? '處理中...' : '標記為已發出'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => handlePageChange(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            上一頁
          </button>
          <span style={{ color: 'var(--text-secondary)' }}>
            第 {currentPage} 頁，共 {totalPages} 頁
          </span>
          <button 
            className="btn btn-outline" 
            onClick={() => handlePageChange(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            下一頁
          </button>
        </div>
      )}

      {selectedCode && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card animate-fade-in" style={{ maxWidth: '400px', width: '100%', position: 'relative' }}>
            <button 
              onClick={() => setSelectedCode(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            <h3 className="h3" style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>核銷 QR Code</h3>
            <p className="text-muted" style={{ textAlign: 'center', marginBottom: '2rem' }}>
              請將此畫面提供給店員掃描
            </p>
            <QRCodeDisplay value={selectedCode} title={title} />
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <code style={{ fontSize: '1.25rem', fontWeight: 'bold', backgroundColor: 'var(--bg-color)', padding: '0.5rem 1rem', borderRadius: '4px' }}>
                {selectedCode}
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
