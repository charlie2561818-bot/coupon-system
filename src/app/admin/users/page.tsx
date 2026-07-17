'use client';

import { useState, useEffect } from 'react';
import { Users, PlusCircle, CheckCircle, XCircle } from 'lucide-react';

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('STAFF');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name, role })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMsg({ type: 'success', text: '帳號建立成功！' });
        setUsername('');
        setPassword('');
        setName('');
        setRole('STAFF');
        fetchUsers();
      } else {
        setMsg({ type: 'error', text: data.message || '建立失敗' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: '系統錯誤' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="h2">帳號管理</h1>
        <p className="text-muted">管理系統使用者與權限</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', minWidth: 0 }}>
        {/* Create User Form */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <PlusCircle size={24} style={{ color: 'var(--primary-color)' }} />
            <h2 className="h3" style={{ margin: 0 }}>建立新帳號</h2>
          </div>

          {msg.text && (
            <div className={`badge ${msg.type === 'success' ? 'badge-success' : 'badge-danger'}`} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', fontSize: '0.9rem' }}>
              {msg.type === 'success' ? <CheckCircle size={16}/> : <XCircle size={16}/>}
              {msg.text}
            </div>
          )}

          <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">使用者名稱 (姓名)</label>
              <input type="text" required className="form-input" value={name} onChange={e => setName(e.target.value)} disabled={isSubmitting} placeholder="例如：王小明" />
            </div>
            <div className="form-group">
              <label className="form-label">登入帳號 (Username)</label>
              <input type="text" required className="form-input" value={username} onChange={e => setUsername(e.target.value)} disabled={isSubmitting} placeholder="例如：ming" />
            </div>
            <div className="form-group">
              <label className="form-label">登入密碼</label>
              <input type="password" required className="form-input" value={password} onChange={e => setPassword(e.target.value)} disabled={isSubmitting} placeholder="初始密碼" />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">角色權限</label>
              <select className="form-input" value={role} onChange={e => setRole(e.target.value)} disabled={isSubmitting}>
                <option value="STAFF">店員 (STAFF) - 僅能核銷與修改個人設定</option>
                <option value="ADMIN">管理員 (ADMIN) - 擁有所有後台權限</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ gridColumn: '1 / -1' }} disabled={isSubmitting}>
              {isSubmitting ? '建立中...' : '建立帳號'}
            </button>
          </form>
        </div>

        {/* Users List */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Users size={24} style={{ color: 'var(--primary-color)' }} />
            <h2 className="h3" style={{ margin: 0 }}>使用者清單</h2>
          </div>

          {loading ? (
            <p>載入中...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem' }}>姓名</th>
                    <th style={{ padding: '1rem' }}>登入帳號</th>
                    <th style={{ padding: '1rem' }}>角色</th>
                    <th style={{ padding: '1rem' }}>建立時間</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>{user.name}</td>
                      <td style={{ padding: '1rem' }}>{user.username}</td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`badge ${user.role === 'ADMIN' ? 'badge-primary' : 'badge-secondary'}`} style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        目前沒有使用者
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
