import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
    adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
    const { user, isLoading, isAdmin } = useAuth()

    // รอให้โหลดข้อมูลเสร็จก่อน ถ้ายังโหลดอยู่แสดงข้อความโหลด
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                กำลังตรวจสอบสิทธิ์...
            </div>
        )
    }

    // ถ้าไม่ได้ล็อกอิน ให้เด้งกลับหน้าแรก
    if (!user) {
        return <Navigate to="/" replace />
    }

    // ถ้าต้องการสิทธิ์ Admin แต่ไม่ใช่ Admin ให้เด้งกลับหน้าแรก
    if (adminOnly && !isAdmin) {
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}
