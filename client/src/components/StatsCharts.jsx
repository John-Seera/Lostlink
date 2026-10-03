import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

export default function StatsCharts({ stats, items = [] }) {
  // Category distribution calculation from items
  const categoryCounts = {};
  items.forEach((item) => {
    const cat = item.category || 'Other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categoryData = Object.keys(categoryCounts).map((cat) => ({
    name: cat,
    count: categoryCounts[cat]
  }));

  // Lost vs Found Pie Data
  const typeData = [
    { name: 'Lost Items', value: stats?.totalLost || items.filter(i => i.type === 'lost').length || 1, color: '#f43f5e' },
    { name: 'Found Items', value: stats?.totalFound || items.filter(i => i.type === 'found').length || 1, color: '#10b981' }
  ];

  // Claim Status Data
  const claimData = [
    { name: 'Pending Review', value: stats?.pendingClaims || 1, color: '#f59e0b' },
    { name: 'Approved & Returned', value: stats?.approvedClaims || 1, color: '#3b82f6' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
      {/* Chart 1: Lost vs Found Distribution */}
      <div className="p-6 rounded-3xl glass-panel">
        <h4 className="text-base font-bold text-white mb-1">Lost vs Found Ratio</h4>
        <p className="text-xs text-slate-400 mb-4">Real-time balance of campus reports</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={5}
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Category Distribution */}
      <div className="p-6 rounded-3xl glass-panel">
        <h4 className="text-base font-bold text-white mb-1">Items by Category</h4>
        <p className="text-xs text-slate-400 mb-4">Volume breakdown across major object classes</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData.length > 0 ? categoryData : [{ name: 'Accessories', count: 3 }, { name: 'Electronics', count: 2 }, { name: 'Bags', count: 1 }]}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
