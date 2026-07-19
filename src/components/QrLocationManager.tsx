'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Link as LinkIcon, QrCode } from 'lucide-react';

interface QrLocation {
  id: string;
  name: string;
  activeCampaignId: string | null;
  createdAt: string;
}

interface Campaign {
  id: string;
  title: string;
  englishTitle: string | null;
  mode: string;
}

export default function QrLocationManager() {
  const [locations, setLocations] = useState<QrLocation[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/qr-locations');
      const data = await res.json();
      if (data.success) {
        setLocations(data.locations);
        setCampaigns(data.activeCampaigns);
      }
    } catch (err) {
      console.error('Failed to fetch QR locations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch('/api/admin/qr-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setNewName('');
        showMessage('立牌已新增！', 'success');
        fetchData();
      } else {
        showMessage(data.message || '新增失敗', 'error');
      }
    } catch (_err) {
      showMessage('新增失敗', 'error');
    }
  };

  const handleBind = async (id: string, activeCampaignId: string) => {
    setSavingId(id);
    try {
      const res = await fetch('/api/admin/qr-locations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, activeCampaignId: activeCampaignId || null })
      });
      const data = await res.json();
      if (data.success) {
        showMessage('綁定已更新！', 'success');
        fetchData();
      } else {
        showMessage(data.message || '更新失敗', 'error');
      }
    } catch (_err) {
      showMessage('更新失敗', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`確定要刪除「${name}」嗎？`)) return;
    try {
      const res = await fetch(`/api/admin/qr-locations?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showMessage('已刪除', 'success');
        fetchData();
      } else {
        showMessage(data.message || '刪除失敗', 'error');
      }
    } catch (_err) {
      showMessage('刪除失敗', 'error');
    }
  };

  const getQrUrl = (id: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/scan/${id}`;
    }
    return `/scan/${id}`;
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>載入中...</div>;
  }

  return (
    <div>
      {message && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: message.type === 'success' ? '#16a34a' : '#dc2626',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          fontSize: '0.9rem'
        }}>
          {message.text}
        </div>
      )}

      {/* 新增立牌 */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="輸入立牌名稱（例如：泡茶區原木立牌）"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          style={{
            flex: 1,
            padding: '0.625rem 1rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            fontSize: '0.9rem',
            background: 'var(--bg-color)',
            color: 'var(--text-primary)',
          }}
        />
        <button
          onClick={handleAdd}
          disabled={!newName.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--primary-color)',
            color: 'white',
            cursor: newName.trim() ? 'pointer' : 'not-allowed',
            opacity: newName.trim() ? 1 : 0.5,
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        >
          <Plus size={16} /> 新增
        </button>
      </div>

      {/* 立牌列表 */}
      {locations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <MapPin size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p>尚未建立任何實體立牌</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {locations.map(loc => (
            <div key={loc.id} style={{
              padding: '1.25rem',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              background: 'var(--bg-color)',
            }}>
              {/* 第一行：名稱 + 刪除 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <QrCode size={18} style={{ color: 'var(--primary-color)' }} />
                  <strong style={{ fontSize: '1rem' }}>{loc.name}</strong>
                </div>
                {loc.id !== 'LINE_LIFF' && (
                  <button
                    onClick={() => handleDelete(loc.id, loc.name)}
                    title="刪除立牌"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      borderRadius: '4px',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* 第二行：綁定下拉選單 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>綁定活動：</label>
                <select
                  value={loc.activeCampaignId || ''}
                  onChange={(e) => handleBind(loc.id, e.target.value)}
                  disabled={savingId === loc.id}
                  style={{
                    flex: 1,
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    background: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="">❌ 不綁定任何活動</option>
                  <option value="BLINDBOX">🎁 盲盒模式 (Blindbox)</option>
                  <optgroup label="進行中的活動">
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.mode === 'SINGLE_USE' ? '🅰️' : '🅱️'} {c.title} {c.englishTitle ? `(${c.englishTitle})` : ''}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* 第三行：固定網址 */}
              {loc.id === 'LINE_LIFF' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LinkIcon size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>此項目專門用來控制 LINE 官方帳號內的圖文選單。</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LinkIcon size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                  <code style={{
                    fontSize: '0.8rem',
                    color: 'var(--primary-color)',
                    background: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}>
                    {getQrUrl(loc.id)}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getQrUrl(loc.id));
                      showMessage('已複製網址！', 'success');
                    }}
                    title="複製網址"
                    style={{
                      background: 'white',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '0.25rem 0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      flexShrink: 0,
                    }}
                  >
                    複製
                  </button>
                </div>
              )}

              {/* 狀態標籤 */}
              <div style={{ marginTop: '0.75rem' }}>
                {!loc.activeCampaignId ? (
                  <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', background: '#f3f4f6', color: '#6b7280' }}>
                    ⏸️ 未綁定
                  </span>
                ) : loc.activeCampaignId === 'BLINDBOX' ? (
                  <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', background: '#fef3c7', color: '#b45309' }}>
                    🎁 盲盒模式
                  </span>
                ) : (
                  <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', background: '#dcfce7', color: '#16a34a' }}>
                    ✅ 已綁定活動
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
