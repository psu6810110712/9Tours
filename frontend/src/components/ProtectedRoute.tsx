import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
    children: React.ReactNode
    requiredRole?: 'admin' | 'customer'
    allowIncompleteProfile?: boolean
}

export default function ProtectedRoute({ children, requiredRole, allowIncompleteProfile = false }: ProtectedRouteProps) {
    const { user, isLoading } = useAuth()
    const location = useLocation()

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    if (!user) {
        return <Navigate to="/" state={{ ...location.state, requireLogin: true }} replace />
    }

    if (!allowIncompleteProfile && user.role === 'customer' && !user.profileCompleted) {
        return (
            <Navigate
                to="/auth/complete-profile"
                state={{ returnTo: `${location.pathname}${location.search}${location.hash}` }}
                replace
            />
        )
    }

    if (requiredRole && user.role !== requiredRole) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-3xl font-bold text-red-500 mb-4">ไม่มีสิทธิ์เข้าถึง</h1>
                <a href="/" className="text-primary hover:underline">กลับหน้าแรก</a>
            </div>
        )
    }

    return <>{children}</>
}
