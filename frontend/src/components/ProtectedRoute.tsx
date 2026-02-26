import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProtectedRouteProps {
    children: React.ReactNode
    requiredRole?: 'admin' | 'customer'
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { user, isLoading } = useAuth()
    const location = useLocation()

    // แสดงการโหลดเมื่อตรวจสอบ auth
    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    // ไม่ได้ login → redirect ไปหน้า Home + เปิด LoginModal พร้อมพ่วง State เดิมไปด้วย (เผื่อมี error state ที่ส่งมาจาก Navbar ก่อนโดนเตะ)
    if (!user) {
        return <Navigate to="/" state={{ ...location.state, requireLogin: true }} replace />
    }

    // ผู้ใช้ login แต่ไม่มีสิทธิ์เข้าถึง → แสดง "ไม่มีสิทธิ์เข้าถึง"
    if (requiredRole && user.role !== requiredRole) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-3xl font-bold text-red-500 mb-4">ไม่มีสิทธิ์เข้าถึง</h1>
                <a href="/" className="text-blue-500 hover:underline">กลับหน้าแรก</a>
            </div>
        )
    }

    // ผู้ใช้ login และมีสิทธิ์เข้าถึง → render children
    return <>{children}</>
}
