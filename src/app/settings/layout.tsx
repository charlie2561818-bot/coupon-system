import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import styles from '../admin/layout.module.css';

export const metadata = {
  title: '個人設定',
};

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Both ADMIN and STAFF can access settings
  const role = (session.user as any)?.role;
  if (role !== 'STAFF' && role !== 'ADMIN') {
    redirect('/login?error=AccessDenied');
  }

  return (
    <div className={styles.adminLayoutWrapper}>
      <Sidebar />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
