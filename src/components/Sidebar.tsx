import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, X } from 'lucide-react';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inquiries', label: 'Inquiries', icon: FileText },
];

type SidebarProps = { mobileOpen: boolean; onClose: () => void };

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const location = useLocation();

  const navContent = (
    <div className="flex flex-col h-full bg-white">
      {/* Branding */}
      <div className="p-5 flex items-center justify-between gap-3 border-b border-slate-200">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img
            src="https://aryanannagroup.com/Screenshot%202025-11-22%20at%2013.01.36.png"
            alt="Aryan (Anna) Group"
            className="h-9 w-9 flex-shrink-0 rounded-lg object-contain"
          />
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold text-slate-900 truncate leading-tight">
              Aryan (Anna) Group
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              CRM & Inquiry Hub
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="p-2.5 flex-1">
        <ul className="space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 border-l-2 -ml-0.5 pl-[11px] ${
                    isActive
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0 opacity-90" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-30 transition-opacity md:hidden ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`w-64 h-screen fixed left-0 top-0 overflow-y-auto z-40 md:z-20
          border-r border-slate-200 bg-white
          transform transition-transform duration-200 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        {navContent}
      </aside>
    </>
  );
}
