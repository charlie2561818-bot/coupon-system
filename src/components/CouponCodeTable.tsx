'use client';

import { useState } from 'react';
import { QrCode, X } from 'lucide-react';
import QRCodeDisplay from './QRCodeDisplay';

interface CouponCode {
  id: string;
  code: string;
  maxUsage: number;
  redeemedQuantity: number;
}

interface CouponCodeTableProps {
  title: string;
  codes: CouponCode[];
}

export default function CouponCodeTable({ title, codes }: CouponCodeTableProps) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(codes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCodes = codes.slice(startIndex, startIndex + itemsPerPage);

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
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}><code style={{ backgroundColor: 'var(--bg-color)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{c.code}</code></td>
                  <td style={{ padding: '1rem' }}>{c.maxUsage}</td>
                  <td style={{ padding: '1rem' }}>{c.redeemedQuantity}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${isUsedUp ? 'badge-warning' : 'badge-success'}`}>
                      {isUsedUp ? '已使用' : '可使用'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      className="btn btn-outline" 
                      onClick={() => setSelectedCode(c.code)}
                      style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <QrCode size={16} />
                      顯示 QR Code
                    </button>
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
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            上一頁
          </button>
          <span style={{ color: 'var(--text-secondary)' }}>
            第 {currentPage} 頁，共 {totalPages} 頁
          </span>
          <button 
            className="btn btn-outline" 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
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
