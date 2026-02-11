import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Eye, Phone, Mail, CheckCircle, FileEdit, Pencil } from 'lucide-react';
import { useInquiryCache } from '../context/InquiryCacheContext';
import { api } from '../api/client';
import { STAGE_LABELS } from '../types';
import type { Inquiry } from '../types';
import ProposalModal from '../components/ProposalModal';

function formatAmount(amount: number): string {
  if (amount >= 1_00_00_000) return `₹ ${(amount / 1_00_00_000).toFixed(1)} Cr`;
  if (amount >= 1_00_000) return `₹ ${(amount / 1_00_000).toFixed(1)} L`;
  if (amount >= 1_000) return `₹ ${(amount / 1_000).toFixed(1)} K`;
  return `₹ ${amount.toLocaleString('en-IN')}`;
}

export default function BorrowerInquiries() {
  const navigate = useNavigate();
  const { inquiries, loading, error, refetch } = useInquiryCache();
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [proposalInquiry, setProposalInquiry] = useState<Inquiry | null>(null);
  const [showLendModal, setShowLendModal] = useState<Inquiry | null>(null);
  const [accepting, setAccepting] = useState(false);

  const [lendForm, setLendForm] = useState({
    approvedAmount: '',
    interestRate: '',
    interestRateType: 'yearly' as 'monthly' | 'yearly',
    tenureMonths: '',
    repaymentType: 'Interest-Only' as 'EMI' | 'Interest-Only' | 'Bullet',
    startDate: new Date().toISOString().slice(0, 10),
    loanPurpose: '',
    notes: '',
  });

  const borrowerInquiries = inquiries
    .filter((i) => i.type === 'Borrower')
    .filter((i) => stageFilter === 'All' || i.stage === stageFilter)
    .filter((i) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return i.name.toLowerCase().includes(q) || i.mobile.includes(q) || i.email.toLowerCase().includes(q);
    });

  const handleApproveAndLend = async () => {
    if (!showLendModal) return;
    setAccepting(true);
    try {
      await api.createBorrowerLoan({
        inquiryId: showLendModal.id,
        borrowerName: showLendModal.name,
        mobile: showLendModal.mobile,
        email: showLendModal.email,
        approvedAmount: Number(lendForm.approvedAmount) || showLendModal.borrowerDetails?.loanAmount || 0,
        interestRate: Number(lendForm.interestRate) || showLendModal.borrowerDetails?.proposedInterest || 0,
        interestRateType: lendForm.interestRateType,
        tenureMonths: Number(lendForm.tenureMonths) || showLendModal.borrowerDetails?.tenure || 0,
        repaymentType: lendForm.repaymentType,
        startDate: lendForm.startDate,
        loanPurpose: lendForm.loanPurpose,
        notes: lendForm.notes,
      });
      await refetch();
      setShowLendModal(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create loan');
    } finally {
      setAccepting(false);
    }
  };

  const openLendModal = (inq: Inquiry) => {
    setLendForm({
      approvedAmount: String(inq.borrowerDetails?.loanAmount || ''),
      interestRate: String(inq.borrowerDetails?.proposedInterest || ''),
      interestRateType: 'yearly',
      tenureMonths: String(inq.borrowerDetails?.tenure || ''),
      repaymentType: 'Interest-Only',
      startDate: new Date().toISOString().slice(0, 10),
      loanPurpose: '',
      notes: '',
    });
    setShowLendModal(inq);
  };

  if (loading) return <div className="p-6 text-slate-500">Loading borrower inquiries...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Borrower Inquiries</h1>
        <p className="text-slate-600 mt-1 text-sm">Manage loan demands, proposals, and approvals</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Filters:</span>
          </div>
          <input
            type="text"
            placeholder="Search name, mobile, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-auto min-w-0 px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
          />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
          >
            <option value="All">All Stages</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="DOCS_PENDING">Docs Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="APPROVED">Approved</option>
            <option value="DISBURSED">Disbursed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden -mx-4 sm:mx-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Borrower</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Loan Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Interest</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tenure</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {borrowerInquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-sky-50/40 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-sky-600">{inq.id}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">{inq.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" />{inq.mobile}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" />{inq.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                    {inq.borrowerDetails?.loanAmount ? formatAmount(inq.borrowerDetails.loanAmount) : '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                    {inq.borrowerDetails?.proposedInterest ? `${inq.borrowerDetails.proposedInterest}%` : '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                    {inq.borrowerDetails?.tenure ? `${inq.borrowerDetails.tenure} mo` : '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
                      {STAGE_LABELS[inq.stage] ?? inq.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      inq.priority === 'Hot' ? 'bg-red-100 text-red-700' :
                      inq.priority === 'Warm' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                    }`}>{inq.priority}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/inquiries/${inq.id}`)}
                        className="text-slate-600 hover:text-slate-900 text-sm flex items-center gap-1">
                        <Eye className="w-4 h-4" />View
                      </button>
                      <button onClick={() => navigate(`/inquiries/${inq.id}/edit`)}
                        className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1">
                        <Pencil className="w-4 h-4" />Edit
                      </button>
                      <button onClick={() => setProposalInquiry(inq)}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 font-medium">
                        <FileEdit className="w-4 h-4" />Propose
                      </button>
                      {inq.stage !== 'DISBURSED' && (
                        <button onClick={() => openLendModal(inq)}
                          className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center gap-1 font-medium">
                          <CheckCircle className="w-4 h-4" />Approve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {borrowerInquiries.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">No borrower inquiries found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proposal Modal */}
      {proposalInquiry && (
        <ProposalModal
          inquiry={proposalInquiry}
          onClose={() => { refetch(); setProposalInquiry(null); }}
          onDataChanged={() => refetch()}
          onAccepted={() => { refetch(); setProposalInquiry(null); }}
        />
      )}

      {/* Approve & Lend Modal */}
      {showLendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Approve & Disburse Loan</h3>
            <p className="text-sm text-slate-500 mb-4">
              Approve loan for <span className="font-medium">{showLendModal.name}</span> and move to Lended.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Approved Amount (₹)</label>
                <input type="number" value={lendForm.approvedAmount}
                  onChange={(e) => setLendForm({ ...lendForm, approvedAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Interest Rate (%)</label>
                <input type="number" step="0.1" value={lendForm.interestRate}
                  onChange={(e) => setLendForm({ ...lendForm, interestRate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rate Type</label>
                <select value={lendForm.interestRateType}
                  onChange={(e) => setLendForm({ ...lendForm, interestRateType: e.target.value as 'monthly' | 'yearly' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option value="yearly">Yearly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tenure (months)</label>
                <input type="number" value={lendForm.tenureMonths}
                  onChange={(e) => setLendForm({ ...lendForm, tenureMonths: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Repayment Type</label>
                <select value={lendForm.repaymentType}
                  onChange={(e) => setLendForm({ ...lendForm, repaymentType: e.target.value as 'EMI' | 'Interest-Only' | 'Bullet' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option value="EMI">EMI</option>
                  <option value="Interest-Only">Interest-Only (Principal on Maturity)</option>
                  <option value="Bullet">Bullet (All on Maturity)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input type="date" value={lendForm.startDate}
                  onChange={(e) => setLendForm({ ...lendForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Loan Purpose</label>
              <input type="text" value={lendForm.loanPurpose}
                onChange={(e) => setLendForm({ ...lendForm, loanPurpose: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Working capital, business expansion, etc." />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea value={lendForm.notes}
                onChange={(e) => setLendForm({ ...lendForm, notes: e.target.value })} rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowLendModal(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm font-medium">Cancel</button>
              <button onClick={handleApproveAndLend} disabled={accepting}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium disabled:opacity-50">
                {accepting ? 'Processing...' : 'Approve & Disburse'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
