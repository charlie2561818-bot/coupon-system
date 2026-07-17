'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Ticket, LayoutDashboard, LogOut, PlusCircle } from 'lucide-react';
import { signOut } from 'next-auth/react';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: '總覽', href: '/admin', icon: LayoutDashboard },
    { name: '發行優惠券', href: '/admin/coupons/new', icon: PlusCircle },
    { name: '現場核銷機', href: '/staff', icon: Ticket },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Ticket className={styles.logoIcon} />
        <span className={styles.logoText}>優惠券管理後台</span>
      </div>
      
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {navItems.map((item) => {
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
