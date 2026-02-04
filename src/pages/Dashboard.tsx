import { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Clock, ArrowUp, ArrowDown, BarChart3, PieChart } from 'lucide-react';
import { api } from '../api/client';
import type { Inquiry } from '../types';

export default function Dashboard() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getInquiries().then(setInquiries).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const borrowers = inquiries.filter((i) => i.type === 'Borrower');
  const investors = inquiries.filter((i) => i.type === 'Investor');
  const todayFollowUps = inquiries.filter((inq) => inq.nextFollowUp);

  const stats = [
    { label: 'Total Inquiries', value: String(inquiries.length), change: '', trend: 'up' as const, icon: TrendingUp, color: 'blue' },
    { label: 'Active Borrowers', value: String(borrowers.length), change: '', trend: 'up' as const, icon: Users, color: 'green' },
    { label: 'Active Investors', value: String(investors.length), change: '', trend: 'up' as const, icon: DollarSign, color: 'purple' },
    { label: 'Pending Follow-ups', value: String(todayFollowUps.length), change: '', trend: 'down' as const, icon: Clock, color: 'orange' },
  ];

  if (loading) return <div className="p-6 text-gray-500">Loading dashboard...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">Welcome back! Here's your overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isUp = stat.trend === 'up';

          return (
            <div key={stat.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                {stat.change && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                    {isUp ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    <span>{stat.change}</span>
                  </div>
                )}
              </div>
              <p className="text-gray-600 text-xs sm:text-sm mb-1">{stat.label}</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inquiry Trend (Last 30 Days)</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-2" />
              <p>Chart visualization would go here</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Distribution</h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <PieChart className="w-16 h-16 mx-auto mb-2" />
              <p>Chart visualization would go here</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Follow-ups */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Today's Follow-ups</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {todayFollowUps.length === 0 ? (
            <div className="p-4 sm:p-6 text-gray-500 text-center text-sm sm:text-base">No follow-ups scheduled</div>
          ) : (
          todayFollowUps.map((inquiry) => (
            <div key={inquiry.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h4 className="font-semibold text-gray-900 truncate">{inquiry.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${
                      inquiry.type === 'Borrower' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {inquiry.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${
                      inquiry.priority === 'Hot' ? 'bg-red-100 text-red-700' :
                      inquiry.priority === 'Warm' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {inquiry.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{inquiry.mobile}</p>
                  {inquiry.notes && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{inquiry.notes}</p>}
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-sm font-medium text-gray-900">{inquiry.nextFollowUp}</p>
                  <p className="text-sm text-gray-500 mt-1">Assigned to {inquiry.assignedTo}</p>
                </div>
              </div>
            </div>
          )))}
        </div>
      </div>
    </div>
  );
}
