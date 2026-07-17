'use client';

import { useState } from 'react';
import { Shield, Key, CheckCircle, XCircle } from 'lucide-react';
import styles from './SecuritySettings.module.css';

const SECURITY_QUESTIONS = [
  "我的第一台電動車型號是？",
  "我最常玩的飛行模擬遊戲是？",
  "我最喜歡的棒球脫口秀節目是？",
  "我常用的廚餘堆肥系統是哪位老師的？"
];

export default function SecuritySettings() {
  const [newUsername, setNewUsername] = useState('');
  const [unameMsg, setUnameMsg] = useState({ type: '', text: '' });
  const [unameLoading, setUnameLoading] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  const [question, setQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [answer, setAnswer] = useState('');
  const [secMsg, setSecMsg] = useState({ type: '', text: '' });
  const [secLoading, setSecLoading] = useState(false);

  const handleUsernameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnameLoading(true);
    setUnameMsg({ type: '', text: '' });

    try {
      const res = await fetch('/api/users/change-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newUsername })
      });
      const data = await res.json();
      if (res.ok) {
        setUnameMsg({ type: 'success', text: '帳號修改成功！下次請使用新帳號登入。' });
        setNewUsername('');
      } else {
        setUnameMsg({ type: 'error', text: data.message || '修改失敗' });
      }
    } catch (err) {
      setUnameMsg({ type: 'error', text: '系統錯誤' });
    } finally {
      setUnameLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdLoading(true);
    setPwdMsg({ type: '', text: '' });

    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPwdMsg({ type: 'success', text: '密碼修改成功！' });
        setOldPassword('');
        setNewPassword('');
      } else {
        setPwdMsg({ type: 'error', text: data.message || '修改失敗' });
      }
    } catch (err) {
      setPwdMsg({ type: 'error', text: '系統錯誤' });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleSecuritySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecLoading(true);
    setSecMsg({ type: '', text: '' });

    try {
      const res = await fetch('/api/security/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer })
      });
      const data = await res.json();
      if (res.ok) {
        setSecMsg({ type: 'success', text: '安全問答設定成功！' });
        setAnswer('');
      } else {
        setSecMsg({ type: 'error', text: data.message || '設定失敗' });
      }
    } catch (err) {
      setSecMsg({ type: 'error', text: '系統錯誤' });
    } finally {
      setSecLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Shield size={24} style={{ color: 'var(--primary-color)' }} />
          <h2 className="h3" style={{ margin: 0 }}>變更登入帳號</h2>
        </div>
        
        {unameMsg.text && (
          <div className={`badge ${unameMsg.type === 'success' ? 'badge-success' : 'badge-danger'}`} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', fontSize: '0.9rem' }}>
            {unameMsg.type === 'success' ? <CheckCircle size={16}/> : <XCircle size={16}/>}
            {unameMsg.text}
          </div>
        )}

        <form onSubmit={handleUsernameChange}>
          <div className="form-group">
            <label className="form-label">新帳號 (Username)</label>
            <input type="text" required className="form-input" value={newUsername} onChange={e => setNewUsername(e.target.value)} disabled={unameLoading} placeholder="請輸入新的登入帳號" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={unameLoading}>
            {unameLoading ? '儲存中...' : '更新帳號'}
          </button>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Key size={24} style={{ color: 'var(--primary-color)' }} />
          <h2 className="h3" style={{ margin: 0 }}>修改密碼</h2>
        </div>
        
        {pwdMsg.text && (
          <div className={`badge ${pwdMsg.type === 'success' ? 'badge-success' : 'badge-danger'}`} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', fontSize: '0.9rem' }}>
            {pwdMsg.type === 'success' ? <CheckCircle size={16}/> : <XCircle size={16}/>}
            {pwdMsg.text}
          </div>
        )}

        <form onSubmit={handlePasswordChange}>
          <div className="form-group">
            <label className="form-label">目前密碼</label>
            <input type="password" required className="form-input" value={oldPassword} onChange={e => setOldPassword(e.target.value)} disabled={pwdLoading} />
          </div>
          <div className="form-group">
            <label className="form-label">新密碼</label>
            <input type="password" required className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={pwdLoading} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={pwdLoading}>
            {pwdLoading ? '儲存中...' : '更新密碼'}
          </button>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Shield size={24} style={{ color: 'var(--primary-color)' }} />
          <h2 className="h3" style={{ margin: 0 }}>設定安全問答 (忘記密碼用)</h2>
        </div>

        {secMsg.text && (
          <div className={`badge ${secMsg.type === 'success' ? 'badge-success' : 'badge-danger'}`} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', fontSize: '0.9rem' }}>
            {secMsg.type === 'success' ? <CheckCircle size={16}/> : <XCircle size={16}/>}
            {secMsg.text}
          </div>
        )}

        <form onSubmit={handleSecuritySetup}>
          <div className="form-group">
            <label className="form-label">選擇安全提示問題</label>
            <select className="form-input" value={question} onChange={e => setQuestion(e.target.value)} disabled={secLoading}>
              {SECURITY_QUESTIONS.map(q => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">安全提示答案</label>
            <input type="text" required className="form-input" value={answer} onChange={e => setAnswer(e.target.value)} disabled={secLoading} placeholder="請輸入答案 (將會加密儲存)" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={secLoading}>
            {secLoading ? '儲存中...' : '設定安全問答'}
          </button>
        </form>
      </div>
    </div>
  );
}
