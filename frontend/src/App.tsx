import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ToursPage from './pages/ToursPage'
import TourDetailPage from './pages/TourDetailPage'
import MyBookingsPage from './pages/MyBookingsPage'
import AdminTourListPage from './pages/admin/AdminTourListPage'
import AdminTourFormPage from './pages/admin/AdminTourFormPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminBookings from './pages/admin/AdminBookings'
import ProtectedRoute from './components/ProtectedRoute'
import BookingInfoPage from './pages/BookingInfoPage'
import PaymentPage from './pages/PaymentPage'
import GoogleAuthCallbackPage from './pages/GoogleAuthCallbackPage'
import CompleteProfilePage from './pages/CompleteProfilePage'

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            fontSize: '14px',
            padding: '12px 16px',
            fontWeight: 500,
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/auth/google/callback" element={<GoogleAuthCallbackPage />} />

          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/tours" element={<ToursPage />} />
            <Route path="/tours/:id" element={<TourDetailPage />} />
            <Route
              path="/auth/complete-profile"
              element={
                <ProtectedRoute allowIncompleteProfile>
                  <CompleteProfilePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/booking/:tourId"
              element={
                <ProtectedRoute>
                  <BookingInfoPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/payment/:bookingId"
              element={
                <ProtectedRoute>
                  <PaymentPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookingsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bookings"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tours"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminTourListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tours/new"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminTourFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tours/:id/edit"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminTourFormPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
