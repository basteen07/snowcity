import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import useAdminTheme from '../../hooks/useAdminTheme';
import { useDispatch } from 'react-redux';
import { adminHydratePermissions } from '../../features/auth/adminAuthThunks';

export default function AdminLayout() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const dispatch = useDispatch();

  useAdminTheme();

  React.useEffect(() => {
    dispatch(adminHydratePermissions()).catch(() => {});
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-neutral-950">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(14,165,233,0.09),transparent_50%)]" />
      </div>

      <div className="relative z-10 flex">
        <div className="hidden md:block">
          <AdminSidebar collapsed={collapsed} onClose={() => {}} />
        </div>

        {mobileOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setMobileOpen(false)} />
            <div className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-neutral-900 z-50 shadow-lg">
              <AdminSidebar collapsed={false} onClose={() => setMobileOpen(false)} />
            </div>
          </>
        )}

        <div className="flex-1 min-w-0">
          <AdminTopbar
            onToggleSidebar={() => setCollapsed((v) => !v)}
            onToggleMobile={() => setMobileOpen((v) => !v)}
          />
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}