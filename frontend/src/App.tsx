import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import ResetPassword from "./pages/AuthPages/ResetPassword";
import UserProfiles from "./pages/UserProfiles";
import Calendar from "./pages/Calendar";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import AdminHome from "./pages/Dashboard/AdminHome";
import HeadhunterDashboard from "./pages/Dashboard/HeadhunterDashboard";
import CandidateList from "./pages/Candidates/CandidateList";
import CandidateDetailView from "./pages/Candidates/CandidateDetailView";
import CandidateForm from "./pages/Candidates/CandidateForm";
import JobList from "./pages/Jobs/JobList";
import JobCreateForm from "./pages/Jobs/JobCreateForm";
import JobDetailView from "./pages/Jobs/JobDetailView";
// import HeadhunterKanban from "./pages/Jobs/HeadhunterKanban";
import HeadhunterList from "./pages/Headhunters/HeadhunterList";
import HeadhunterDetailView from "./pages/Headhunters/HeadhunterDetailView";
import ClientList from "./pages/Clients/ClientList";
import ClientForm from "./pages/Clients/ClientForm";
import ClientDetailView from "./pages/Clients/ClientDetailView";
import CPartnerDashboard from "./pages/Dashboard/SeniorDashboard";
import AssessoradoList from "./pages/Assessorados/AssessoradoList";
import AssessoradoForm from "./pages/Assessorados/AssessoradoForm";
import AssessoradoDetailView from "./pages/Assessorados/AssessoradoDetailView";
import { UserRoleProvider, useUserRole } from "./context/UserRoleContext";
import { ClientFilterProvider } from "./context/ClientFilterContext";
import { HeadhunterFilterProvider } from "./context/HeadhunterFilterContext";
import RoleBasedRoute from "./components/auth/RoleBasedRoute";
import { ProtectedRoute, PublicOnlyRoute } from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
// import WarrantyDashboard from "./pages/Warranty/WarrantyDashboard";
// import WarrantyRules from "./pages/Warranty/WarrantyRules";
import JestorSyncPage from "./pages/Settings/JestorSyncPage";
import PublicRegisterPage from "./pages/PublicRegister/PublicRegisterPage";

// Component to determine which dashboard to show based on role
const DashboardRoute = () => {
  const { userRole } = useUserRole();
  if (userRole === 'admin') {
    return <AdminHome />;
  } else if (userRole === 'cpartner') {
    return <CPartnerDashboard />;
  } else {
    return <HeadhunterDashboard />;
  }
};

export default function App() {
  return (
    <>
      <AuthProvider>
      <UserRoleProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Dashboard Layout — somente usuários autenticados */}
            <Route
              element={
                <ProtectedRoute>
                  {/* Filtros carregam dados da API: só montam após autenticar */}
                  <ClientFilterProvider>
                    <HeadhunterFilterProvider>
                      <AppLayout />
                    </HeadhunterFilterProvider>
                  </ClientFilterProvider>
                </ProtectedRoute>
              }
            >
              <Route index path="/" element={<DashboardRoute />} />
              <Route path="/candidates" element={<CandidateList />} />
              <Route path="/candidates/new" element={<CandidateForm mode="create" />} />
              <Route path="/candidates/:id" element={<CandidateDetailView />} />
              <Route path="/candidates/:id/edit" element={<CandidateForm mode="edit" />} />
              <Route path="/jobs" element={<JobList />} />
              <Route
                path="/jobs/create"
                element={
                  <RoleBasedRoute allowedRoles={['admin']}>
                    <JobCreateForm />
                  </RoleBasedRoute>
                }
              />
              <Route path="/jobs/:id" element={<JobDetailView />} />
              <Route path="/clients" element={<ClientList />} />
              <Route path="/clients/new" element={<ClientForm mode="create" />} />
              <Route path="/clients/:id" element={<ClientDetailView />} />
              <Route path="/clients/:id/edit" element={<ClientForm mode="edit" />} />
              <Route
                path="/assessorados"
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'cpartner']}>
                    <AssessoradoList />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/assessorados/new"
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'cpartner']}>
                    <AssessoradoForm mode="create" />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/assessorados/:id"
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'cpartner']}>
                    <AssessoradoDetailView />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/assessorados/:id/edit"
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'cpartner']}>
                    <AssessoradoForm mode="edit" />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/headhunters"
                element={
                  <RoleBasedRoute allowedRoles={['admin']}>
                    <HeadhunterList />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/headhunters/:id"
                element={
                  <RoleBasedRoute allowedRoles={['admin']}>
                    <HeadhunterDetailView />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/settings/jestor"
                element={
                  <RoleBasedRoute allowedRoles={['admin']}>
                    <JestorSyncPage />
                  </RoleBasedRoute>
                }
              />
              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/blank" element={<Blank />} />
            </Route>

            {/* Public Registration (no auth required) */}
            <Route path="/register/:token" element={<PublicRegisterPage />} />

            {/* Auth Layout */}
            <Route path="/signin" element={<PublicOnlyRoute><SignIn /></PublicOnlyRoute>} />
            <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Fallback Route */}
            <Route path="*" element={<ProtectedRoute><Blank /></ProtectedRoute>} />
          </Routes>
        </Router>
      </UserRoleProvider>
      </AuthProvider>
    </>
  );
}
