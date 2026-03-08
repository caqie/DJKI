
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { IntellectualPropertyDoc } from '../types';

interface StatsOverviewProps {
  docs: IntellectualPropertyDoc[];
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ docs }) => {
  const categoryData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    docs.forEach(d => counts[d.category] = (counts[d.category] || 0) + 1);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [docs]);

  const statusData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    docs.forEach(d => counts[d.status] = (counts[d.status] || 0) + 1);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [docs]);

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#64748B'];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <span>📊</span> Distribusi Kategori Berkas
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip 
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <span>📉</span> Status Permohonan
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {statusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }}></div>
                <span className="text-xs text-slate-600 font-medium">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
