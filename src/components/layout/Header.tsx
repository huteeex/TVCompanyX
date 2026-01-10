import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import { RootState, AppDispatch } from '../../redux/store'
import { logout } from '../../redux/slices/authSlice'
import NotificationBell from '../NotificationBell'
import { 
  UserCircle,
  Settings,
  LogOut,
  Play,
  ChevronDown
} from 'lucide-react'

const Header: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const router = useRouter()
  
  const handleLogout = () => {
    dispatch(logout())
    router.push('/')
  }

  const getRoleDisplayName = (role: string) => {
    const roleNames: { [key: string]: string } = {
      customer: 'Заказчик',
      agent: 'Рекламный агент',
      commercial: 'Коммерческий отдел',
      accountant: 'Бухгалтер',
      admin: 'ИТ-администратор',
      director: 'Директор',
    }
    return roleNames[role] || role
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-200/50">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 shadow-soft">
            <Play className="h-5 w-5 text-white" fill="white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-semibold text-neutral-950 tracking-tight">
              TV Company
            </h1>
            <p className="text-xs text-neutral-500">
              Ad Platform
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 px-3 py-2 rounded-xl text-neutral-700 hover:bg-neutral-100 transition-colors duration-200 border border-transparent hover:border-neutral-200"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600">
                <UserCircle className="h-5 w-5 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-neutral-950">
                  {user?.name}
                </p>
                <p className="text-xs text-neutral-500">
                  {user?.role && getRoleDisplayName(user.role)}
                </p>
              </div>
              <ChevronDown 
                className={`hidden md:block h-4 w-4 text-neutral-500 transition-transform duration-200 ${
                  userMenuOpen ? 'rotate-180' : ''
                }`} 
              />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-soft-lg border border-neutral-200/50 py-2 overflow-hidden"
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <div className="px-4 py-3 border-b border-neutral-100">
                    <p className="text-sm font-semibold text-neutral-950">{user?.name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{user?.email}</p>
                  </div>
                  
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-neutral-700 hover:text-neutral-950 transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-3 text-neutral-500" />
                    Настройки
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-neutral-700 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-3 text-neutral-500" />
                    Выйти
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
