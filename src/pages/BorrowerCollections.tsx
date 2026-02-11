import { useState, useEffect } from 'react';
import { Plus, Receipt, AlertTriangle } from 'lucide-react';
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

const STATUS_COLUMNS: { key: string; label: string; color: string; dot: string; cardBorder: string }[] = [
  { key: 'Received', label: 'Received', color: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', cardBorder: 'border-l-emerald-500' },
  { key: 'Pending', label: 'Pending', color: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', cardBorder: 'border-l-amber-500' },
  { key: 'Overdue', label: 'Overdue', color: 'bg-red-50 border-red-200', dot: 'bg-red-500', cardBorder: 'border-l-red-500' },
  { key: 'Partial', label: 'Partial', color: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500', cardBorder: 'border-l-blue-500' },
  { key: 'Defaulted', label: 'Defaulted', color: 'bg-rose-50 border-rose-300', dot: 'bg-rose-600', cardBorder: 'border-l-rose-600' },
];

export default function BorrowerCollections() {
  const [collections, setCollections] = useState<BorrowerCollection[]>([]);
  const [loans, setLoans] = useState<BorrowerLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const filtered = collections.filter((c) => {
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

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3 sm:p-4">
        <input
          type="text"
          placeholder="Search borrower, loan ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-80 px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
        />
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {STATUS_COLUMNS.map((col) => {
          const items = filtered.filter((c) => c.status === col.key);
          const colTotal = items.reduce((s, c) => s + c.totalPaid, 0);
          return (
            <div key={col.key} className={`flex-shrink-0 w-[300px] rounded-xl border ${col.color} flex flex-col max-h-[70vh]`}>
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
                  <p className="text-xs text-slate-400 text-center py-6">No collections</p>
                )}
                {items.map((c) => (
                  <div
                    key={c.id}
                    className={`bg-white rounded-lg border border-l-4 ${col.cardBorder} shadow-sm p-3`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{c.borrowerName}</p>
                        <p className="text-xs text-slate-500">{c.id} &middot; {c.loanId}</p>
                      </div>
                      {c.overdueDays > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-red-600 font-medium flex-shrink-0">
                          <AlertTriangle className="w-3 h-3" />{c.overdueDays}d
                        </span>
                      )}
                    </div>
                    <p className="text-base font-bold text-slate-900 mb-2">{formatAmount(c.totalPaid)}</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      <div><span className="text-slate-400">Interest:</span> <span className="text-emerald-700 font-medium">{formatAmount(c.interestPaid)}</span></div>
                      <div><span className="text-slate-400">Principal:</span> <span className="text-slate-700">{formatAmount(c.principalPaid)}</span></div>
                      <div><span className="text-slate-400">Mode:</span> <span className="text-slate-700">{c.paymentMode}</span></div>
                      <div><span className="text-slate-400">Date:</span> <span className="text-slate-700">{formatDate(c.paymentDate)}</span></div>
                    </div>
                    {c.penalty > 0 && (
                      <div className="mt-1.5 text-xs">
                        <span className="text-orange-600 font-medium">Penalty: {formatAmount(c.penalty)}</span>
                      </div>
                    )}
                    {c.remarks && (
                      <p className="mt-1.5 text-xs text-slate-500 italic truncate">{c.remarks}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
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
