import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import HomePage from './pages/HomePage'
import ToursPage from './pages/ToursPage'
import TourDetailPage from './pages/TourDetailPage'
import BookingPage from './pages/BookingPage'
import MyBookingsPage from './pages/MyBookingsPage'
import AdminTourListPage from './pages/admin/AdminTourListPage'
import AdminTourFormPage from './pages/admin/AdminTourFormPage'
import ProtectedRoute from './components/ProtectedRoute'
import BookingInfoPage from './pages/BookingInfoPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tours" element={<ToursPage />} />
          <Route path="/tours/:id" element={<TourDetailPage />} />
          <Route path="/booking/:tourId" element={<BookingInfoPage />} />


          <Route path="/booking/:tourId" element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          } />
          <Route path="/my-bookings" element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          } />

          <Route path="/admin/tours" element={
            <ProtectedRoute requiredRole="admin">
              <AdminTourListPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/tours/new" element={
            <ProtectedRoute requiredRole="admin">
              <AdminTourFormPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/tours/:id/edit" element={
            <ProtectedRoute requiredRole="admin">
              <AdminTourFormPage />
            </ProtectedRoute>
          } />

        </Routes>    
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
