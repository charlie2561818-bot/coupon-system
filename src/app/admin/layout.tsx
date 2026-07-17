import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import styles from './layout.module.css';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if ((session.user as any)?.role !== 'ADMIN') {
    // If not admin, maybe redirect to a staff page later, or just access denied
    // For now redirect to login
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
