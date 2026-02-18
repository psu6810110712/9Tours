import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import HomePage from './pages/HomePage'
import ToursPage from './pages/ToursPage'
import TourDetailPage from './pages/TourDetailPage'
import AdminTourListPage from './pages/admin/AdminTourListPage'
import AdminTourFormPage from './pages/admin/AdminTourFormPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tours" element={<ToursPage />} />
          <Route path="/tours/:id" element={<TourDetailPage />} />
          <Route path="/admin/tours" element={<AdminTourListPage />} />
          <Route path="/admin/tours/new" element={<AdminTourFormPage />} />
          <Route path="/admin/tours/:id/edit" element={<AdminTourFormPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
