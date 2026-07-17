'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Leaf, ArrowLeft } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'forgot_step1' | 'forgot_step2'>('login');
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Forgot Password State
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      redirect: false,
      username,
      password,
    });

    if (res?.error) {
      setError('帳號或密碼錯誤');
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  const handleGetQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/security/get-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      
      if (res.ok) {
        setQuestion(data.question);
        setMode('forgot_step2');
      } else {
        setError(data.message || '無法取得安全問答');
      }
    } catch (err) {
      setError('伺服器錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, answer, newPassword })
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess('密碼重設成功！請使用新密碼登入。');
        setMode('login');
        setPassword('');
        setAnswer('');
        setNewPassword('');
      } else {
        setError(data.message || '密碼重設失敗');
      }
    } catch (err) {
      setError('伺服器錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logoSection}>
          <div className={styles.iconWrapper}>
            <Leaf size={32} className={styles.logoIcon} />
          </div>
          <h1 className="h2">{mode === 'login' ? '系統登入' : '忘記密碼'}</h1>
          <p className="text-muted">優惠券多功能核銷系統</p>
        </div>

        {error && (
          <div className={styles.errorMessage} style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        
        {success && (
          <div className={styles.errorMessage} style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
            {success}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className={styles.form}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">帳號 (使用者名稱)</label>
              <input
                id="username"
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                placeholder="請輸入帳號"
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="password" style={{ margin: 0 }}>密碼</label>
                <button type="button" onClick={() => { setMode('forgot_step1'); setError(''); setSuccess(''); }} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.9rem', cursor: 'pointer' }}>
                  忘記密碼？
                </button>
              </div>
              <input
                id="password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="請輸入密碼"
                style={{ marginTop: '0.5rem' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? '登入中...' : '登入'}
            </button>
          </form>
        )}

        {mode === 'forgot_step1' && (
          <form onSubmit={handleGetQuestion} className={styles.form}>
            <div className="form-group">
              <label className="form-label">請輸入您的帳號</label>
              <input type="text" className="form-input" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={loading} placeholder="輸入帳號以尋找安全問答" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? '驗證中...' : '下一步'}
            </button>
            <button type="button" onClick={() => setMode('login')} className="btn btn-outline" style={{ width: '100%', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
              <ArrowLeft size={18} /> 返回登入
            </button>
          </form>
        )}

        {mode === 'forgot_step2' && (
          <form onSubmit={handleResetPassword} className={styles.form}>
            <div className="form-group">
              <label className="form-label">安全提示問題</label>
              <div style={{ padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '8px', color: '#374151', fontWeight: 500, marginBottom: '1rem' }}>
                {question}
              </div>
              <label className="form-label">請輸入答案</label>
              <input type="text" className="form-input" value={answer} onChange={(e) => setAnswer(e.target.value)} required disabled={loading} placeholder="您的安全答案" />
            </div>
            
            <div className="form-group">
              <label className="form-label">請設定新密碼</label>
              <input type="password" className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={loading} placeholder="輸入新密碼" />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? '重設中...' : '確認重設密碼'}
            </button>
            <button type="button" onClick={() => setMode('login')} className="btn btn-outline" style={{ width: '100%', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
              <ArrowLeft size={18} /> 返回登入
            </button>
          </form>
        )}
      </div>
      
      <div className={`${styles.blob} ${styles.blob1}`}></div>
      <div className={`${styles.blob} ${styles.blob2}`}></div>
    </div>
  );
}
