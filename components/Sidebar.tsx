
import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  QrCode, 
  ScanLine, 
  FolderTree, 
  BarChart3, 
  Settings,
  LogOut,
  ShieldCheck,
  User as UserIcon
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: User | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen, user, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'archive-list', label: 'Daftar Arsip', icon: FileText },
    { id: 'search', label: 'Cari Berkas', icon: Search },
    { id: 'labels', label: 'Label Arsip', icon: QrCode },
    { id: 'scanner', label: 'Scan Box Arsip', icon: ScanLine },
    { id: 'categories', label: 'Kategori IP', icon: FolderTree },
    { id: 'reports', label: 'Laporan', icon: BarChart3 },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-[#020617] text-white p-6 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out border-r border-white/5
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between py-4 mb-10">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2.5 rounded-2xl shadow-2xl shadow-blue-500/20">
              <img 
                src="https://lh3.googleusercontent.com/d/1he5AoYAHMd9dlg47zLlR_-vSX_tQ9u95" 
                alt="DJKI Logo" 
                className="w-8 h-8 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="leading-none">
              <h1 className="font-black text-xl tracking-tighter text-white">DJKI VAULT</h1>
              <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.2em]">Secure Archive</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 1024) setIsOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200 group relative ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-2xl shadow-blue-900/40' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'
              }`} />
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
              {activeTab === item.id && (
                <motion.div 
                  layoutId="active-pill"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" 
                />
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
          <div className="p-4 bg-white/5 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className="flex items-center gap-4 relative z-10">
              <div className="relative">
                <img 
                  src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"} 
                  className="w-10 h-10 rounded-2xl border-2 border-white/10 shadow-lg" 
                  alt="User" 
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#020617] rounded-full"></div>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-black truncate text-white">{user?.name || 'Guest User'}</p>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-blue-400" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">
                    {user?.role === 'SUPERADMIN' ? 'Super Admin' : 'Unit Admin'}
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full -mr-12 -mt-12"></div>
          </div>

          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-400 hover:bg-red-400/10 transition-all font-bold text-sm group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
