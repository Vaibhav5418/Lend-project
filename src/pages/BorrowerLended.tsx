import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Users, AlertTriangle, Eye } from 'lucide-react';
import { api } from '../api/client';
import type { BorrowerLoan, UpcomingDue } from '../types';

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
  { key: 'Closed', label: 'Closed', color: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400', cardBorder: 'border-l-slate-400' },
  { key: 'Defaulted', label: 'Defaulted', color: 'bg-red-50 border-red-200', dot: 'bg-red-500', cardBorder: 'border-l-red-500' },
  { key: 'Restructured', label: 'Restructured', color: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', cardBorder: 'border-l-amber-500' },
];

export default function BorrowerLended() {
  const [loans, setLoans] = useState<BorrowerLoan[]>([]);
  const [upcomingDues, setUpcomingDues] = useState<UpcomingDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<BorrowerLoan | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [loanData, dues] = await Promise.all([
        api.getBorrowerLoans(),
        api.getUpcomingDues(),
      ]);
      setLoans(loanData);
      setUpcomingDues(dues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  const filtered = loans.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return l.borrowerName.toLowerCase().includes(q) || l.id.toLowerCase().includes(q) || l.companyName?.toLowerCase().includes(q);
  });

  const totals = {
    deployed: loans.filter(l => l.status === 'Active').reduce((s, l) => s + l.approvedAmount, 0),
    monthlyIncome: loans.filter(l => l.status === 'Active').reduce((s, l) => s + l.monthlyInterest, 0),
    active: loans.filter(l => l.status === 'Active').length,
    defaulted: loans.filter(l => l.status === 'Defaulted').length,
  };

  const overdueDues = upcomingDues.filter(d => d.isOverdue);

  if (loading) return <div className="p-6 text-slate-500">Loading loans...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Lended (Active Loans)</h1>
        <p className="text-slate-600 mt-1 text-sm">Active borrower loans with repayment tracking</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-sky-600" />
            </div>
          </div>
          <p className="text-xs text-slate-500 uppercase font-medium">Total Deployed</p>
          <p className="text-lg font-bold text-slate-900">{formatAmount(totals.deployed)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs text-slate-500 uppercase font-medium">Monthly Interest Income</p>
          <p className="text-lg font-bold text-slate-900">{formatAmount(totals.monthlyIncome)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-slate-500 uppercase font-medium">Active Loans</p>
          <p className="text-lg font-bold text-slate-900">{totals.active}</p>
        </div>
        {totals.defaulted > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-red-500 uppercase font-medium">Defaulted</p>
            <p className="text-lg font-bold text-red-700">{totals.defaulted}</p>
          </div>
        )}
      </div>

      {/* Upcoming Dues Widget */}
      {upcomingDues.length > 0 && (
        <div className={`bg-white rounded-xl shadow-sm border p-4 ${overdueDues.length > 0 ? 'border-red-200' : 'border-amber-200'}`}>
          <h3 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${overdueDues.length > 0 ? 'text-red-800' : 'text-amber-800'}`}>
            <Calendar className="w-4 h-4" />
            Upcoming EMI / Interest Dues (Next 30 Days)
            {overdueDues.length > 0 && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{overdueDues.length} Overdue</span>}
          </h3>
          <div className="flex flex-wrap gap-3">
            {upcomingDues.slice(0, 6).map((d, i) => (
              <div key={i} className={`border rounded-lg px-3 py-2 text-sm ${d.isOverdue ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                <span className={`font-medium ${d.isOverdue ? 'text-red-900' : 'text-amber-900'}`}>{d.borrowerName}</span>
                <span className={`ml-2 ${d.isOverdue ? 'text-red-700' : 'text-amber-700'}`}>{formatAmount(d.totalDue)}</span>
                <span className={`ml-2 text-xs ${d.isOverdue ? 'text-red-600' : 'text-amber-600'}`}>{formatDate(d.dueDate)}</span>
                {d.isOverdue && <span className="ml-1 text-xs bg-red-200 text-red-800 px-1.5 py-0.5 rounded">Overdue</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3 sm:p-4">
        <input
          type="text"
          placeholder="Search borrower, loan ID, company..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-80 px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
        />
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {STATUS_COLUMNS.map((col) => {
          const items = filtered.filter((l) => l.status === col.key);
          const colTotal = items.reduce((s, l) => s + l.approvedAmount, 0);
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
                  <p className="text-xs text-slate-400 text-center py-6">No loans</p>
                )}
                {items.map((loan) => (
                  <div
                    key={loan.id}
                    onClick={() => setSelectedLoan(loan)}
                    className={`bg-white rounded-lg border border-l-4 ${col.cardBorder} shadow-sm hover:shadow-md transition-shadow cursor-pointer p-3`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{loan.borrowerName}</p>
                        {loan.companyName && <p className="text-xs text-slate-500 truncate">{loan.companyName}</p>}
                        <p className="text-xs text-sky-600 font-mono">{loan.id}</p>
                      </div>
                      <Eye className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    </div>
                    <p className="text-lg font-bold text-slate-900 mb-2">{formatAmount(loan.approvedAmount)}</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      <div><span className="text-slate-400">Rate:</span> <span className="text-slate-700">{loan.interestRate}% ({loan.interestRateType})</span></div>
                      <div><span className="text-slate-400">Tenure:</span> <span className="text-slate-700">{loan.tenureMonths} mo</span></div>
                      <div><span className="text-slate-400">Type:</span> <span className="text-slate-700">{loan.repaymentType}</span></div>
                      <div><span className="text-slate-400">Monthly:</span> <span className="text-emerald-700 font-medium">{formatAmount(loan.monthlyInterest)}</span></div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400">End Date</span>
                      <span className="text-slate-700 font-medium">{formatDate(loan.endDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal with Repayment Schedule */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Loan {selectedLoan.id}</h3>
              <button onClick={() => setSelectedLoan(null)} className="text-slate-400 hover:text-slate-700 text-xl">&times;</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-6">
              <div><span className="text-slate-500">Borrower:</span> <span className="font-medium">{selectedLoan.borrowerName}</span></div>
              {selectedLoan.companyName && <div><span className="text-slate-500">Company:</span> {selectedLoan.companyName}</div>}
              <div><span className="text-slate-500">Amount:</span> <span className="font-semibold">{formatAmount(selectedLoan.approvedAmount)}</span></div>
              <div><span className="text-slate-500">Rate:</span> {selectedLoan.interestRate}% ({selectedLoan.interestRateType})</div>
              <div><span className="text-slate-500">Tenure:</span> {selectedLoan.tenureMonths} months</div>
              <div><span className="text-slate-500">Type:</span> {selectedLoan.repaymentType}</div>
              {selectedLoan.emiAmount > 0 && <div><span className="text-slate-500">EMI:</span> {formatAmount(selectedLoan.emiAmount)}</div>}
              <div><span className="text-slate-500">Monthly Int:</span> <span className="text-emerald-700">{formatAmount(selectedLoan.monthlyInterest)}</span></div>
              <div><span className="text-slate-500">Total Interest:</span> {formatAmount(selectedLoan.totalInterest)}</div>
              <div><span className="text-slate-500">Total Repayable:</span> <span className="font-semibold">{formatAmount(selectedLoan.totalRepayable)}</span></div>
              <div><span className="text-slate-500">Start:</span> {formatDate(selectedLoan.startDate)}</div>
              <div><span className="text-slate-500">End:</span> {formatDate(selectedLoan.endDate)}</div>
              {selectedLoan.loanPurpose && <div className="col-span-2"><span className="text-slate-500">Purpose:</span> {selectedLoan.loanPurpose}</div>}
            </div>

            {/* Repayment Schedule */}
            {selectedLoan.repaymentSchedule.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Repayment Schedule</h4>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs text-slate-500">Month</th>
                        <th className="px-3 py-2 text-left text-xs text-slate-500">Due Date</th>
                        <th className="px-3 py-2 text-left text-xs text-slate-500">Interest</th>
                        <th className="px-3 py-2 text-left text-xs text-slate-500">Principal</th>
                        <th className="px-3 py-2 text-left text-xs text-slate-500">Total</th>
                        <th className="px-3 py-2 text-left text-xs text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedLoan.repaymentSchedule.map((entry) => (
                        <tr key={entry.month} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-700">{entry.month}</td>
                          <td className="px-3 py-2 text-slate-700">{formatDate(entry.dueDate)}</td>
                          <td className="px-3 py-2 text-slate-700">{formatAmount(entry.interestDue)}</td>
                          <td className="px-3 py-2 text-slate-700">{formatAmount(entry.principalDue)}</td>
                          <td className="px-3 py-2 font-medium text-slate-900">{formatAmount(entry.totalDue)}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              entry.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                              entry.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>{entry.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedLoan.investorMapping.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Investor Mapping</h4>
                <div className="space-y-1">
                  {selectedLoan.investorMapping.map((m, i) => (
                    <div key={i} className="text-sm text-slate-600">Investment {m.investmentId} — {formatAmount(m.allocatedAmount)}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
