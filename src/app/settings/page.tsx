import SecuritySettings from '@/components/SecuritySettings';

export default function SettingsPage() {
  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="h2">個人設定</h1>
        <p className="text-muted">管理您的帳號安全與登入資訊</p>
      </div>

      <SecuritySettings />
    </div>
  );
}
