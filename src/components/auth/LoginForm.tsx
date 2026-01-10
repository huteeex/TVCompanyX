import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { AppDispatch, RootState } from '../../redux/store'
import { loginUser, clearError } from '../../redux/slices/authSlice'
import { useRouter } from 'next/router'
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowRight } from 'lucide-react'
import { Input, Button } from '../ui/FormElements'

interface LoginFormData {
  email: string
  password: string
}

const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const dispatch = useDispatch<AppDispatch>()
  const { loading, error } = useSelector((state: RootState) => state.auth)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    dispatch(clearError())
    try {
      const resultAction = await dispatch(loginUser(data))
      const payload: any = (resultAction as any).payload
      if (payload?.user?.role) {
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
        router.push(roleRoutes[payload.user.role] || '/customer')
      }
    } catch (err) {
      // error handled in slice
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(onSubmit)()
    }
  }

  return (
    <motion.form 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit(onSubmit)} 
      className="space-y-5" 
      onKeyPress={handleKeyPress}
    >
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-xl"
        >
          <p className="text-sm text-red-700">{error}</p>
        </motion.div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
          Email адрес
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
          <input
            {...register('email', {
              required: 'Email обязателен',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Неверный формат email',
              },
            })}
            type="email"
            id="email"
            className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl bg-white text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            placeholder="example@company.com"
          />
        </div>
        {errors.email && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-xs text-red-600"
          >
            {errors.email.message}
          </motion.p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
          Пароль
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
          <input
            {...register('password', {
              required: 'Пароль обязателен',
              minLength: {
                value: 6,
                message: 'Пароль должен содержать минимум 6 символов',
              },
            })}
            type={showPassword ? 'text' : 'password'}
            id="password"
            className="w-full pl-10 pr-12 py-3 border border-neutral-300 rounded-xl bg-white text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            placeholder="Введите ваш пароль"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1"
            aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-xs text-red-600"
          >
            {errors.password.message}
          </motion.p>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded cursor-pointer"
          />
          <span className="text-neutral-700 group-hover:text-neutral-900 transition-colors">
            Запомнить меня
          </span>
        </label>

        <a href="#" className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
          Забыли пароль?
        </a>
      </div>

      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={loading}
          className="w-full group relative overflow-hidden bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3.5 rounded-xl font-medium shadow-soft hover:shadow-soft-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Вход...
              </>
            ) : (
              <>
                Войти в систему
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </>
            )}
          </span>
        </button>
      </motion.div>
    </motion.form>
  )
}

export default LoginForm
