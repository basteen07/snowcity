import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { adminLogout } from '../../features/auth/adminAuthSlice';
import ThemeToggle from '../common/ThemeToggle';
import { Link } from 'react-router-dom';

export default function AdminTopbar({ onToggleSidebar, onToggleMobile }) {
  const user = useSelector((s) => s.adminAuth?.user);
  const dispatch = useDispatch();
  const initial = (user?.name || user?.email || 'A').charAt(0).toUpperCase();

  const [open, setOpen] = React.useState(false);

  return (
    <header className="h-14 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between px-3 md:px-4 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <button className="md:hidden px-3 py-1 rounded-md border hover:bg-gray-50 dark:hover:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700" onClick={onToggleMobile}>☰</button>
        <button className="hidden md:block px-3 py-1 rounded-md border hover:bg-gray-50 dark:hover:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700" onClick={onToggleSidebar}>☰</button>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:block">
          <ThemeToggle compact />
        </div>

        <div className="relative">
          <button
            className="h-9 w-9 rounded-full bg-gray-900 text-white flex items-center justify-center"
            title={user?.name || user?.email || 'Profile'}
            onClick={() => setOpen((v) => !v)}
          >
            {initial}
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg z-50">
              <div className="px-3 py-2 text-sm text-gray-700 dark:text-neutral-200">
                {user?.name || user?.email || 'Profile'}
              </div>
              <div className="px-3 py-2">
                <div className="mb-2 text-xs text-gray-500 dark:text-neutral-400">Theme</div>
                <ThemeToggle />
              </div>
              <div className="border-t border-gray-200 dark:border-neutral-800" />
              <Link
                to="/admin/profile"
                className="block px-3 py-2 text-sm text-gray-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-b-xl"
                onClick={() => setOpen(false)}
              >
                Profile & Settings
              </Link>
              <button
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-b-xl"
                onClick={() => { setOpen(false); dispatch(adminLogout()); }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}