
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { IntellectualPropertyDoc } from '../types';

interface StatsOverviewProps {
  docs: IntellectualPropertyDoc[];
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ docs }) => {
  const categoryData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    docs.forEach(d => counts[d.archiveType] = (counts[d.archiveType] || 0) + 1);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [docs]);

  const statusData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    docs.forEach(d => counts[d.securityClassification] = (counts[d.securityClassification] || 0) + 1);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [docs]);

  const unitData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    docs.forEach(d => {
      const unit = d.processingUnit || 'Tidak Diketahui';
      counts[unit] = (counts[unit] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [docs]);

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#64748B', '#EC4899', '#06B6D4'];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 blur-3xl rounded-full -mr-20 -mt-20"></div>
          <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-slate-900 tracking-tight relative z-10">
            <span className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg shadow-sm">🏢</span> 
            Distribusi Unit Pengolah
          </h3>
          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} width={140} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 16px'}}
                  itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
                  labelStyle={{fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px'}}
                />
                <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={24}>
                  {unitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 blur-3xl rounded-full -mr-20 -mt-20"></div>
          <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-slate-900 tracking-tight relative z-10">
            <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg shadow-sm">📊</span> 
            Distribusi Jenis Arsip
          </h3>
          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 16px'}}
                  itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
                  labelStyle={{fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '4px'}}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={40}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 xl:col-span-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 blur-3xl rounded-full -mr-20 -mt-20"></div>
          <h3 className="text-xl font-black mb-8 flex items-center gap-3 text-slate-900 tracking-tight relative z-10">
            <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg shadow-sm">📉</span> 
            Klasifikasi Keamanan
          </h3>
          <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 16px'}}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-4">
              {statusData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }}></div>
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#0f172a] p-8 rounded-[2.5rem] shadow-2xl xl:col-span-2 flex flex-col justify-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -ml-32 -mb-32"></div>
           
           <div className="relative z-10 text-center md:text-left">
              <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Ringkasan Vault Digital</h3>
              <p className="text-slate-400 text-lg mb-8 max-w-xl">Sistem saat ini mengelola <span className="text-white font-bold">{docs.length} berkas aktif</span> dengan tingkat keamanan terenkripsi tinggi.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 {[
                   { label: 'Uptime Sistem', value: '99.9%', color: 'text-emerald-400' },
                   { label: 'Enkripsi', value: 'AES-256', color: 'text-blue-400' },
                   { label: 'Audit Log', value: 'Aktif', color: 'text-amber-400' },
                   { label: 'Backup', value: 'Harian', color: 'text-purple-400' },
                 ].map((item, idx) => (
                   <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{item.label}</p>
                      <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
