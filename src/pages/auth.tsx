import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { RootState } from '../redux/store'
import LoginForm from '../components/auth/LoginForm'
import RegisterForm from '../components/auth/RegisterForm'
import { 
  Play,
  ArrowLeft,
  User,
  KeyRound
} from 'lucide-react'

const AuthPage: React.FC = () => {
  const router = useRouter()
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const roleRoutes: { [key: string]: string } = {
        customer: '/customer',
        agent: '/agent',
        commercial: '/commercial',
        accountant: '/accountant',
        admin: '/admin',
        director: '/director',
        it_admin: '/it-admin/dashboard',
        company: '/company',
      }
      router.push(roleRoutes[user.role] || '/customer')
    }
  }, [isAuthenticated, user, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-primary-50">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-neutral-200/50 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.button
              whileHover={{ x: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/')}
              className="flex items-center text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              На главную
            </motion.button>
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 shadow-glow">
                <Play className="h-5 w-5 text-white" fill="white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-neutral-950 tracking-tight">
                  TV Company
                </h1>
                <p className="text-xs text-neutral-500">
                  Ad Platform
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="flex items-center justify-center min-h-screen py-24 px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="max-w-md w-full"
        >
          {/* Auth Card */}
          <div className="bg-white rounded-2xl shadow-soft-lg border border-neutral-200/50 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.h2 
                key={authMode}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-3xl font-bold text-neutral-950 mb-2"
              >
                {authMode === 'login' ? 'Добро пожаловать!' : 'Создать аккаунт'}
              </motion.h2>
              <motion.p 
                key={`${authMode}-desc`}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-neutral-600"
              >
                {authMode === 'login' 
                  ? 'Войдите в свой аккаунт для доступа к системе'
                  : 'Зарегистрируйтесь для начала работы с системой'
                }
              </motion.p>
            </div>

            {/* Mode Toggle Buttons */}
            <div className="flex bg-neutral-100 rounded-xl p-1 mb-8">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                  authMode === 'login'
                    ? 'bg-white text-primary-600 shadow-soft'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Вход
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className={`flex-1 flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                  authMode === 'register'
                    ? 'bg-white text-primary-600 shadow-soft'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <User className="h-4 w-4 mr-2" />
                Регистрация
              </button>
            </div>

            {/* Auth Forms */}
            <AnimatePresence mode="wait">
              <motion.div
                key={authMode}
                initial={{ opacity: 0, x: authMode === 'login' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: authMode === 'login' ? 20 : -20 }}
                transition={{ duration: 0.3 }}
              >
                {authMode === 'login' ? <LoginForm /> : <RegisterForm />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-center space-y-3"
          >
            <p className="text-sm text-neutral-500">
              Защищённое соединение • Конфиденциальность данных
            </p>
            <p className="text-sm text-neutral-500">
              Нужна помощь?{' '}
              <a href="mailto:support@tvcompany.com" className="text-primary-600 hover:text-primary-700 font-medium">
                Служба поддержки
              </a>
            </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}

export default AuthPage
