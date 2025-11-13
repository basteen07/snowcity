import React from 'react';
import { NavLink } from 'react-router-dom';
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
} from 'lucide-react';


const baseLinkClasses =
  'group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors';

export default function AdminSidebar({ collapsed, onClose }) {
  const roles = useSelector((s) => s.adminAuth?.user?.roles || []);
  const roleSet = new Set((roles || []).map((r) => String(r).toLowerCase()));
  const isRoot = roleSet.has('root admin') || roleSet.has('admin');

  const handleNavClick = () => {
    if (typeof onClose === 'function') onClose();
  };

  // Sidebar sections in the required order
  const NAV_SECTIONS = [
    {
      label: 'Dashboard',
      items: [{ to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
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
      label: 'Bookings',
      items: [{ to: '/admin/bookings', label: 'All Bookings', icon: CalendarClock }],
    },{
  label: 'Catalog',
  items: [
    { to: '/admin/catalog/attractions', label: 'Attractions', icon: Ticket },
    { to: '/admin/catalog/combos', label: 'Combos', icon: SquareStack },
    { to: '/admin/catalog/slots', label: 'Slots', icon: Clock3 },
    { to: '/admin/catalog/slots/bulk', label: 'Bulk Slots', icon: Boxes },
    { to: '/admin/catalog/slots/new', label: 'Create Slot', icon: Clock3 },

    // NEW: Combo Slots
    { to: '/admin/catalog/combo-slots', label: 'Combo Slots', icon: Clock3 },
    { to: '/admin/catalog/combo-slots/bulk', label: 'Bulk Combo Slots', icon: Boxes },
    { to: '/admin/catalog/combo-slots/new', label: 'Create Combo Slot', icon: Clock3 },

    { to: '/admin/catalog/addons', label: 'Add-ons', icon: Gift },
    { to: '/admin/catalog/offers', label: 'Offers', icon: BadgePercent },
    { to: '/admin/catalog/gallery', label: 'Gallery', icon: ImageIcon },
    { to: '/admin/catalog/coupons', label: 'Coupons', icon: Ticket },
    { to: '/admin/catalog/banners', label: 'Banners', icon: ImageIcon },
    { to: '/admin/catalog/pages', label: 'Pages', icon: FileText },
    { to: '/admin/catalog/blogs', label: 'Blogs', icon: Newspaper },
  ],
},
    // {
    //   label: 'Catalog',
    //   items: [
    //     { to: '/admin/catalog/attractions', label: 'Attractions', icon: Ticket },
    //     { to: '/admin/catalog/combos', label: 'Combos', icon: SquareStack },
    //     { to: '/admin/catalog/slots', label: 'Slots', icon: Clock3 },
    //     { to: '/admin/catalog/slots/bulk', label: 'Bulk Slots', icon: Boxes },
    //     { to: '/admin/catalog/slots/new', label: 'Create Slot', icon: Clock3 },
    //     { to: '/admin/catalog/addons', label: 'Add-ons', icon: Gift },
    //     { to: '/admin/catalog/offers', label: 'Offers', icon: BadgePercent },
    //     { to: '/admin/catalog/gallery', label: 'Gallery', icon: ImageIcon },
    //     { to: '/admin/catalog/coupons', label: 'Coupons', icon: Ticket },
    //     { to: '/admin/catalog/banners', label: 'Banners', icon: ImageIcon },
    //     { to: '/admin/catalog/pages', label: 'Pages', icon: FileText },
    //     { to: '/admin/catalog/blogs', label: 'Blogs', icon: Newspaper },
    //   ],
    // },
    // Admin Management (root/superadmin only)
  
          {
            label: 'Admin Management',
            items: [{ to: '/admin/admins', label: 'Admins', icon: UserCog }],
          },
     
    {
      label: 'Users & RBAC',
      items: [
        { to: '/admin/users', label: 'Users', icon: Users },
        { to: '/admin/roles', label: 'Roles', icon: ShieldCheck },
        { to: '/admin/permissions', label: 'Permissions', icon: KeyRound },
        { to: '/admin/rbac/matrix', label: 'RBAC Matrix', icon: Network },
      ],
    },
  ];

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
              <p className="text-sm font-semibold text-gray-900 dark:text-neutral-100">
                SnowCity Admin
              </p>
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
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mt-4 first:mt-0">
            {!collapsed && (
              <p className="px-3 pb-2 text-xs uppercase tracking-wide text-gray-500 dark:text-neutral-500">
                {section.label}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map(({ to, end, label, icon: Icon }) => (
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
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}