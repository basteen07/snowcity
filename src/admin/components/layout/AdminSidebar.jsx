import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  CalendarClock,
  Ticket,
  SquareStack,
  Clock3,
  Boxes,
  Gift,
  BadgePercent,
  Image as ImageIcon,
  FileText,
  Newspaper,
  Users,
  ShieldCheck,
  KeyRound,
  Network,
  BarChart3,
  PieChart,
  TrendingUp,
  SplitSquareHorizontal,
  UserCog,
  ChevronDown,
} from 'lucide-react';
import PermissionGate from '../common/PermissionGate.jsx';

const baseLinkClasses =
  'group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors';

const STORE_KEY = 'sc_admin_sidebar_open_sections';

function normalizeRoleName(r) {
  if (!r) return '';
  if (typeof r === 'string') return r.toLowerCase().trim();
  // In case roles are objects: { role_name: 'Root' } or { name: 'root' }
  return String(r.role_name || r.name || r).toLowerCase().trim();
}

function usePersistedSections(defaults) {
  const [openMap, setOpenMap] = React.useState(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return defaults;
      const obj = JSON.parse(raw);
      return typeof obj === 'object' && obj ? { ...defaults, ...obj } : defaults;
    } catch {
      return defaults;
    }
  });

  const save = React.useCallback((next) => {
    setOpenMap(next);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const setOne = React.useCallback(
    (key, val) => {
      save({ ...openMap, [key]: !!val });
    },
    [openMap, save]
  );

  return [openMap, setOne];
}

export default function AdminSidebar({ collapsed, onClose }) {
  const location = useLocation();

  // Roles, permissions, and user id from Redux
  const rolesRaw = useSelector((s) => s.adminAuth?.user?.roles || []);
  const userIdRaw = useSelector((s) => s.adminAuth?.user?.user_id ?? s.adminAuth?.user?.id ?? null);
  const permsRaw = useSelector((s) => s.adminAuth?.perms || []);
  const roles = (rolesRaw || []).map(normalizeRoleName);
  const perms = new Set((permsRaw || []).map((p) => String(p).toLowerCase().trim()));
  const isSuperUser = userIdRaw != null && Number(userIdRaw) === 1;

  // Show “Admin Management” if root/superadmin/superuser OR you granted explicit permission keys
  const canSeeAdminMgmt =
    isSuperUser ||
    roles.includes('root') ||
    roles.includes('superadmin') ||
    perms.has('admin-management:manage') ||
    perms.has('admin-management:write') ||
    perms.has('admin-management:read') ||
    perms.has('admins:manage') ||
    perms.has('admins:write') ||
    perms.has('admins:read');

  const handleNavClick = () => {
    if (typeof onClose === 'function') onClose();
  };

  const NAV_SECTIONS = React.useMemo(() => {
    const sections = [
      {
        key: 'Dashboard',
        label: 'Dashboard',
        items: [{ to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard }],
      },
      {
        key: 'Analytics',
        label: 'Analytics',
        items: [
          { to: '/admin/analytics/overview', label: 'Overview', icon: BarChart3 },
          { to: '/admin/analytics/attractions', label: 'Attractions-wise', icon: PieChart },
          { to: '/admin/analytics/daily', label: 'Daily Bookings', icon: CalendarClock },
          { to: '/admin/analytics/custom', label: 'Custom Period', icon: TrendingUp },
          { to: '/admin/analytics/people', label: 'People / Booking', icon: BarChart3 },
          { to: '/admin/analytics/views', label: 'Scoped Views', icon: SplitSquareHorizontal },
          { to: '/admin/analytics/split', label: 'Split Data', icon: PieChart },
        ],
      },
      {
        key: 'Bookings',
        label: 'Bookings',
        items: [{ to: '/admin/bookings', label: 'All Bookings', icon: CalendarClock }],
      },
      {
        key: 'Catalog',
        label: 'Catalog',
        items: [
          { to: '/admin/catalog/attractions', label: 'Attractions', icon: Ticket },
          { to: '/admin/catalog/combos', label: 'Combos', icon: SquareStack },
          { to: '/admin/catalog/slots', label: 'Slots', icon: Clock3 },
          { to: '/admin/catalog/slots/bulk', label: 'Bulk Slots', icon: Boxes },
          { to: '/admin/catalog/slots/new', label: 'Create Slot', icon: Clock3 },
          { to: '/admin/catalog/combo-slots', label: 'Combo Slots', icon: Clock3 },
          { to: '/admin/catalog/combo-slots/bulk', label: 'Bulk Combo Slots', icon: Boxes },
          { to: '/admin/catalog/combo-slots/new', label: 'Create Combo Slot', icon: Clock3 },
          { to: '/admin/catalog/addons', label: 'Add-ons', icon: Gift },
          { to: '/admin/catalog/offers', label: 'Offers', icon: BadgePercent },
          { to: '/admin/catalog/gallery', label: 'Gallery', icon: ImageIcon, permsAny: ['gallery:read'] },
          { to: '/admin/catalog/coupons', label: 'Coupons', icon: Ticket },
          { to: '/admin/catalog/banners', label: 'Banners', icon: ImageIcon },
          { to: '/admin/catalog/pages', label: 'Pages', icon: FileText },
          { to: '/admin/catalog/blogs', label: 'Blogs', icon: Newspaper },
        ],
      },
      {
        key: 'AdminManagement',
        label: 'Admin Management',
        items: [{ to: '/admin/admins', label: 'Admins', icon: UserCog, permsAny: ['admin-management:read'] }],
      },
      {
        key: 'UsersRBAC',
        label: 'Users & RBAC',
        items: [
          { to: '/admin/users', label: 'Users', icon: Users },
          { to: '/admin/roles', label: 'Roles', icon: ShieldCheck },
          { to: '/admin/permissions', label: 'Permissions', icon: KeyRound },
          { to: '/admin/rbac/matrix', label: 'RBAC Matrix', icon: Network },
        ],
      },
    ];
    return sections;
  }, [canSeeAdminMgmt]);

  const defaults = React.useMemo(
    () => ({
      Dashboard: true,
      Analytics: false,
      Bookings: true,
      Catalog: true,
      AdminManagement: true,
      UsersRBAC: false,
    }),
    []
  );

  const [openMap, setOpen] = usePersistedSections(defaults);

  // Auto-open section for current route
  React.useEffect(() => {
    const path = location.pathname || '';
    for (const s of NAV_SECTIONS) {
      const isActiveSection = s.items.some((it) => path.startsWith(it.to));
      if (isActiveSection && !openMap[s.key]) {
        setOpen(s.key, true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, NAV_SECTIONS]);

  const toggleSection = (key) => setOpen(key, !openMap[key]);

  return (
    <aside
      className={[
        'h-screen sticky top-0 border-r border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-[width] duration-200 ease-in-out shadow-sm dark:shadow-none',
        collapsed ? 'w-16' : 'w-64',
      ].join(' ')}
      aria-label="Admin navigation"
    >
      <div className="px-3 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-semibold">
            SC
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-neutral-100">SnowCity Admin</p>
              <p className="text-xs text-gray-500 dark:text-neutral-400">Control Center</p>
            </div>
          )}
        </div>
        <button
          className="md:hidden rounded-lg p-1 text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
          onClick={onClose}
          aria-label="Close navigation"
        >
          ✕
        </button>
      </div>

      <nav className="px-2 pb-4 h-[calc(100vh-80px)] overflow-y-auto">
        {NAV_SECTIONS.map((section) => {
          const isOpen = !!openMap[section.key];

          return (
            <div key={section.key} className="mt-3 first:mt-0">
              {/* Section header */}
              <button
                type="button"
                className={[
                  'w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm',
                  'text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800',
                ].join(' ')}
                onClick={() => toggleSection(section.key)}
                aria-expanded={isOpen}
                aria-controls={`section-${section.key}`}
                title={collapsed ? section.label : undefined}
              >
                {!collapsed && <span className="font-medium">{section.label}</span>}
                {collapsed && (
                  <span className="font-medium" aria-hidden="true">
                    {section.label.charAt(0)}
                  </span>
                )}
                <ChevronDown
                  className={[
                    'h-4 w-4 shrink-0 transition-transform',
                    isOpen ? 'rotate-180' : '',
                  ].join(' ')}
                />
              </button>

              {/* Items (submenu) */}
              <div
                id={`section-${section.key}`}
                className={[
                  'overflow-hidden transition-all',
                  isOpen ? 'max-h-[1200px] ease-in' : 'max-h-0 ease-out',
                ].join(' ')}
              >
                <div className="mt-1 space-y-1">
                  {section.items.map(({ to, end, label, icon: Icon, permsAny, permsAll }) => {
                    const link = (
                      <NavLink
                        key={to}
                        to={to}
                        end={end}
                        title={collapsed ? label : undefined}
                        className={({ isActive }) =>
                          [
                            baseLinkClasses,
                            collapsed ? 'justify-center px-2' : 'justify-start px-3',
                            isActive
                              ? 'bg-gray-900 text-white dark:bg-neutral-700 dark:text-white shadow-sm'
                              : 'text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800',
                          ].join(' ')
                        }
                        onClick={handleNavClick}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                        {!collapsed && <span>{label}</span>}
                      </NavLink>
                    );

                    if (permsAny || permsAll) {
                      return (
                        <PermissionGate key={to} anyOf={permsAny || []} allOf={permsAll || []}>
                          {link}
                        </PermissionGate>
                      );
                    }
                    return link;
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}