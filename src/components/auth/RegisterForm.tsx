import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { IMaskInput } from 'react-imask'
import { AppDispatch, RootState } from '../../redux/store'
import { registerUser, clearError } from '../../redux/slices/authSlice'
import { useRouter } from 'next/router'
import { Eye, EyeOff, User, Mail, Lock, Phone as PhoneIcon, Loader2, UserPlus } from 'lucide-react'

interface RegisterFormData {
  first_name: string
  middle_name?: string
  last_name: string
  email: string
  password: string
  confirmPassword: string
  phone?: string
}

const RegisterForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const dispatch = useDispatch<AppDispatch>()
  const { loading, error } = useSelector((state: RootState) => state.auth)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<RegisterFormData>()

  const password = watch('password')

  const onSubmit = async (data: RegisterFormData) => {
    dispatch(clearError())
    try {
      const resultAction = await dispatch(registerUser({
        first_name: data.first_name,
        middle_name: data.middle_name,
        last_name: data.last_name,
        phone: data.phone,
        email: data.email,
        password: data.password,
      }))
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
      // error displayed from redux state
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-neutral-700 mb-2">
            Имя
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              {...register('first_name', {
                required: 'Имя обязательно',
                minLength: { value: 1, message: 'Введите имя' },
              })}
              type="text"
              id="first_name"
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl bg-white text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              placeholder="Иван"
            />
          </div>
          {errors.first_name && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1.5 text-xs text-red-600"
            >
              {errors.first_name.message}
            </motion.p>
          )}
        </div>

        <div>
          <label htmlFor="middle_name" className="block text-sm font-medium text-neutral-700 mb-2">
            Отчество
          </label>
          <input
            {...register('middle_name')}
            type="text"
            id="middle_name"
            className="w-full px-4 py-3 border border-neutral-300 rounded-xl bg-white text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            placeholder="Петрович"
          />
        </div>

        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-neutral-700 mb-2">
            Фамилия
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              {...register('last_name', {
                required: 'Фамилия обязательна',
                minLength: { value: 1, message: 'Введите фамилию' },
              })}
              type="text"
              id="last_name"
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl bg-white text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              placeholder="Иванов"
            />
          </div>
          {errors.last_name && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1.5 text-xs text-red-600"
            >
              {errors.last_name.message}
            </motion.p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
          Телефон
        </label>
        <div className="relative">
          <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 z-10" />
          <Controller
            name="phone"
            control={control}
            rules={{
              required: 'Телефон обязателен',
              validate: (value) => {
                const cleaned = value?.replace(/\D/g, '');
                return (cleaned && cleaned.length === 11) || 'Введите полный номер телефона';
              }
            }}
            render={({ field: { onChange, value, ref } }) => (
              <IMaskInput
                mask="+{7} (000) 000 00-00"
                value={value}
                unmask={false}
                onAccept={(value) => onChange(value)}
                placeholder="+7 (900) 000 00-00"
                inputRef={ref}
                className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl bg-white text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
            )}
          />
        </div>
        {errors.phone && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-xs text-red-600"
          >
            {errors.phone.message}
          </motion.p>
        )}
      </div>

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
            placeholder="Минимум 6 символов"
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

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
          Подтвердите пароль
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
          <input
            {...register('confirmPassword', {
              required: 'Подтверждение пароля обязательно',
              validate: (value) =>
                value === password || 'Пароли не совпадают',
            })}
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            className="w-full pl-10 pr-12 py-3 border border-neutral-300 rounded-xl bg-white text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            placeholder="Повторите пароль"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1"
            aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <motion.p 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-xs text-red-600"
          >
            {errors.confirmPassword.message}
          </motion.p>
        )}
      </div>

      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          id="terms"
          name="terms"
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded cursor-pointer"
        />
        <span className="text-sm text-neutral-700 group-hover:text-neutral-900 transition-colors">
          Я согласен с{' '}
          <a href="#" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
            условиями использования
          </a>{' '}
          и{' '}
          <a href="#" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
            политикой конфиденциальности
          </a>
        </span>
      </label>

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
                Регистрация...
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Создать аккаунт
              </>
            )}
          </span>
        </button>
      </motion.div>
    </motion.form>
  )
}

export default RegisterForm
