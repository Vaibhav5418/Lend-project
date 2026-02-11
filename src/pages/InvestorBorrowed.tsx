import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Users, Eye } from 'lucide-react';
import { api } from '../api/client';
import type { InvestorInvestment, UpcomingPayout } from '../types';

function formatAmount(amount: number): string {
  if (amount >= 1_00_00_000) return `₹ ${(amount / 1_00_00_000).toFixed(1)} Cr`;
  if (amount >= 1_00_000) return `₹ ${(amount / 1_00_000).toFixed(1)} L`;
  if (amount >= 1_000) return `₹ ${(amount / 1_000).toFixed(1)} K`;
  return `₹ ${amount.toLocaleString('en-IN')}`;
}

function formatDate(d: string | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_COLUMNS: { key: string; label: string; color: string; dot: string; cardBorder: string }[] = [
  { key: 'Active', label: 'Active', color: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', cardBorder: 'border-l-emerald-500' },
  { key: 'Matured', label: 'Matured', color: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', cardBorder: 'border-l-amber-500' },
  { key: 'Closed', label: 'Closed', color: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400', cardBorder: 'border-l-slate-400' },
  { key: 'Withdrawn', label: 'Withdrawn', color: 'bg-red-50 border-red-200', dot: 'bg-red-400', cardBorder: 'border-l-red-400' },
];

export default function InvestorBorrowed() {
  const [investments, setInvestments] = useState<InvestorInvestment[]>([]);
  const [upcomingPayouts, setUpcomingPayouts] = useState<UpcomingPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInv, setSelectedInv] = useState<InvestorInvestment | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [invData, payouts] = await Promise.all([
        api.getInvestorInvestments(),
        api.getUpcomingPayouts(),
      ]);
      setInvestments(invData);
      setUpcomingPayouts(payouts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  const filtered = investments.filter((i) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return i.investorName.toLowerCase().includes(q) || i.id.toLowerCase().includes(q);
  });

  const totals = {
    invested: investments.filter(i => i.status === 'Active').reduce((s, i) => s + i.investedAmount, 0),
    monthlyInterest: investments.filter(i => i.status === 'Active').reduce((s, i) => s + i.monthlyInterest, 0),
    active: investments.filter(i => i.status === 'Active').length,
  };

  if (loading) return <div className="p-6 text-slate-500">Loading active investments...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Borrowed (Active Investments)</h1>
        <p className="text-slate-600 mt-1 text-sm">Investors whose funds are deployed</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-violet-600" />
            </div>
          </div>
          <p className="text-xs text-slate-500 uppercase font-medium">Total Active Invested</p>
          <p className="text-lg font-bold text-slate-900">{formatAmount(totals.invested)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs text-slate-500 uppercase font-medium">Monthly Interest Outflow</p>
          <p className="text-lg font-bold text-slate-900">{formatAmount(totals.monthlyInterest)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-sky-600" />
            </div>
          </div>
          <p className="text-xs text-slate-500 uppercase font-medium">Active Investors</p>
          <p className="text-lg font-bold text-slate-900">{totals.active}</p>
        </div>
      </div>

      {/* Upcoming Payouts Widget */}
      {upcomingPayouts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Upcoming Payouts (Next 30 Days)
          </h3>
          <div className="flex flex-wrap gap-3">
            {upcomingPayouts.slice(0, 5).map((p, i) => (
              <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm">
                <span className="font-medium text-amber-900">{p.investorName}</span>
                <span className="text-amber-700 ml-2">{formatAmount(p.payoutAmount)}</span>
                <span className="text-amber-600 ml-2 text-xs">{formatDate(p.nextPayoutDate)}</span>
                {p.isMaturity && <span className="ml-1 text-xs bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">Maturity</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3 sm:p-4">
        <input
          type="text"
          placeholder="Search investor name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-80 px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
        />
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {STATUS_COLUMNS.map((col) => {
          const items = filtered.filter((i) => i.status === col.key);
          const colTotal = items.reduce((s, i) => s + i.investedAmount, 0);
          return (
            <div key={col.key} className={`flex-shrink-0 w-[320px] rounded-xl border ${col.color} flex flex-col max-h-[70vh]`}>
              {/* Column Header */}
              <div className="px-4 py-3 border-b border-inherit">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                    <span className="text-sm font-semibold text-slate-800">{col.label}</span>
                    <span className="text-xs bg-white/80 text-slate-600 font-medium px-1.5 py-0.5 rounded-full border border-slate-200">{items.length}</span>
                  </div>
                  {colTotal > 0 && <span className="text-xs font-semibold text-slate-600">{formatAmount(colTotal)}</span>}
                </div>
              </div>
              {/* Column Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {items.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">No investments</p>
                )}
                {items.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInv(inv)}
                    className={`bg-white rounded-lg border border-l-4 ${col.cardBorder} shadow-sm hover:shadow-md transition-shadow cursor-pointer p-3`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{inv.investorName}</p>
                        <p className="text-xs text-violet-600 font-mono">{inv.id}</p>
                      </div>
                      <Eye className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    </div>
                    <p className="text-lg font-bold text-slate-900 mb-2">{formatAmount(inv.investedAmount)}</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      <div><span className="text-slate-400">Rate:</span> <span className="text-slate-700">{inv.interestRate}% ({inv.interestRateType})</span></div>
                      <div><span className="text-slate-400">Tenure:</span> <span className="text-slate-700">{inv.tenureMonths} mo</span></div>
                      <div><span className="text-slate-400">Monthly:</span> <span className="text-emerald-700 font-medium">{formatAmount(inv.monthlyInterest)}</span></div>
                      <div><span className="text-slate-400">Freq:</span> <span className="text-slate-700 capitalize">{inv.payoutFrequency?.replace('_', ' ')}</span></div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Maturity</span>
                      <span className="text-slate-700 font-medium">{formatDate(inv.maturityDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selectedInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Investment {selectedInv.id}</h3>
              <button onClick={() => setSelectedInv(null)} className="text-slate-400 hover:text-slate-700 text-xl">&times;</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div><span className="text-slate-500">Investor:</span> <span className="font-medium">{selectedInv.investorName}</span></div>
              <div><span className="text-slate-500">Amount:</span> <span className="font-semibold">{formatAmount(selectedInv.investedAmount)}</span></div>
              <div><span className="text-slate-500">Rate:</span> {selectedInv.interestRate}% ({selectedInv.interestRateType})</div>
              <div><span className="text-slate-500">Tenure:</span> {selectedInv.tenureMonths} months</div>
              <div><span className="text-slate-500">Monthly Interest:</span> <span className="text-emerald-700 font-medium">{formatAmount(selectedInv.monthlyInterest)}</span></div>
              <div><span className="text-slate-500">Total Interest:</span> {formatAmount(selectedInv.totalInterest)}</div>
              <div><span className="text-slate-500">Total Payout:</span> <span className="font-semibold">{formatAmount(selectedInv.totalPayout)}</span></div>
              <div><span className="text-slate-500">Payout Frequency:</span> <span className="capitalize">{selectedInv.payoutFrequency?.replace('_', ' ')}</span></div>
              <div><span className="text-slate-500">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedInv.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{selectedInv.status}</span></div>
              <div><span className="text-slate-500">Start Date:</span> {formatDate(selectedInv.startDate)}</div>
              <div><span className="text-slate-500">Maturity Date:</span> {formatDate(selectedInv.maturityDate)}</div>
              <div><span className="text-slate-500">Inquiry ID:</span> {selectedInv.inquiryId}</div>
            </div>

            {/* Payout Schedule */}
            {(() => {
              const schedule: { month: number; dueDate: Date; interest: number; principal: number; total: number; isMaturity: boolean }[] = [];
              const start = new Date(selectedInv.startDate);
              const freq = selectedInv.payoutFrequency || 'monthly';
              const intervalMonths = freq === 'quarterly' ? 3 : freq === 'on_maturity' ? selectedInv.tenureMonths : 1;
              const interestPerMonth = selectedInv.monthlyInterest;
              const steps = intervalMonths > 0 ? Math.ceil(selectedInv.tenureMonths / intervalMonths) : 0;

              for (let i = 1; i <= steps; i++) {
                const monthNum = i * intervalMonths;
                const dueDate = new Date(start);
                dueDate.setMonth(dueDate.getMonth() + monthNum);
                const isLast = i === steps;
                const interest = Math.round(interestPerMonth * intervalMonths * 100) / 100;
                const principal = isLast ? selectedInv.investedAmount : 0;
                schedule.push({
                  month: monthNum,
                  dueDate,
                  interest,
                  principal,
                  total: Math.round((interest + principal) * 100) / 100,
                  isMaturity: isLast,
                });
              }

              return schedule.length > 0 ? (
                <div className="mt-5">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Payout Schedule</h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs text-slate-500">#</th>
                          <th className="px-3 py-2 text-left text-xs text-slate-500">Due Date</th>
                          <th className="px-3 py-2 text-left text-xs text-slate-500">Interest</th>
                          <th className="px-3 py-2 text-left text-xs text-slate-500">Principal</th>
                          <th className="px-3 py-2 text-left text-xs text-slate-500">Total Payout</th>
                          <th className="px-3 py-2 text-left text-xs text-slate-500">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {schedule.map((entry, idx) => {
                          const now = new Date();
                          const isPast = entry.dueDate < now;
                          return (
                            <tr key={idx} className={`hover:bg-slate-50 ${entry.isMaturity ? 'bg-violet-50/50' : ''}`}>
                              <td className="px-3 py-2 text-slate-700">{idx + 1}</td>
                              <td className="px-3 py-2 text-slate-700">{formatDate(entry.dueDate.toISOString())}</td>
                              <td className="px-3 py-2 text-emerald-700 font-medium">{formatAmount(entry.interest)}</td>
                              <td className="px-3 py-2 text-slate-700">{entry.principal > 0 ? formatAmount(entry.principal) : '—'}</td>
                              <td className="px-3 py-2 font-semibold text-slate-900">{formatAmount(entry.total)}</td>
                              <td className="px-3 py-2">
                                {entry.isMaturity ? (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">Maturity</span>
                                ) : (
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isPast ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {isPast ? 'Due' : 'Upcoming'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-slate-200">
                        <tr>
                          <td className="px-3 py-2 text-xs font-semibold text-slate-600" colSpan={2}>Total</td>
                          <td className="px-3 py-2 text-xs font-semibold text-emerald-700">{formatAmount(selectedInv.totalInterest)}</td>
                          <td className="px-3 py-2 text-xs font-semibold text-slate-700">{formatAmount(selectedInv.investedAmount)}</td>
                          <td className="px-3 py-2 text-xs font-bold text-slate-900">{formatAmount(selectedInv.totalPayout)}</td>
                          <td className="px-3 py-2"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : null;
            })()}

            {selectedInv.linkedBorrowers.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Linked Borrowers</h4>
                <div className="space-y-1">
                  {selectedInv.linkedBorrowers.map((lb, i) => (
                    <div key={i} className="text-sm text-slate-600">Loan {lb.loanId} — {formatAmount(lb.allocatedAmount)}</div>
                  ))}
                </div>
              </div>
            )}
            {selectedInv.notes && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-1">Notes</h4>
                <p className="text-sm text-slate-600">{selectedInv.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
