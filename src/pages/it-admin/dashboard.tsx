import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../redux/store'
import Layout from '../../components/layout/Layout'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import {
  UserGroupIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

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
      customer: 'bg-blue-500',
      agent: 'bg-green-500',
      commercial: 'bg-purple-500',
      director: 'bg-red-500',
      accountant: 'bg-yellow-500',
      company: 'bg-indigo-500',
      it_admin: 'bg-gray-500'
    }
    return colors[role] || 'bg-gray-500'
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Панель IT Администратора</h1>
            <p className="mt-2 text-gray-600">Статистика зарегистрированных пользователей</p>
          </div>
          
          <button
            onClick={loadStats}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Загрузка статистики...</p>
          </div>
        ) : stats ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase">Всего пользователей</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">{stats.total_users}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <UserGroupIcon className="h-10 w-10 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase">Активных</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">{stats.active_users}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircleIcon className="h-10 w-10 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 uppercase">Деактивированных</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">{stats.inactive_users}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <XCircleIcon className="h-10 w-10 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* By Role Statistics */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Распределение по ролям</h2>
              
              <div className="space-y-4">
                {stats.by_role
                  .sort((a, b) => b.count - a.count)
                  .map(({ role, count }) => {
                    const percentage = stats.total_users > 0 ? ((count / stats.total_users) * 100).toFixed(1) : '0'
                    return (
                      <div key={role}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {getRoleName(role)}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-3 rounded-full ${getRoleColor(role)} transition-all duration-300`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Детальная статистика</h2>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Роль</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Количество</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Процент</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.by_role
                    .sort((a, b) => b.count - a.count)
                    .map(({ role, count }) => {
                      const percentage = stats.total_users > 0 ? ((count / stats.total_users) * 100).toFixed(1) : '0'
                      return (
                        <tr key={role} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full ${getRoleColor(role)}`}></div>
                              <span className="text-sm font-medium text-gray-900">
                                {getRoleName(role)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                            {count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                                <div
                                  className={`h-2 rounded-full ${getRoleColor(role)}`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет данных</h3>
            <p className="text-gray-600">Не удалось загрузить статистику пользователей</p>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default ITAdminDashboard
