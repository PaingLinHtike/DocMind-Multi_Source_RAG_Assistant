import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import DocumentDetailsPage from './pages/DocumentDetailsPage.jsx'
import DocumentsPage from './pages/DocumentsPage.jsx'

function PlaceholderPage({ title }) {
  return (
    <section className="mx-auto w-full max-w-[1290px] px-6 py-10">
      <h1 className="text-4xl font-bold text-white">{title}</h1>
    </section>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="documents/:documentId" element={<DocumentDetailsPage />} />
        <Route path="upload" element={<PlaceholderPage title="Upload Document" />} />
        <Route path="settings" element={<PlaceholderPage title="Settings" />} />
      </Route>
    </Routes>
  )
}
