import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
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
import SeniorDashboard from "./pages/Dashboard/SeniorDashboard";
import AssessoradoList from "./pages/Assessorados/AssessoradoList";
import AssessoradoForm from "./pages/Assessorados/AssessoradoForm";
import AssessoradoDetailView from "./pages/Assessorados/AssessoradoDetailView";
import { UserRoleProvider, useUserRole } from "./context/UserRoleContext";
import { ClientFilterProvider } from "./context/ClientFilterContext";
import { HeadhunterFilterProvider } from "./context/HeadhunterFilterContext";
import RoleBasedRoute from "./components/auth/RoleBasedRoute";
// import WarrantyDashboard from "./pages/Warranty/WarrantyDashboard";
// import WarrantyRules from "./pages/Warranty/WarrantyRules";
import JestorSyncPage from "./pages/Settings/JestorSyncPage";

// Component to determine which dashboard to show based on role
const DashboardRoute = () => {
  const { userRole } = useUserRole();
  if (userRole === 'admin') {
    return <AdminHome />;
  } else if (userRole === 'senior') {
    return <SeniorDashboard />;
  } else {
    return <HeadhunterDashboard />;
  }
};

export default function App() {
  return (
    <>
      <UserRoleProvider>
        <ClientFilterProvider>
        <HeadhunterFilterProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Dashboard Layout */}
            <Route element={<AppLayout />}>
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
                  <RoleBasedRoute allowedRoles={['admin', 'senior']}>
                    <AssessoradoList />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/assessorados/new"
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'senior']}>
                    <AssessoradoForm mode="create" />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/assessorados/:id"
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'senior']}>
                    <AssessoradoDetailView />
                  </RoleBasedRoute>
                }
              />
              <Route
                path="/assessorados/:id/edit"
                element={
                  <RoleBasedRoute allowedRoles={['admin', 'senior']}>
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

            {/* Auth Layout */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Fallback Route */}
            <Route path="*" element={<Blank />} />
          </Routes>
        </Router>
        </HeadhunterFilterProvider>
        </ClientFilterProvider>
      </UserRoleProvider>
    </>
  );
}
