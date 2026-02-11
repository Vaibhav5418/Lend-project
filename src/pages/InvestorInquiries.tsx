import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Eye, Phone, Mail, CheckCircle, Pencil } from 'lucide-react';
import { useInquiryCache } from '../context/InquiryCacheContext';
import { api } from '../api/client';
import { STAGE_LABELS } from '../types';
import type { Inquiry } from '../types';

function formatAmount(amount: number): string {
  if (amount >= 1_00_00_000) return `₹ ${(amount / 1_00_00_000).toFixed(1)} Cr`;
  if (amount >= 1_00_000) return `₹ ${(amount / 1_00_000).toFixed(1)} L`;
  if (amount >= 1_000) return `₹ ${(amount / 1_000).toFixed(1)} K`;
  return `₹ ${amount.toLocaleString('en-IN')}`;
}

export default function InvestorInquiries() {
  const navigate = useNavigate();
  const { inquiries, loading, error, refetch } = useInquiryCache();
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [accepting, setAccepting] = useState<string | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState<Inquiry | null>(null);
  const [acceptForm, setAcceptForm] = useState({
    interestRate: '',
    interestRateType: 'yearly' as 'monthly' | 'yearly',
    tenureMonths: '',
    investmentPlan: 'custom',
    payoutFrequency: 'monthly' as 'monthly' | 'quarterly' | 'on_maturity',
    startDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const investorInquiries = inquiries
    .filter((i) => i.type === 'Investor')
    .filter((i) => stageFilter === 'All' || i.stage === stageFilter)
    .filter((i) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return i.name.toLowerCase().includes(q) || i.mobile.includes(q) || i.email.toLowerCase().includes(q);
    });

  const handleAccept = async () => {
    if (!showAcceptModal) return;
    setAccepting(showAcceptModal.id);
    try {
      await api.createInvestorInvestment({
        inquiryId: showAcceptModal.id,
        investorName: showAcceptModal.name,
        mobile: showAcceptModal.mobile,
        email: showAcceptModal.email,
        investedAmount: showAcceptModal.investorDetails?.investmentAmount || 0,
        interestRate: Number(acceptForm.interestRate) || showAcceptModal.investorDetails?.expectedInterest || 0,
        interestRateType: acceptForm.interestRateType,
        tenureMonths: Number(acceptForm.tenureMonths) || showAcceptModal.investorDetails?.tenure || 0,
        investmentPlan: acceptForm.investmentPlan,
        payoutFrequency: acceptForm.payoutFrequency,
        startDate: acceptForm.startDate,
        notes: acceptForm.notes,
      });
      await refetch();
      setShowAcceptModal(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to accept');
    } finally {
      setAccepting(null);
    }
  };

  if (loading) return <div className="p-6 text-slate-500">Loading investor inquiries...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Investor Inquiries</h1>
        <p className="text-slate-600 mt-1 text-sm">Manage investor intent and fund acceptance</p>
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
            className="w-full sm:w-auto min-w-0 px-3 py-2 sm:py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          >
            <option value="All">All Stages</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="RATE_DISCUSSED">Rate Discussed</option>
            <option value="AGREEMENT_DONE">Agreement Done</option>
            <option value="FUND_RECEIVED">Fund Received</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden -mx-4 sm:mx-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Investor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Expected Rate</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tenure</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Frequency</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {investorInquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-violet-50/40 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-medium text-violet-600">{inq.id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">{inq.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />{inq.mobile}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />{inq.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                    {inq.investorDetails?.investmentAmount ? formatAmount(inq.investorDetails.investmentAmount) : '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                    {inq.investorDetails?.expectedInterest ? `${inq.investorDetails.expectedInterest}%` : '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                    {inq.investorDetails?.tenure ? `${inq.investorDetails.tenure} mo` : '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                    {inq.investorDetails?.frequency || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                      {STAGE_LABELS[inq.stage] ?? inq.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      inq.priority === 'Hot' ? 'bg-red-100 text-red-700' :
                      inq.priority === 'Warm' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{inq.priority}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/inquiries/${inq.id}`)}
                        className="text-slate-600 hover:text-slate-900 text-sm flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />View
                      </button>
                      <button
                        onClick={() => navigate(`/inquiries/${inq.id}/edit`)}
                        className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1"
                      >
                        <Pencil className="w-4 h-4" />Edit
                      </button>
                      {inq.stage !== 'FUND_RECEIVED' && (
                        <button
                          onClick={() => {
                            const freqMap: Record<string, 'monthly' | 'quarterly' | 'on_maturity'> = {
                              'Monthly': 'monthly',
                              'Quarterly': 'quarterly',
                              'Half-Yearly': 'on_maturity',
                              'Yearly': 'on_maturity',
                            };
                            setAcceptForm({
                              interestRate: String(inq.investorDetails?.expectedInterest || ''),
                              interestRateType: 'yearly',
                              tenureMonths: String(inq.investorDetails?.tenure || ''),
                              investmentPlan: 'custom',
                              payoutFrequency: freqMap[inq.investorDetails?.frequency || ''] || 'monthly',
                              startDate: new Date().toISOString().slice(0, 10),
                              notes: '',
                            });
                            setShowAcceptModal(inq);
                          }}
                          className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center gap-1 font-medium"
                        >
                          <CheckCircle className="w-4 h-4" />Accept
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {investorInquiries.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    No investor inquiries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accept Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Accept Investment</h3>
            <p className="text-sm text-slate-500 mb-4">
              Accept <span className="font-medium">{showAcceptModal.name}</span>'s investment and move to active.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={acceptForm.interestRate}
                  onChange={(e) => setAcceptForm({ ...acceptForm, interestRate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rate Type</label>
                <select
                  value={acceptForm.interestRateType}
                  onChange={(e) => setAcceptForm({ ...acceptForm, interestRateType: e.target.value as 'monthly' | 'yearly' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                >
                  <option value="yearly">Yearly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tenure (months)</label>
                <input
                  type="number"
                  value={acceptForm.tenureMonths}
                  onChange={(e) => setAcceptForm({ ...acceptForm, tenureMonths: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payout Frequency</label>
                <select
                  value={acceptForm.payoutFrequency}
                  onChange={(e) => setAcceptForm({ ...acceptForm, payoutFrequency: e.target.value as 'monthly' | 'quarterly' | 'on_maturity' })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="on_maturity">On Maturity</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Investment Plan</label>
                <select
                  value={acceptForm.investmentPlan}
                  onChange={(e) => setAcceptForm({ ...acceptForm, investmentPlan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                >
                  <option value="1">1 Month</option>
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="12">12 Months</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={acceptForm.startDate}
                  onChange={(e) => setAcceptForm({ ...acceptForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                value={acceptForm.notes}
                onChange={(e) => setAcceptForm({ ...acceptForm, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAcceptModal(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm font-medium"
              >Cancel</button>
              <button
                onClick={handleAccept}
                disabled={!!accepting}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium disabled:opacity-50"
              >{accepting ? 'Accepting...' : 'Accept & Activate'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
