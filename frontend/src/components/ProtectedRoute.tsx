import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
    children: React.ReactNode
    requiredRole?: 'admin' | 'customer'
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { user, isLoading } = useAuth()

    // Show loading while checking auth
    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    // Not authenticated → redirect to home
    if (!user) {
        return <Navigate to="/" replace />
    }

    // Authenticated but doesn't have required role → redirect to home
    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/" replace />
    }

    // All checks passed → render children
    return <>{children}</>
}
