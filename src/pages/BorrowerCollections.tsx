import { useState, useEffect } from 'react';
import { Filter, Plus, Receipt, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import type { BorrowerCollection, BorrowerLoan, PaymentMode, CollectionStatus } from '../types';

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

const PAYMENT_MODES: PaymentMode[] = ['Bank Transfer', 'Cheque', 'Cash', 'UPI', 'NEFT', 'RTGS', 'Other'];

export default function BorrowerCollections() {
  const [collections, setCollections] = useState<BorrowerCollection[]>([]);
  const [loans, setLoans] = useState<BorrowerLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    loanId: '',
    borrowerName: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    scheduleMonth: '',
    interestPaid: '',
    principalPaid: '',
    pendingAmount: '',
    penalty: '',
    paymentMode: 'Bank Transfer' as PaymentMode,
    status: 'Received' as CollectionStatus,
    remarks: '',
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [colData, loanData] = await Promise.all([
        api.getBorrowerCollections(),
        api.getBorrowerLoans(),
      ]);
      setCollections(colData);
      setLoans(loanData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  const handleLoanSelect = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    setForm({
      ...form,
      loanId,
      borrowerName: loan?.borrowerName || '',
      interestPaid: String(loan?.monthlyInterest || ''),
    });
  };

  const handleSubmit = async () => {
    if (!form.loanId) return;
    setSubmitting(true);
    try {
      await api.createBorrowerCollection({
        loanId: form.loanId,
        borrowerName: form.borrowerName,
        paymentDate: form.paymentDate,
        dueDate: form.dueDate || undefined,
        scheduleMonth: Number(form.scheduleMonth) || undefined,
        interestPaid: Number(form.interestPaid) || 0,
        principalPaid: Number(form.principalPaid) || 0,
        pendingAmount: Number(form.pendingAmount) || 0,
        penalty: Number(form.penalty) || 0,
        paymentMode: form.paymentMode,
        status: form.status,
        remarks: form.remarks,
      });
      await loadData();
      setShowForm(false);
      setForm({
        loanId: '', borrowerName: '',
        paymentDate: new Date().toISOString().slice(0, 10), dueDate: '', scheduleMonth: '',
        interestPaid: '', principalPaid: '', pendingAmount: '', penalty: '',
        paymentMode: 'Bank Transfer', status: 'Received', remarks: '',
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to record collection');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = collections
    .filter((c) => statusFilter === 'All' || c.status === statusFilter)
    .filter((c) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return c.borrowerName.toLowerCase().includes(q) || c.loanId.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
    });

  const totalCollected = collections.filter(c => c.status === 'Received').reduce((s, c) => s + c.totalPaid, 0);
  const totalPending = collections.filter(c => c.status === 'Pending' || c.status === 'Overdue').reduce((s, c) => s + c.pendingAmount, 0);
  const overdueCount = collections.filter(c => c.status === 'Overdue' || c.status === 'Defaulted').length;
  const totalPenalties = collections.reduce((s, c) => s + (c.penalty || 0), 0);

  if (loading) return <div className="p-6 text-slate-500">Loading collections...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Collections</h1>
          <p className="text-slate-600 mt-1 text-sm">Track repayments from borrowers</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium flex items-center gap-2 justify-center">
          <Plus className="w-4 h-4" />Record Collection
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase font-medium">Total Collected</p>
          <p className="text-lg font-bold text-emerald-700">{formatAmount(totalCollected)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase font-medium">Pending</p>
          <p className="text-lg font-bold text-amber-700">{formatAmount(totalPending)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase font-medium">Overdue / Defaulted</p>
          <p className="text-lg font-bold text-red-700">{overdueCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase font-medium">Penalties</p>
          <p className="text-lg font-bold text-orange-700">{formatAmount(totalPenalties)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Filters:</span>
          </div>
          <input type="text" placeholder="Search borrower, loan ID..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-auto min-w-0 px-3 py-1.5 border border-slate-300 rounded-lg text-sm" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm">
            <option value="All">All Status</option>
            <option value="Received">Received</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
            <option value="Partial">Partial</option>
            <option value="Defaulted">Defaulted</option>
          </select>
        </div>
      </div>

      {/* Collections Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden -mx-4 sm:mx-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Loan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Borrower</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Interest</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Principal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Overdue</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Penalty</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mode</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-sky-600">{c.id}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{c.loanId}</td>
                  <td className="px-4 py-3 text-sm text-slate-900">{c.borrowerName}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{formatDate(c.paymentDate)}</td>
                  <td className="px-4 py-3 text-sm text-emerald-700">{formatAmount(c.interestPaid)}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{formatAmount(c.principalPaid)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{formatAmount(c.totalPaid)}</td>
                  <td className="px-4 py-3 text-sm">
                    {c.overdueDays > 0 ? (
                      <span className="text-red-600 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />{c.overdueDays}d
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-orange-700">{c.penalty > 0 ? formatAmount(c.penalty) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{c.paymentMode}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      c.status === 'Received' ? 'bg-emerald-100 text-emerald-700' :
                      c.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                      c.status === 'Defaulted' ? 'bg-red-200 text-red-800' :
                      c.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>{c.status}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={11} className="px-4 py-12 text-center text-slate-500">No collections found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Collection Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5" />Record Collection
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Loan</label>
                <select value={form.loanId} onChange={(e) => handleLoanSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option value="">Select loan...</option>
                  {loans.filter(l => l.status === 'Active').map(l => (
                    <option key={l.id} value={l.id}>{l.id} — {l.borrowerName} ({formatAmount(l.approvedAmount)})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
                  <input type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Schedule Month</label>
                  <input type="number" value={form.scheduleMonth} onChange={(e) => setForm({ ...form, scheduleMonth: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="e.g. 3" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Interest Paid (₹)</label>
                  <input type="number" value={form.interestPaid} onChange={(e) => setForm({ ...form, interestPaid: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Principal Paid (₹)</label>
                  <input type="number" value={form.principalPaid} onChange={(e) => setForm({ ...form, principalPaid: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Penalty (₹)</label>
                  <input type="number" value={form.penalty} onChange={(e) => setForm({ ...form, penalty: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode</label>
                  <select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value as PaymentMode })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                    {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CollectionStatus })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                    <option value="Received">Received</option>
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pending Amount (₹)</label>
                  <input type="number" value={form.pendingAmount} onChange={(e) => setForm({ ...form, pendingAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm font-medium">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting || !form.loanId}
                className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 text-sm font-medium disabled:opacity-50">
                {submitting ? 'Recording...' : 'Record Collection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
