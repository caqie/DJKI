import React from 'react';
import { 
  FileText, CheckCircle, Clock, AlertCircle 
} from 'lucide-react';
import { IntellectualPropertyDoc } from '../types';

interface StatsOverviewProps {
  docs: IntellectualPropertyDoc[];
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ docs }) => {
  const stats = [
    { 
      label: 'Total Arsip', 
      value: docs.length, 
      icon: FileText, 
      color: 'blue',
      bg: 'bg-blue-50',
      text: 'text-blue-600'
    },
    { 
      label: 'Arsip Aktif', 
      value: docs.filter(d => d.status === 'Aktif').length, 
      icon: CheckCircle, 
      color: 'emerald',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600'
    },
    { 
      label: 'Inaktif', 
      value: docs.filter(d => d.status === 'Inaktif').length, 
      icon: Clock, 
      color: 'amber',
      bg: 'bg-amber-50',
      text: 'text-amber-600'
    },
    { 
      label: 'Belum di-Box', 
      value: docs.filter(d => !d.boxNumber).length, 
      icon: AlertCircle, 
      color: 'rose',
      bg: 'bg-rose-50',
      text: 'text-rose-600'
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-5">
          <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.text} flex items-center justify-center`}>
            <stat.icon className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-slate-800">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsOverview;
