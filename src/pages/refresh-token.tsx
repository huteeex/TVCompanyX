import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useDispatch } from 'react-redux'
import { setUser } from '../redux/slices/authSlice'
import toast from 'react-hot-toast'

export default function RefreshTokenPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    refreshToken()
  }, [])

  const refreshToken = async () => {
    try {
      const res = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        credentials: 'same-origin'
      })

      if (res.ok) {
        const data = await res.json()
        
        // Update Redux store with new user data
        dispatch(setUser(data.user))
        
        toast.success('Токен обновлён! Роль: ' + data.user.role)
        
        // Redirect based on new role
        setTimeout(() => {
          if (data.user.role === 'it_admin') {
            router.push('/it-admin/dashboard')
          } else if (data.user.role === 'customer') {
            router.push('/customer/dashboard')
          } else if (data.user.role === 'agent') {
            router.push('/agent/dashboard')
          } else if (data.user.role === 'commercial') {
            router.push('/commercial/dashboard')
          } else if (data.user.role === 'director') {
            router.push('/director/dashboard')
          } else if (data.user.role === 'accountant') {
            router.push('/accountant/dashboard')
          } else {
            router.push('/')
          }
        }, 1500)
      } else {
        const error = await res.json()
        toast.error(error.error || 'Ошибка обновления токена')
        setTimeout(() => router.push('/auth'), 2000)
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
      toast.error('Ошибка обновления токена')
      setTimeout(() => router.push('/auth'), 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center">
          {loading ? (
            <>
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Обновление токена...</h2>
              <p className="text-gray-600">Пожалуйста, подождите</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Готово!</h2>
              <p className="text-gray-600">Перенаправление...</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
