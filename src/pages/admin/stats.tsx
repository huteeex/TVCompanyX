import React, { useState, useEffect, useCallback } from 'react'
import Layout from '../../components/layout/Layout'
import Dashboard from '../../components/dashboard/Dashboard'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { ArrowPathIcon, UsersIcon, DocumentTextIcon, CurrencyDollarIcon, TvIcon } from '@heroicons/react/24/outline'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  in_progress: 'В работе',
  sent_to_commercial: 'У коммерческого',
  approved: 'Одобрена',
  rejected: 'Отклонена',
  paid: 'Оплачена',
  overdue: 'Просрочена',
}

const ROLE_LABELS: Record<string, string> = {
  customer: 'Заказчики',
  agent: 'Агенты',
  commercial: 'Коммерческий',
  accountant: 'Бухгалтеры',
  admin: 'Администраторы',
  it_admin: 'ИТ-Администраторы',
  director: 'Директора',
}

const AdminStatsPage: React.FC = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/stats')
      setData(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ошибка загрузки статистики')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  if (loading || !data) {
    return (
      <Layout role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      </Layout>
    )
  }

  const { users, applications, revenue, shows } = data

  // Stats cards
  const stats = [
    {
      label: 'Всего пользователей',
      value: users.total,
      change: 0,
      changeType: 'increase' as const,
    },
    {
      label: 'Активных пользователей',
      value: users.active,
      change: 0,
      changeType: 'increase' as const,
    },
    {
      label: 'Всего заявок',
      value: applications.byStatus.reduce((s: number, r: any) => s + r.count, 0),
      change: 0,
      changeType: 'increase' as const,
    },
    {
      label: 'Выручка (оплачено)',
      value: `${Number(revenue.total).toLocaleString('ru-RU')} ₽`,
      change: 0,
      changeType: 'increase' as const,
    },
  ]

  // Charts
  const roleLabels = users.byRole.map((r: any) => ROLE_LABELS[r.role] ?? r.role)
  const roleCounts = users.byRole.map((r: any) => r.count)

  const statusLabels = applications.byStatus.map((r: any) => STATUS_LABELS[r.status] ?? r.status)
  const statusCounts = applications.byStatus.map((r: any) => r.count)

  const monthLabels = applications.byMonth.map((r: any) => r.month)
  const monthCounts = applications.byMonth.map((r: any) => r.count)

  const revMonthLabels = revenue.byMonth.map((r: any) => r.month)
  const revMonthValues = revenue.byMonth.map((r: any) => Number(r.revenue))

  const charts = [
    {
      type: 'doughnut' as const,
      title: 'Пользователи по ролям',
      data: {
        labels: roleLabels,
        datasets: [
          {
            label: 'Пользователи',
            data: roleCounts,
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(139, 92, 246, 0.8)',
              'rgba(249, 115, 22, 0.8)',
              'rgba(234, 179, 8, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(20, 184, 166, 0.8)',
            ],
          },
        ],
      },
    },
    {
      type: 'bar' as const,
      title: 'Заявки по статусам',
      data: {
        labels: statusLabels,
        datasets: [
          {
            label: 'Количество',
            data: statusCounts,
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
          },
        ],
      },
    },
    {
      type: 'line' as const,
      title: 'Заявки по месяцам (последние 6 мес.)',
      data: {
        labels: monthLabels.length ? monthLabels : ['Нет данных'],
        datasets: [
          {
            label: 'Заявок',
            data: monthCounts.length ? monthCounts : [0],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
          },
        ],
      },
    },
    {
      type: 'bar' as const,
      title: 'Выручка по месяцам (₽)',
      data: {
        labels: revMonthLabels.length ? revMonthLabels : ['Нет данных'],
        datasets: [
          {
            label: 'Выручка ₽',
            data: revMonthValues.length ? revMonthValues : [0],
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
          },
        ],
      },
    },
  ]

  return (
    <Layout role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Системная статистика</h1>
            <p className="text-secondary-600">Аналитика использования системы</p>
          </div>
          <button
            onClick={loadStats}
            className="flex items-center gap-2 px-3 py-2 border border-secondary-300 rounded-md text-secondary-700 hover:bg-secondary-50"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Обновить
          </button>
        </div>

        {/* Extra info cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><UsersIcon className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-secondary-500">Новых за 30 дней</p>
              <p className="text-xl font-bold text-secondary-900">{users.newLast30Days}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg"><UsersIcon className="h-5 w-5 text-red-600" /></div>
            <div>
              <p className="text-xs text-secondary-500">Неактивных</p>
              <p className="text-xl font-bold text-secondary-900">{users.total - users.active}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><TvIcon className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-secondary-500">Шоу в системе</p>
              <p className="text-xl font-bold text-secondary-900">{shows.total}</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg"><DocumentTextIcon className="h-5 w-5 text-yellow-600" /></div>
            <div>
              <p className="text-xs text-secondary-500">Одобренных заявок</p>
              <p className="text-xl font-bold text-secondary-900">
                {applications.byStatus.find((r: any) => r.status === 'approved')?.count ?? 0}
              </p>
            </div>
          </div>
        </div>

        <Dashboard title="" charts={charts} stats={stats} />
      </div>
    </Layout>
  )
}

export default AdminStatsPage


