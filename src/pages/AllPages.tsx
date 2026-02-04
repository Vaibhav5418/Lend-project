import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

export default function AllPages() {
  const pages = [
    { path: '/', name: 'Dashboard', description: 'KPIs, charts, follow-ups, and recent activity' },
    { path: '/inquiries', name: 'Inquiries List', description: 'Main CRM table with filters and quick actions' },
    { path: '/inquiries/new', name: 'Add New Inquiry', description: 'Fast entry form for borrower/investor inquiries' },
    { path: '/inquiries/INQ-001', name: 'Inquiry Detail (Rajesh Kumar)', description: '3-column layout with timeline and tabs' },
    { path: '/inquiries/INQ-002', name: 'Inquiry Detail (Sunita Patel)', description: 'Investor inquiry example' },
    { path: '/follow-ups', name: 'Follow-ups Calendar', description: 'Calendar and list view with action drawer' },
    { path: '/borrower-pipeline', name: 'Borrower Pipeline', description: 'Kanban board with 9 stages' },
    { path: '/investor-pipeline', name: 'Investor Pipeline', description: 'Kanban board with 6 investor stages' },
    { path: '/agents', name: 'Agents / References', description: 'Performance tracking and commission management' },
    { path: '/documents', name: 'Documents Center', description: 'Status tracking and upload management' },
    { path: '/reports', name: 'Reports', description: 'Analytics, insights, and performance metrics' },
    { path: '/settings', name: 'Settings', description: 'Preferences and configuration' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">All Pages Overview</h1>
        <p className="text-blue-100">
          Navigate through all screens of the Money Lending CRM + Inquiry Management System
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((page, index) => (
          <Link
            key={page.path}
            to={page.path}
            className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all hover:border-blue-300 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-lg">
                {index + 1}
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
              {page.name}
            </h3>
            <p className="text-sm text-gray-600">{page.description}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Navigation Guide</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-700 text-xs font-bold">1</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Use the sidebar on the left</p>
              <p className="text-xs text-gray-600">Click any menu item to navigate between screens</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-700 text-xs font-bold">2</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Quick actions in header</p>
              <p className="text-xs text-gray-600">Global search, notifications, and "+ New Inquiry" button</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-700 text-xs font-bold">3</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Interactive elements</p>
              <p className="text-xs text-gray-600">Click on inquiry IDs, names, or cards to view details</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Desktop Optimized</h3>
          <p className="text-xs text-blue-700">Best viewed on screens 1024px and wider</p>
        </div>
        <div className="bg-green-50 rounded-lg p-5 border border-green-200">
          <h3 className="text-sm font-semibold text-green-900 mb-2">Mobile Responsive</h3>
          <p className="text-xs text-green-700">Fully functional on tablets and phones</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-5 border border-purple-200">
          <h3 className="text-sm font-semibold text-purple-900 mb-2">No Login Required</h3>
          <p className="text-xs text-purple-700">Direct access to all features</p>
        </div>
      </div>
    </div>
  );
}
