import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  customer_only: 'บัญชีนี้ต้องเข้าสู่ระบบด้วยอีเมลและรหัสผ่านเท่านั้น',
  email_required: 'ไม่พบอีเมลจากบัญชี Google กรุณาใช้อีเมลที่แชร์กับ Google',
  oauth_failed: 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้ง',
}

function getOAuthErrorMessage(errorCode: string | null) {
  if (!errorCode) {
    return OAUTH_ERROR_MESSAGES.oauth_failed
  }

  return OAUTH_ERROR_MESSAGES[errorCode] ?? OAUTH_ERROR_MESSAGES.oauth_failed
}

export default function GoogleAuthCallbackPage() {
  const { completeGoogleLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const handledRef = useRef(false)

  useEffect(() => {
    if (handledRef.current) {
      return
    }

    handledRef.current = true

    const params = new URLSearchParams(location.search)
    const status = params.get('status')

    if (status !== 'success') {
      navigate('/', {
        replace: true,
        state: {
          requireLogin: true,
          oauthError: getOAuthErrorMessage(params.get('error')),
        },
      })
      return
    }

    void completeGoogleLogin()
      .then(() => {
        navigate('/', { replace: true })
      })
      .catch(() => {
        navigate('/', {
          replace: true,
          state: {
            requireLogin: true,
            oauthError: getOAuthErrorMessage('oauth_failed'),
          },
        })
      })
  }, [completeGoogleLogin, location.search, navigate])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <div className="w-10 h-10 mx-auto rounded-full border-4 border-gray-200 border-t-[var(--color-primary)] animate-spin" />
        <h1 className="mt-6 text-xl font-semibold text-gray-900">กำลังเข้าสู่ระบบด้วย Google</h1>
        <p className="mt-2 text-sm text-gray-500">กรุณารอสักครู่ ระบบกำลังยืนยันตัวตนและสร้างเซสชันให้คุณ</p>
      </div>
    </div>
  )
}
