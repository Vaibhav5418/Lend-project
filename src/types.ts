export type InquiryType = 'Borrower' | 'Investor';
export type Priority = 'Hot' | 'Warm' | 'Cold';
export type Source = 'Website' | 'Referral' | 'Walk-in' | 'Social Media' | 'Agent' | 'Existing Client';

/** Backend uses uppercase stage codes. Use these for API and filtering. */
export const BORROWER_STAGES = [
  'NEW',
  'CONTACTED',
  'DOCS_PENDING',
  'VERIFIED',
  'APPROVED',
  'DISBURSED',
] as const;
export type BorrowerStage = (typeof BORROWER_STAGES)[number];

export const INVESTOR_STAGES = [
  'NEW',
  'CONTACTED',
  'RATE_DISCUSSED',
  'AGREEMENT_DONE',
  'FUND_RECEIVED',
] as const;
export type InvestorStage = (typeof INVESTOR_STAGES)[number];

export const DEFAULT_STAGE = 'NEW' as const;

/** Human-readable labels for pipeline stages */
export const STAGE_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  DOCS_PENDING: 'Docs Pending',
  VERIFIED: 'Verified',
  APPROVED: 'Approved',
  DISBURSED: 'Disbursed',
  RATE_DISCUSSED: 'Rate Discussed',
  AGREEMENT_DONE: 'Agreement Done',
  FUND_RECEIVED: 'Fund Received',
};

export interface ActivityLog {
  action: string;
  oldStage?: string;
  newStage?: string;
  changedAt: string;
}

export interface Inquiry {
  id: string;
  type: InquiryType;
  name: string;
  mobile: string;
  email: string;
  city: string;
  source: Source;
  priority: Priority;
  assignedTo: string;
  referenceAgent?: string;
  stage: string;
  nextFollowUp?: string;
  lastActivity: string;
  lastActivityAt?: string;
  createdAt: string;
  notes: string;
  activityLogs?: ActivityLog[];
  combinedReportMarkdown?: string;
  combinedReportGeneratedAt?: string;
  profileScore?: number;
  profileScoreRating?: string;
  borrowerDetails?: {
    loanAmount: number;
    tenure: number;
    proposedInterest: number;
  };
  investorDetails?: {
    investmentAmount: number;
    expectedInterest: number;
    tenure: number;
  };
}

export const staff = ['Amit Shah', 'Neha Kapoor', 'Rahul Verma'];
