import React from 'react';
import {
  LayoutDashboard,
  Archive,
  QrCode,
  ScanLine,
  LogOut,
  X,
  Menu,
  User as UserIcon,
  FileText,
  Settings,
  Users,
  Shield,
  Layers,
  Building2,
  ListTree
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  user: User | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
  user,
  onLogout
}) => {

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'archive-list', label: 'Daftar Arsip', icon: Archive },
    { id: 'reports', label: 'Laporan', icon: FileText },
    { id: 'labels', label: 'Cetak Label', icon: QrCode },
    { id: 'scanner', label: 'Scanner Box', icon: ScanLine },
  ];

  const adminItems = [
    { id: 'categories', label: 'Kategori Arsip', icon: Layers },
    { id: 'classification', label: 'Klasifikasi Arsip', icon: ListTree },
    { id: 'users', label: 'Pengaturan User', icon: Users },
    { id: 'access', label: 'Akses Halaman', icon: Shield },
    { id: 'units', label: 'Pengaturan Unit', icon: Building2 },
    { id: 'settings', label: 'Pengaturan Sistem', icon: Settings },
  ];

  const handleClick = (id: string) => {
    setActiveTab(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed top-0 left-0 bottom-0
        ${isCollapsed ? 'w-20' : 'w-64'}
        bg-[#0f172a]
        border-r border-white/5
        z-50
        transition-all duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >

        <div className="flex flex-col h-full">

          {/* Header / Logo */}
          <div className="p-6 flex items-center justify-between">

            <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-4'}`}>

              <div className="w-10 h-10 bg-white p-2 rounded-xl flex items-center justify-center shadow-lg">
                <img
                  src="https://lh3.googleusercontent.com/d/1he5AoYAHMd9dlg47zLlR_-vSX_tQ9u95"
                  alt="DJKI Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {!isCollapsed && (
                <div>
                  <h1 className="font-black text-white text-lg tracking-tight">
                    DJKI
                  </h1>
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                    Vault System
                  </p>
                </div>
              )}
            </div>

            {/* Desktop Collapse Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex text-slate-400 hover:text-white"
            >
              <Menu size={20} />
            </button>

            {/* Mobile Close */}
            <button
              className="lg:hidden text-slate-400"
              onClick={() => setIsOpen(false)}
            >
              <X size={20} />
            </button>

          </div>

          {/* User Info */}
          {!isCollapsed && (
            <div className="px-6 mb-6">
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">

                <div className="flex items-center gap-3">

                  <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <UserIcon size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {user?.name || 'Guest'}
                    </p>

                    <p className="text-[10px] uppercase text-slate-500 truncate">
                      {user?.role || 'Guest'}
                    </p>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">

            {!isCollapsed && (
              <p className="px-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">
                Menu Utama
              </p>
            )}

            {menuItems.map((item) => (

              <button
                key={item.id}
                onClick={() => handleClick(item.id)}
                className={`
                w-full flex items-center
                ${isCollapsed ? 'justify-center' : 'gap-3'}
                px-4 py-3
                rounded-xl
                text-sm font-bold
                transition-all
                group
                ${activeTab === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }
              `}
              >

                <item.icon
                  className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-500'
                    }`}
                />

                {!isCollapsed && item.label}

              </button>

            ))}

            {/* Admin Menu */}
            {user?.role === 'SUPERADMIN' && (
              <>
                {!isCollapsed && (
                  <div className="pt-6 pb-2">
                    <p className="px-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      Sistem
                    </p>
                  </div>
                )}

                {adminItems.map((item) => (

                  <button
                    key={item.id}
                    onClick={() => handleClick(item.id)}
                    className={`
                    w-full flex items-center
                    ${isCollapsed ? 'justify-center' : 'gap-3'}
                    px-4 py-3
                    rounded-xl
                    text-sm font-bold
                    transition-all
                    ${activeTab === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }
                  `}
                  >

                    <item.icon className="w-5 h-5" />

                    {!isCollapsed && item.label}

                  </button>

                ))}
              </>
            )}

          </nav>

          {/* Footer */}
          <div className="p-4 mt-auto">

            {!isCollapsed && (
              <div className="mb-4 text-center">
                <p className="text-[9px] text-slate-600 uppercase tracking-widest">
                  Developed By
                </p>

                <p className="text-[10px] text-blue-400 font-bold">
                  caqiestudioproduction
                </p>
              </div>
            )}

            <button
              onClick={onLogout}
              className={`
              w-full flex items-center
              ${isCollapsed ? 'justify-center' : 'gap-3'}
              px-4 py-3
              rounded-xl
              font-bold
              text-red-400
              bg-red-500/5
              border border-red-500/10
              hover:bg-red-500/10
            `}
            >
              <LogOut size={18} />

              {!isCollapsed && 'Keluar'}

            </button>

          </div>

        </div>

      </aside>
    </>
  );
};

export default Sidebar;