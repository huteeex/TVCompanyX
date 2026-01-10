import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../redux/store'
import Layout from '../../components/layout/Layout'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Users,
  RefreshCw,
  CheckCircle,
  XCircle,
  TrendingUp,
  BarChart3
} from 'lucide-react'

interface UserStats {
  total_users: number
  by_role: {
    role: string
    count: number
  }[]
  active_users: number
  inactive_users: number
}

const ITAdminDashboard: React.FC = () => {
  const router = useRouter()
  const user = useSelector((s: RootState) => s.auth.user)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<UserStats | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/auth')
      return
    }
    
    if (user.role !== 'it_admin') {
      toast.error('Доступ запрещён')
      router.push('/')
      return
    }
    
    loadStats()
  }, [user])

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/user-stats', {
        credentials: 'same-origin'
      })
      
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      } else {
        toast.error('Ошибка загрузки статистики')
      }
      setLoading(false)
    } catch (error) {
      console.error('Error loading stats:', error)
      toast.error('Ошибка загрузки')
      setLoading(false)
    }
  }

  const getRoleName = (role: string) => {
    const names: { [key: string]: string } = {
      customer: 'Клиенты',
      agent: 'Агенты',
      commercial: 'Коммерческий отдел',
      director: 'Директора',
      accountant: 'Бухгалтеры',
      company: 'Компании',
      it_admin: 'IT Администраторы'
    }
    return names[role] || role
  }

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      customer: 'bg-primary-600',
      agent: 'bg-primary-500',
      commercial: 'bg-accent-500',
      director: 'bg-primary-700',
      accountant: 'bg-accent-400',
      company: 'bg-primary-400',
      it_admin: 'bg-neutral-500'
    }
    return colors[role] || 'bg-neutral-500'
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold text-neutral-900 tracking-tight">
              Панель IT Администратора
            </h1>
            <p className="mt-2 text-neutral-600">Статистика зарегистрированных пользователей</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={loadStats}
            disabled={loading}
            className="px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-soft-lg flex items-center gap-2 disabled:opacity-50 transition-all duration-300 font-medium"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </motion.button>
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <RefreshCw className="h-8 w-8 text-primary-600 animate-spin" />
              </div>
              <p className="text-neutral-600 font-medium">Загрузка статистики...</p>
            </motion.div>
          ) : stats ? (
            <motion.div
              key="content"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="group">
                  <div className="bg-white rounded-2xl shadow-soft hover:shadow-soft-lg p-6 border border-neutral-200/50 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-600 uppercase tracking-wide">
                          Всего пользователей
                        </p>
                        <p className="text-4xl font-bold text-neutral-900 mt-2 tracking-tight">
                          {stats.total_users}
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-soft">
                        <Users className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="group">
                  <div className="bg-white rounded-2xl shadow-soft hover:shadow-soft-lg p-6 border border-neutral-200/50 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-600 uppercase tracking-wide">
                          Активных
                        </p>
                        <p className="text-4xl font-bold text-neutral-900 mt-2 tracking-tight">
                          {stats.active_users}
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-accent-400 to-accent-500 rounded-xl shadow-soft">
                        <CheckCircle className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="group">
                  <div className="bg-white rounded-2xl shadow-soft hover:shadow-soft-lg p-6 border border-neutral-200/50 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-600 uppercase tracking-wide">
                          Деактивированных
                        </p>
                        <p className="text-4xl font-bold text-neutral-900 mt-2 tracking-tight">
                          {stats.inactive_users}
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-neutral-400 to-neutral-500 rounded-xl shadow-soft">
                        <XCircle className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* By Role Statistics */}
              <motion.div 
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-soft p-8 border border-neutral-200/50 mb-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-primary-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900">Распределение по ролям</h2>
                </div>
                
                <div className="space-y-5">
                  {stats.by_role
                    .sort((a, b) => b.count - a.count)
                    .map(({ role, count }, index) => {
                      const percentage = stats.total_users > 0 ? ((count / stats.total_users) * 100).toFixed(1) : '0'
                      return (
                        <motion.div 
                          key={role}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-neutral-700">
                              {getRoleName(role)}
                            </span>
                            <span className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-primary-600" />
                              {count} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-neutral-100 rounded-full h-3 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.8, delay: index * 0.05 }}
                              className={`h-3 rounded-full ${getRoleColor(role)}`}
                            />
                          </div>
                        </motion.div>
                      )
                    })}
                </div>
              </motion.div>

              {/* Table */}
              <motion.div 
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-soft overflow-hidden border border-neutral-200/50"
              >
                <div className="px-8 py-6 bg-gradient-to-r from-neutral-50 to-neutral-100/50 border-b border-neutral-200">
                  <h2 className="text-xl font-bold text-neutral-900">Детальная статистика</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-8 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                          Роль
                        </th>
                        <th className="px-8 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                          Количество
                        </th>
                        <th className="px-8 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                          Процент
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-100">
                      {stats.by_role
                        .sort((a, b) => b.count - a.count)
                        .map(({ role, count }) => {
                          const percentage = stats.total_users > 0 ? ((count / stats.total_users) * 100).toFixed(1) : '0'
                          return (
                            <motion.tr 
                              key={role}
                              whileHover={{ backgroundColor: 'rgb(249 250 251)' }}
                              className="transition-colors"
                            >
                              <td className="px-8 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${getRoleColor(role)}`} />
                                  <span className="text-sm font-medium text-neutral-900">
                                    {getRoleName(role)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-8 py-4 whitespace-nowrap text-sm text-neutral-900 font-semibold">
                                {count}
                              </td>
                              <td className="px-8 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 bg-neutral-100 rounded-full h-2 max-w-[120px]">
                                    <div
                                      className={`h-2 rounded-full ${getRoleColor(role)}`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium text-neutral-600 min-w-[50px]">
                                    {percentage}%
                                  </span>
                                </div>
                              </td>
                            </motion.tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-soft p-12 text-center border border-neutral-200/50"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-neutral-100 rounded-full mb-4">
                <Users className="h-10 w-10 text-neutral-400" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Нет данных</h3>
              <p className="text-neutral-600">Не удалось загрузить статистику пользователей</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  )
}

export default ITAdminDashboard
