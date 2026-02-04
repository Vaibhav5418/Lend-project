import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InquiriesList from './pages/InquiriesList';
import NewInquiry from './pages/NewInquiry';
import InquiryDetail from './pages/InquiryDetail';
import EditInquiry from './pages/EditInquiry';
import FollowUpsCalendar from './pages/FollowUpsCalendar';
import BorrowerPipeline from './pages/BorrowerPipeline';
import InvestorPipeline from './pages/InvestorPipeline';
import Agents from './pages/Agents';
import Documents from './pages/Documents';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AllPages from './pages/AllPages';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/all-pages" element={<AllPages />} />
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/inquiries" element={<InquiriesList />} />
                    <Route path="/inquiries/new" element={<NewInquiry />} />
                    <Route path="/inquiries/:id" element={<InquiryDetail />} />
                    <Route path="/inquiries/:id/edit" element={<EditInquiry />} />
                    <Route path="/follow-ups" element={<FollowUpsCalendar />} />
                    <Route path="/borrower-pipeline" element={<BorrowerPipeline />} />
                    <Route path="/investor-pipeline" element={<InvestorPipeline />} />
                    <Route path="/agents" element={<Agents />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
