import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../redux/store'
import Layout from '../../components/layout/Layout'
import Dashboard from '../../components/dashboard/Dashboard'
import toast from 'react-hot-toast'
import axios from 'axios'
import { 
  FunnelIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

interface StaffKPI {
  id: string
  name: string
  email: string
  role: string
  role_display: string
  total_applications: number
  approved_applications: number
  rejected_applications: number
  revenue: number
  kpi: number
  commission: number
  unique_shows: number
  shows: string[]
}

interface CompanyStats {
  total_revenue: number
  total_applications: number
  approved_applications: number
  active_clients: number
  unique_shows: number
  average_deal_size: number
  approval_rate: number
}

const DirectorDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const [staffKPI, setStaffKPI] = useState<StaffKPI[]>([])
  const [companyStats, setCompanyStats] = useState<CompanyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    roleFilter: 'all',
  })

  useEffect(() => {
    if (user) {
      loadStaffKPI()
    }
  }, [user])

  const loadStaffKPI = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filters.startDate) params.start_date = filters.startDate
      if (filters.endDate) params.end_date = filters.endDate
      if (filters.roleFilter !== 'all') params.role_filter = filters.roleFilter

      const response = await axios.get('/api/director/staff-kpi', { params })
      setStaffKPI(response.data.staff_kpi || [])
      setCompanyStats(response.data.company_stats || null)
    } catch (error: any) {
      toast.error('Ошибка загрузки статистики')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = () => {
    loadStaffKPI()
  }

  const stats = [
    {
      label: 'Общий доход',
      value: `${companyStats?.total_revenue.toLocaleString('ru-RU') || 0} ₽`,
      change: 0,
      changeType: 'increase' as const,
    },
    {
      label: 'Одобренных заявок',
      value: companyStats?.approved_applications || 0,
      change: 0,
      changeType: 'increase' as const,
    },
    {
      label: 'Активных клиентов',
      value: companyStats?.active_clients || 0,
      change: 0,
      changeType: 'increase' as const,
    },
    {
      label: 'Средний чек',
      value: `${Math.round(companyStats?.average_deal_size || 0).toLocaleString('ru-RU')} ₽`,
      change: 0,
      changeType: 'increase' as const,
    },
  ]

  // Chart: Revenue by staff
  const revenueChart = {
    type: 'bar' as const,
    title: 'Доход по сотрудникам',
    data: {
      labels: staffKPI.map(s => s.name),
      datasets: [
        {
          label: 'Доход (₽)',
          data: staffKPI.map(s => s.revenue),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
        },
      ],
    },
  }

  // Chart: KPI by staff
  const kpiChart = {
    type: 'bar' as const,
    title: 'KPI сотрудников (% одобренных)',
    data: {
      labels: staffKPI.map(s => s.name),
      datasets: [
        {
          label: 'KPI (%)',
          data: staffKPI.map(s => s.kpi),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
        },
      ],
    },
  }

  const charts = [revenueChart, kpiChart]

  const getKpiBadge = (kpi: number) => {
    let color = 'bg-red-100 text-red-800'
    if (kpi >= 90) color = 'bg-green-100 text-green-800'
    else if (kpi >= 80) color = 'bg-yellow-100 text-yellow-800'

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${color}`}>
        {kpi}%
      </span>
    )
  }

  if (loading) {
    return (
      <Layout role="director">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout role="director">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            Добро пожаловать, {user?.name}!
          </h1>
          <p className="text-secondary-600">
            Панель управления директора
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">
              Фильтры
            </h3>
            <button
              onClick={handleApplyFilters}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              <FunnelIcon className="h-5 w-5" />
              <span>Применить</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Дата от
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Дата до
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Роль
              </label>
              <select
                value={filters.roleFilter}
                onChange={(e) => setFilters({ ...filters, roleFilter: e.target.value })}
                className="w-full px-3 py-2 border border-secondary-300 rounded-md"
              >
                <option value="all">Все сотрудники</option>
                <option value="agent">Агенты</option>
                <option value="commercial">Коммерческий отдел</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        <Dashboard title="Статистика компании" charts={charts} stats={stats} />

        {/* Staff KPI Table */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="px-6 py-4 border-b border-secondary-200">
            <div className="flex items-center space-x-2">
              <UserGroupIcon className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-secondary-900">
                KPI Сотрудников
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Сотрудник</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Роль</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Заявок</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Одобрено</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">KPI</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Доход</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Комиссия</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Передачи</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {staffKPI.map((staff) => (
                  <tr key={staff.id} className="hover:bg-secondary-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-secondary-900">{staff.name}</div>
                      <div className="text-sm text-secondary-500">{staff.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                      {staff.role_display}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                      {staff.total_applications}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {staff.approved_applications}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getKpiBadge(staff.kpi)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                      {staff.revenue.toLocaleString('ru-RU')} ₽
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                      {staff.commission.toLocaleString('ru-RU')} ₽
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                      {staff.unique_shows} уник.
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Company Summary */}
        {companyStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <ChartBarIcon className="h-6 w-6 text-blue-600 mt-1" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Общая статистика</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Всего заявок: {companyStats.total_applications}</li>
                    <li>• Одобрено: {companyStats.approved_applications}</li>
                    <li>• Процент одобрения: {companyStats.approval_rate}%</li>
                    <li>• Уникальных передач: {companyStats.unique_shows}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start">
                <ChartBarIcon className="h-6 w-6 text-green-600 mt-1" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Финансовые показатели</h3>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Общий доход: {companyStats.total_revenue.toLocaleString('ru-RU')} ₽</li>
                    <li>• Средний чек: {Math.round(companyStats.average_deal_size).toLocaleString('ru-RU')} ₽</li>
                    <li>• Активных клиентов: {companyStats.active_clients}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default DirectorDashboard
