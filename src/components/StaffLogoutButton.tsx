'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import styles from './StaffLogoutButton.module.css';

export default function StaffLogoutButton() {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: '/login' })}
      className={styles.logoutBtn}
    >
      <LogOut size={18} />
      <span>登出</span>
    </button>
  );
}
