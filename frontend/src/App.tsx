import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ToursPage from './pages/ToursPage'
import TourDetailPage from './pages/TourDetailPage'
import MyBookingsPage from './pages/MyBookingsPage'
import AdminTourListPage from './pages/admin/AdminTourListPage'
import AdminTourFormPage from './pages/admin/AdminTourFormPage'
import ProtectedRoute from './components/ProtectedRoute'
import BookingInfoPage from './pages/BookingInfoPage'
import PaymentPage from './pages/PaymentPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/tours" element={<ToursPage />} />
            <Route path="/tours/:id" element={<TourDetailPage />} />

            <Route path="/booking/:tourId" element={
              <ProtectedRoute>
                <BookingInfoPage />
              </ProtectedRoute>
            } />

            <Route path="/payment/:bookingId" element={
              <ProtectedRoute>
                <PaymentPage />
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
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
