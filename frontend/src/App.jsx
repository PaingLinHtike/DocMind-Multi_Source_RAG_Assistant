import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from './auth/AuthRoute.jsx'
import { AuthProvider } from './auth/AuthSession.jsx'
import AppLayout from './components/layout/AppLayout.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import DocumentDetailsPage from './pages/DocumentDetailsPage.jsx'
import DocumentsPage from './pages/DocumentsPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import SignInPage from './pages/SignInPage.jsx'
import SignUpPage from './pages/SignUpPage.jsx'
import UploadPage from './pages/UploadPage.jsx'

export default function App({ initialUser }) {
  return (
    <AuthProvider initialUser={initialUser}>
      <Routes>
        <Route index element={<Navigate replace to="/signin" />} />
        <Route element={<PublicOnlyRoute />}>
          <Route path="signin" element={<SignInPage />} />
          <Route path="signup" element={<SignUpPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="documents/:documentId" element={<DocumentDetailsPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}
