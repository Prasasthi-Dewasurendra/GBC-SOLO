import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminPage } from './pages/AdminPage'
import { CapturePage } from './pages/CapturePage'
import { DisplayPage } from './pages/DisplayPage'
import { DrawPage } from './pages/DrawPage'
import { LoginPage } from './pages/LoginPage'
import { ScoringPage } from './pages/ScoringPage'
import { DesignPreviewPage } from './pages/DesignPreviewPage'
import { OverlayPage } from './pages/OverlayPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/display" element={<DisplayPage />} />
        <Route path="/overlay" element={<OverlayPage />} />
        <Route path="/capture/:playerId" element={<CapturePage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/draw" element={<DrawPage />} />
          <Route path="/admin/scoring" element={<ScoringPage />} />
          <Route path="/admin/design-preview" element={<DesignPreviewPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/display" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
