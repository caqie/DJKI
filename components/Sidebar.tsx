
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'search', label: 'Cari Berkas', icon: '🔍' },
    { id: 'upload', label: 'Unggah Berkas', icon: '📤' },
    { id: 'scanner', label: 'Scan Box Arsip', icon: '📷' },
    { id: 'categories', label: 'Kategori IP', icon: '🏷️' },
    { id: 'reports', label: 'Laporan', icon: '📈' },
    { id: 'settings', label: 'Pengaturan', icon: '⚙️' },
  ];

  return (
    <div className="w-64 bg-slate-900 h-screen fixed left-0 top-0 text-white p-4 shadow-xl z-10 flex flex-col">
      <div className="flex items-center gap-3 px-2 py-6 mb-6 border-b border-slate-800">
        <div className="bg-blue-600 p-2 rounded-lg font-bold text-xl">DJKI</div>
        <div className="leading-tight">
          <h1 className="font-bold text-sm tracking-tight">Arsip Digital</h1>
          <p className="text-[10px] text-slate-400">Kekayaan Intelektual</p>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
            {activeTab === item.id && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
        <div className="flex items-center gap-3">
          <img src="https://picsum.photos/seed/admin/40" className="w-8 h-8 rounded-full border border-slate-600" alt="Admin" />
          <div className="overflow-hidden">
            <p className="text-xs font-semibold truncate">Admin DJKI Pusat</p>
            <p className="text-[10px] text-slate-400 truncate">admin@dgip.go.id</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
