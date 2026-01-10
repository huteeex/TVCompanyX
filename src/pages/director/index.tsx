import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../redux/store'
import Layout from '../../components/layout/Layout'
import toast from 'react-hot-toast'
import axios from 'axios'
import { 
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Tv,
  UserCheck
} from 'lucide-react'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

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

  // Chart: Revenue by staff
  const revenueChartData = {
    labels: staffKPI.map(s => s.name.split(' ')[0]),
    datasets: [
      {
        label: 'Доход (₽)',
        data: staffKPI.map(s => s.revenue),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  }

  // Chart: Applications by status
  const statusChartData = {
    labels: ['Одобрено', 'Отклонено', 'В работе'],
    datasets: [
      {
        data: [
          companyStats?.approved_applications || 0,
          staffKPI.reduce((sum, s) => sum + s.rejected_applications, 0),
          staffKPI.reduce((sum, s) => sum + (s.total_applications - s.approved_applications - s.rejected_applications), 0),
        ],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(163, 163, 163, 0.6)',
          'rgba(99, 102, 241, 0.4)',
        ],
        borderColor: [
          'rgb(99, 102, 241)',
          'rgb(115, 115, 115)',
          'rgb(99, 102, 241)',
        ],
        borderWidth: 2,
      },
    ],
  }

  // Chart: KPI by staff
  const kpiChartData = {
    labels: staffKPI.map(s => s.name.split(' ')[0]),
    datasets: [
      {
        label: 'KPI (%)',
        data: staffKPI.map(s => s.kpi),
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2,
        borderRadius: 8,
        barThickness: 40,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 12,
          },
          color: '#737373',
        },
        grid: {
          color: 'rgba(99, 102, 241, 0.1)',
        },
      },
      x: {
        ticks: {
          font: {
            size: 12,
          },
          color: '#525252',
        },
        grid: {
          display: false,
        },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
    },
  }

  const getKpiBadge = (kpi: number) => {
    let color = 'bg-neutral-200 text-neutral-700'
    if (kpi >= 90) color = 'bg-primary-100 text-primary-700'
    else if (kpi >= 80) color = 'bg-primary-50 text-primary-600'

    return (
      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${color}`}>
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
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 rounded-2xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Добро пожаловать, {user?.name}!
                </h1>
                <p className="text-primary-100">
                  Панель управления директора
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => toast.success('Экспорт отчета (в разработке)')}
                className="flex items-center space-x-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 hover:scale-105"
              >
                <Download className="h-5 w-5" />
                <span className="font-medium">Экспорт</span>
              </button>
              <button
                onClick={loadStaffKPI}
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                <span className="font-medium">Обновить</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-bold text-neutral-900">
                Фильтры
              </h3>
            </div>
            <button
              onClick={handleApplyFilters}
              className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-700 hover:to-primary-600 transition-all duration-300 hover:scale-105 shadow-sm"
            >
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Применить</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Дата от
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Дата до
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Роль сотрудника
              </label>
              <select
                value={filters.roleFilter}
                onChange={(e) => setFilters({ ...filters, roleFilter: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              >
                <option value="all">Все сотрудники</option>
                <option value="agent">Агенты</option>
                <option value="commercial">Коммерческий отдел</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group bg-gradient-to-br from-primary-600 to-primary-500 rounded-xl shadow-md p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-primary-100">Общий доход</p>
                <p className="text-2xl font-bold text-white mt-2">
                  {companyStats?.total_revenue.toLocaleString('ru-RU') || 0} ₽
                </p>
                <p className="text-xs text-primary-100 mt-1">за выбранный период</p>
              </div>
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-600">Одобренных заявок</p>
                <p className="text-3xl font-bold text-primary-600 mt-2 group-hover:scale-110 transition-transform">
                  {companyStats?.approved_applications || 0}
                </p>
                <p className="text-xs text-neutral-500 mt-1">из {companyStats?.total_applications || 0} всего</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 group-hover:from-primary-200 group-hover:to-primary-100 transition-all duration-300">
                <CheckCircle className="h-8 w-8 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-600">Активных клиентов</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2 group-hover:text-primary-600 transition-colors">
                  {companyStats?.active_clients || 0}
                </p>
                <p className="text-xs text-neutral-500 mt-1">уникальных</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 group-hover:from-primary-200 group-hover:to-primary-100 transition-all duration-300">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-600">Средний чек</p>
                <p className="text-2xl font-bold text-neutral-900 mt-2">
                  {Math.round(companyStats?.average_deal_size || 0).toLocaleString('ru-RU')} ₽
                </p>
                <p className="text-xs text-neutral-500 mt-1">на заявку</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 group-hover:from-primary-200 group-hover:to-primary-100 transition-all duration-300">
                <TrendingUp className="h-8 w-8 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <BarChart3 className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-bold text-neutral-900">
                Доход по сотрудникам
              </h3>
            </div>
            <div className="h-64">
              <Bar data={revenueChartData} options={chartOptions} />
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <PieChart className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-bold text-neutral-900">
                Распределение заявок
              </h3>
            </div>
            <div className="h-64 flex items-center justify-center">
              <Doughnut data={statusChartData} options={doughnutOptions} />
            </div>
          </div>

          {/* KPI Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-bold text-neutral-900">
                KPI сотрудников (% одобренных заявок)
              </h3>
            </div>
            <div className="h-64">
              <Bar data={kpiChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Staff KPI Table */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-white">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-bold text-neutral-900">
                Детальная статистика сотрудников
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-gradient-to-r from-neutral-50 to-neutral-100/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Сотрудник</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Роль</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Заявок</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Одобрено</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">KPI</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Доход</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Комиссия</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Передачи</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {staffKPI.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50 mb-4">
                        <FileText className="h-8 w-8 text-primary-400" />
                      </div>
                      <p className="text-neutral-600">Нет данных за выбранный период</p>
                    </td>
                  </tr>
                ) : (
                  staffKPI.map((staff) => (
                    <tr key={staff.id} className="hover:bg-primary-50/30 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-neutral-900">{staff.name}</div>
                        <div className="text-xs text-neutral-500">{staff.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-700">
                          {staff.role_display}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                        {staff.total_applications}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-600">
                        {staff.approved_applications}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getKpiBadge(staff.kpi)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-neutral-900">
                        {staff.revenue.toLocaleString('ru-RU')} ₽
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                        {staff.commission.toLocaleString('ru-RU')} ₽
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Tv className="h-4 w-4 text-neutral-400" />
                          <span className="text-sm text-neutral-600">{staff.unique_shows}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Company Summary */}
        {companyStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 border border-primary-200 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-primary-100 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-primary-900 mb-3">Общая статистика</h3>
                  <ul className="text-sm text-primary-800 space-y-2">
                    <li className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Всего заявок: <strong>{companyStats.total_applications}</strong></span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Одобрено: <strong>{companyStats.approved_applications}</strong></span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>Процент одобрения: <strong>{companyStats.approval_rate}%</strong></span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Tv className="h-4 w-4" />
                      <span>Уникальных передач: <strong>{companyStats.unique_shows}</strong></span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 border border-primary-200 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-primary-100 rounded-xl">
                  <DollarSign className="h-6 w-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-primary-900 mb-3">Финансовые показатели</h3>
                  <ul className="text-sm text-primary-800 space-y-2">
                    <li className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Общий доход: <strong>{companyStats.total_revenue.toLocaleString('ru-RU')} ₽</strong></span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>Средний чек: <strong>{Math.round(companyStats.average_deal_size).toLocaleString('ru-RU')} ₽</strong></span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Активных клиентов: <strong>{companyStats.active_clients}</strong></span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <UserCheck className="h-4 w-4" />
                      <span>Доход на клиента: <strong>{Math.round(companyStats.total_revenue / Math.max(companyStats.active_clients, 1)).toLocaleString('ru-RU')} ₽</strong></span>
                    </li>
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
