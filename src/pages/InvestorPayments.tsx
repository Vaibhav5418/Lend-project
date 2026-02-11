import { useState, useEffect } from 'react';
import { Plus, CreditCard } from 'lucide-react';
import { api } from '../api/client';
import type { InvestorPayment, InvestorInvestment, PaymentMode, PayoutFrequency } from '../types';

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
  { key: 'Paid', label: 'Paid', color: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', cardBorder: 'border-l-emerald-500' },
  { key: 'Pending', label: 'Pending', color: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', cardBorder: 'border-l-amber-500' },
  { key: 'Overdue', label: 'Overdue', color: 'bg-red-50 border-red-200', dot: 'bg-red-500', cardBorder: 'border-l-red-500' },
  { key: 'Partial', label: 'Partial', color: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500', cardBorder: 'border-l-blue-500' },
];

export default function InvestorPayments() {
  const [payments, setPayments] = useState<InvestorPayment[]>([]);
  const [investments, setInvestments] = useState<InvestorInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    investmentId: '',
    investorName: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    interestPaid: '',
    principalPaid: '',
    pendingInterest: '',
    paymentFrequency: 'monthly' as PayoutFrequency,
    paymentMode: 'Bank Transfer' as PaymentMode,
    status: 'Paid' as string,
    remarks: '',
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [payData, invData] = await Promise.all([
        api.getInvestorPayments(),
        api.getInvestorInvestments(),
      ]);
      setPayments(payData);
      setInvestments(invData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  const handleInvestmentSelect = (invId: string) => {
    const inv = investments.find(i => i.id === invId);
    setForm({
      ...form,
      investmentId: invId,
      investorName: inv?.investorName || '',
      interestPaid: String(inv?.monthlyInterest || ''),
    });
  };

  const handleSubmit = async () => {
    if (!form.investmentId) return;
    setSubmitting(true);
    try {
      await api.createInvestorPayment({
        investmentId: form.investmentId,
        investorName: form.investorName,
        paymentDate: form.paymentDate,
        dueDate: form.dueDate || undefined,
        amountPaid: (Number(form.interestPaid) || 0) + (Number(form.principalPaid) || 0),
        interestPaid: Number(form.interestPaid) || 0,
        principalPaid: Number(form.principalPaid) || 0,
        pendingInterest: Number(form.pendingInterest) || 0,
        paymentFrequency: form.paymentFrequency,
        paymentMode: form.paymentMode,
        status: form.status as InvestorPayment['status'],
        remarks: form.remarks,
      });
      await loadData();
      setShowForm(false);
      setForm({
        investmentId: '', investorName: '',
        paymentDate: new Date().toISOString().slice(0, 10), dueDate: '',
        interestPaid: '', principalPaid: '', pendingInterest: '',
        paymentFrequency: 'monthly', paymentMode: 'Bank Transfer', status: 'Paid', remarks: '',
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = payments.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.investorName.toLowerCase().includes(q) || p.investmentId.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
  });

  const totalPaid = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amountPaid, 0);
  const totalPending = payments.filter(p => p.status === 'Pending' || p.status === 'Overdue').reduce((s, p) => s + p.pendingInterest, 0);

  if (loading) return <div className="p-6 text-slate-500">Loading investor payments...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Investor Payments</h1>
          <p className="text-slate-600 mt-1 text-sm">Track payouts to investors</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium flex items-center gap-2 justify-center"
        >
          <Plus className="w-4 h-4" />Record Payment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase font-medium">Total Paid Out</p>
          <p className="text-lg font-bold text-emerald-700">{formatAmount(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase font-medium">Pending Interest</p>
          <p className="text-lg font-bold text-amber-700">{formatAmount(totalPending)}</p>
        </div>
      </div>

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
          const items = filtered.filter((p) => p.status === col.key);
          const colTotal = items.reduce((s, p) => s + p.amountPaid, 0);
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
                  <p className="text-xs text-slate-400 text-center py-6">No payments</p>
                )}
                {items.map((p) => (
                  <div
                    key={p.id}
                    className={`bg-white rounded-lg border border-l-4 ${col.cardBorder} shadow-sm p-3`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{p.investorName}</p>
                        <p className="text-xs text-slate-500">{p.id} &middot; {p.investmentId}</p>
                      </div>
                    </div>
                    <p className="text-base font-bold text-slate-900 mb-2">{formatAmount(p.amountPaid)}</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      <div><span className="text-slate-400">Interest:</span> <span className="text-emerald-700 font-medium">{formatAmount(p.interestPaid)}</span></div>
                      <div><span className="text-slate-400">Principal:</span> <span className="text-slate-700">{formatAmount(p.principalPaid)}</span></div>
                      <div><span className="text-slate-400">Mode:</span> <span className="text-slate-700">{p.paymentMode}</span></div>
                      <div><span className="text-slate-400">Date:</span> <span className="text-slate-700">{formatDate(p.paymentDate)}</span></div>
                    </div>
                    {p.remarks && (
                      <p className="mt-2 text-xs text-slate-500 italic truncate">{p.remarks}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Record Payment Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />Record Investor Payment
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Investment</label>
                <select
                  value={form.investmentId}
                  onChange={(e) => handleInvestmentSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">Select investment...</option>
                  {investments.filter(i => i.status === 'Active').map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.id} — {inv.investorName} ({formatAmount(inv.investedAmount)})
                    </option>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Interest Paid (₹)</label>
                  <input type="number" value={form.interestPaid} onChange={(e) => setForm({ ...form, interestPaid: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Principal Paid (₹)</label>
                  <input type="number" value={form.principalPaid} onChange={(e) => setForm({ ...form, principalPaid: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="0 (on maturity)" />
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
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm font-medium">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting || !form.investmentId}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium disabled:opacity-50">
                {submitting ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
