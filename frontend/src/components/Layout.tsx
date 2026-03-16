import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from './Navbar'
import Footer from './Footer'
import { trackEvent, trackEventKeepalive } from '../services/trackingService'

export default function Layout() {
    const { isAdmin } = useAuth()
    const location = useLocation()
    const lastPathRef = useRef<string>('')
    const pageStartRef = useRef<number>(Date.now())
    const suppressDuplicateRef = useRef<string>('')

    useEffect(() => {
        const currentPath = `${location.pathname}${location.search}`
        const now = Date.now()

        // กันการยิงซ้ำในโหมด StrictMode ระหว่าง mount ซ้ำใน dev
        const dedupeKey = `${currentPath}_${Math.floor(now / 1000)}`
        if (suppressDuplicateRef.current === dedupeKey) return
        suppressDuplicateRef.current = dedupeKey

        const previousPath = lastPathRef.current
        const previousStart = pageStartRef.current
        if (previousPath) {
            const dwellMs = Math.max(0, now - previousStart)
            trackEventKeepalive({
                eventType: 'dwell_time',
                pagePath: previousPath,
                dwellMs,
                metadata: { reason: 'route_change' },
            })
        }

        trackEvent({
            eventType: 'page_view',
            pagePath: currentPath,
        })

        lastPathRef.current = currentPath
        pageStartRef.current = now
    }, [location.pathname, location.search])

    useEffect(() => {
        const handlePageHide = () => {
            const pagePath = lastPathRef.current
            if (!pagePath) return
            const dwellMs = Math.max(0, Date.now() - pageStartRef.current)
            trackEventKeepalive({
                eventType: 'dwell_time',
                pagePath,
                dwellMs,
                metadata: { reason: 'page_hide' },
            })
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState !== 'hidden') return
            handlePageHide()
        }

        window.addEventListener('pagehide', handlePageHide)
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            window.removeEventListener('pagehide', handlePageHide)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [])

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className={`flex-1 ${isAdmin ? 'pt-[68px]' : ''}`.trim()}>
                <Outlet />
            </main>
            {!isAdmin && <Footer />}
        </div>
    )
}
