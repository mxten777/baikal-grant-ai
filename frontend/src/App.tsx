import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Admin pages
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminPrograms from './pages/admin/Programs'
import AdminApplications from './pages/admin/Applications'
import AdminApplicationDetail from './pages/admin/ApplicationDetail'
import AdminFormBuilder from './pages/admin/FormBuilder'

// User pages
import ProgramList from './pages/user/ProgramList'
import ProgramDetail from './pages/user/ProgramDetail'
import ApplyForm from './pages/user/ApplyForm'
import MyApplications from './pages/user/MyApplications'
import UserLogin from './pages/user/UserLogin'
import UserRegister from './pages/user/UserRegister'

// Layout
import AdminLayout from './layouts/AdminLayout'
import UserLayout from './layouts/UserLayout'

function PrivateRoute({ children, adminOnly = false }: { children: JSX.Element; adminOnly?: boolean }) {
  const { user, token } = useAuthStore()
  if (!token || !user) return <Navigate to="/login" />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public user routes */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<ProgramList />} />
          <Route path="/programs/:id" element={<ProgramDetail />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/register" element={<UserRegister />} />
          <Route path="/programs/:id/apply" element={
            <PrivateRoute><ApplyForm /></PrivateRoute>
          } />
          <Route path="/my-applications" element={
            <PrivateRoute><MyApplications /></PrivateRoute>
          } />
        </Route>

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={
          <PrivateRoute adminOnly><AdminLayout /></PrivateRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="programs" element={<AdminPrograms />} />
          <Route path="programs/:id/form" element={<AdminFormBuilder />} />
          <Route path="applications" element={<AdminApplications />} />
          <Route path="applications/:id" element={<AdminApplicationDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
