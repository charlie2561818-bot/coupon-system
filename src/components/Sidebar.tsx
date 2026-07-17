'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Ticket, LayoutDashboard, LogOut, PlusCircle, Users, Settings } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || 'STAFF';

  const navItems = [
    { name: '總覽', href: '/admin', icon: LayoutDashboard, roles: ['ADMIN'] },
    { name: '發行優惠券', href: '/admin/coupons/new', icon: PlusCircle, roles: ['ADMIN'] },
    { name: '現場核銷機', href: '/staff', icon: Ticket, roles: ['ADMIN', 'STAFF'] },
    { name: '帳號管理', href: '/admin/users', icon: Users, roles: ['ADMIN'] },
    { name: '個人設定', href: '/settings', icon: Settings, roles: ['ADMIN', 'STAFF'] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Ticket className={styles.logoIcon} />
        <span className={styles.logoText}>優惠券管理後台</span>
      </div>
      
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                >
                  <Icon className={styles.navIcon} size={20} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className={styles.footer}>
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={styles.logoutBtn}
        >
          <LogOut size={20} />
          登出系統
        </button>
      </div>
    </aside>
  );
}
