import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../redux/store'
import Layout from '../../components/layout/Layout'
import toast from 'react-hot-toast'
import axios from 'axios'
import { 
  Building2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  CheckCircle,
  Clock,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Tv,
  Activity,
  Target
} from 'lucide-react'
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2'
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
  Filler
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
  Legend,
  Filler
)

interface CompanyMetrics {
  total_revenue: number
  revenue_growth: number
  total_applications: number
  applications_growth: number
  approved_applications: number
  approval_rate: number
  active_clients: number
  clients_growth: number
  unique_shows: number
  average_deal_size: number
  avg_response_time: number
  customer_satisfaction: number
}

interface RevenueByMonth {
  month: string
  revenue: number
  applications: number
}

interface ShowPerformance {
  show_name: string
  applications: number
  revenue: number
  avg_cost: number
}

const DirectorCompanyStatsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const [metrics, setMetrics] = useState<CompanyMetrics | null>(null)
  const [revenueByMonth, setRevenueByMonth] = useState<RevenueByMonth[]>([])
  const [topShows, setTopShows] = useState<ShowPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    period: '6m', // 1m, 3m, 6m, 1y
  })

  useEffect(() => {
    if (user) {
      loadCompanyStats()
    }
  }, [user])

  const loadCompanyStats = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filters.startDate) params.start_date = filters.startDate
      if (filters.endDate) params.end_date = filters.endDate

      const response = await axios.get('/api/director/staff-kpi', { params })
      const statsData = response.data.company_stats
      const staffData = response.data.staff_kpi || []

      // Calculate comprehensive metrics
      const totalApps = statsData?.total_applications || 0
      const approvedApps = statsData?.approved_applications || 0
      
      const companyMetrics: CompanyMetrics = {
        total_revenue: statsData?.total_revenue || 0,
        revenue_growth: 12.5, // Mock growth %
        total_applications: totalApps,
        applications_growth: 8.3,
        approved_applications: approvedApps,
        approval_rate: statsData?.approval_rate || 0,
        active_clients: statsData?.active_clients || 0,
        clients_growth: 15.2,
        unique_shows: statsData?.unique_shows || 0,
        average_deal_size: statsData?.average_deal_size || 0,
        avg_response_time: 4.2,
        customer_satisfaction: 4.5,
      }
      setMetrics(companyMetrics)

      // Mock revenue by month data
      const months = ['Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
      const mockRevenue: RevenueByMonth[] = months.map((month, idx) => ({
        month,
        revenue: Math.floor(companyMetrics.total_revenue / 6) * (0.8 + Math.random() * 0.4),
        applications: Math.floor(totalApps / 6) * (0.8 + Math.random() * 0.4),
      }))
      setRevenueByMonth(mockRevenue)

      // Get top shows from staff data
      const showsMap = new Map<string, { apps: number; revenue: number }>()
      staffData.forEach((staff: any) => {
        if (staff.shows && Array.isArray(staff.shows)) {
          staff.shows.forEach((show: string) => {
            const current = showsMap.get(show) || { apps: 0, revenue: 0 }
            showsMap.set(show, {
              apps: current.apps + Math.floor(staff.total_applications / Math.max(staff.shows.length, 1)),
              revenue: current.revenue + Math.floor(staff.revenue / Math.max(staff.shows.length, 1)),
            })
          })
        }
      })

      const showsPerf: ShowPerformance[] = Array.from(showsMap.entries())
        .map(([name, data]) => ({
          show_name: name,
          applications: data.apps,
          revenue: data.revenue,
          avg_cost: data.apps > 0 ? Math.floor(data.revenue / data.apps) : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
      
      setTopShows(showsPerf)
    } catch (error: any) {
      console.error('Error loading company stats:', error)
      toast.error('Ошибка загрузки статистики компании')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = () => {
    loadCompanyStats()
  }

  const handleExport = () => {
    toast.success('Экспорт статистики (в разработке)')
  }

  // Chart: Revenue Trend
  const revenueTrendData = {
    labels: revenueByMonth.map(m => m.month),
    datasets: [
      {
        label: 'Доход (₽)',
        data: revenueByMonth.map(m => m.revenue),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: 'rgb(99, 102, 241)',
      },
    ],
  }

  // Chart: Applications Trend
  const applicationsTrendData = {
    labels: revenueByMonth.map(m => m.month),
    datasets: [
      {
        label: 'Заявки',
        data: revenueByMonth.map(m => m.applications),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  }

  // Chart: Application Status
  const statusData = {
    labels: ['Одобрено', 'В работе', 'Отклонено'],
    datasets: [
      {
        data: [
          metrics?.approved_applications || 0,
          Math.floor((metrics?.total_applications || 0) * 0.2),
          Math.floor((metrics?.total_applications || 0) * 0.1),
        ],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(99, 102, 241, 0.4)',
          'rgba(163, 163, 163, 0.6)',
        ],
        borderColor: [
          'rgb(99, 102, 241)',
          'rgb(99, 102, 241)',
          'rgb(115, 115, 115)',
        ],
        borderWidth: 2,
      },
    ],
  }

  // Chart: Top Shows
  const topShowsData = {
    labels: topShows.slice(0, 8).map(s => s.show_name.length > 15 ? s.show_name.substring(0, 15) + '...' : s.show_name),
    datasets: [
      {
        label: 'Доход (₽)',
        data: topShows.slice(0, 8).map(s => s.revenue),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  }

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: { size: 12 },
          color: '#737373',
        },
        grid: {
          color: 'rgba(99, 102, 241, 0.1)',
        },
      },
      x: {
        ticks: {
          font: { size: 12 },
          color: '#525252',
        },
        grid: {
          display: false,
        },
      },
    },
  }

  const barChartOptions = {
    ...lineChartOptions,
    plugins: {
      legend: {
        display: false,
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
          font: { size: 12 },
        },
      },
    },
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
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Статистика компании
                </h1>
                <p className="text-primary-100">
                  Общие показатели и динамика бизнеса
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 hover:scale-105"
              >
                <Download className="h-5 w-5" />
                <span className="font-medium">Экспорт</span>
              </button>
              <button
                onClick={loadCompanyStats}
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
                Период анализа
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
                Быстрый выбор
              </label>
              <select
                value={filters.period}
                onChange={(e) => setFilters({ ...filters, period: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              >
                <option value="1m">Последний месяц</option>
                <option value="3m">Последние 3 месяца</option>
                <option value="6m">Последние 6 месяцев</option>
                <option value="1y">Последний год</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group bg-gradient-to-br from-primary-600 to-primary-500 rounded-xl shadow-md p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <div className="flex items-center space-x-1 text-white">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">{metrics.revenue_growth}%</span>
                </div>
              </div>
              <p className="text-sm font-medium text-primary-100">Общий доход</p>
              <p className="text-3xl font-bold text-white mt-2">
                {metrics.total_revenue.toLocaleString('ru-RU')} ₽
              </p>
            </div>

            <div className="group bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50">
                  <FileText className="h-8 w-8 text-primary-600" />
                </div>
                <div className="flex items-center space-x-1 text-primary-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">{metrics.applications_growth}%</span>
                </div>
              </div>
              <p className="text-sm font-medium text-neutral-600">Всего заявок</p>
              <p className="text-3xl font-bold text-neutral-900 mt-2">
                {metrics.total_applications}
              </p>
            </div>

            <div className="group bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50">
                  <Users className="h-8 w-8 text-primary-600" />
                </div>
                <div className="flex items-center space-x-1 text-primary-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">{metrics.clients_growth}%</span>
                </div>
              </div>
              <p className="text-sm font-medium text-neutral-600">Активных клиентов</p>
              <p className="text-3xl font-bold text-neutral-900 mt-2">
                {metrics.active_clients}
              </p>
            </div>

            <div className="group bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50">
                  <Target className="h-8 w-8 text-primary-600" />
                </div>
                <div className="text-sm font-medium text-primary-600">
                  {metrics.approval_rate}%
                </div>
              </div>
              <p className="text-sm font-medium text-neutral-600">Средний чек</p>
              <p className="text-2xl font-bold text-neutral-900 mt-2">
                {Math.round(metrics.average_deal_size).toLocaleString('ru-RU')} ₽
              </p>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-bold text-neutral-900">
                Динамика дохода
              </h3>
            </div>
            <div className="h-64">
              <Line data={revenueTrendData} options={lineChartOptions} />
            </div>
          </div>

          {/* Applications Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Activity className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-bold text-neutral-900">
                Динамика заявок
              </h3>
            </div>
            <div className="h-64">
              <Bar data={applicationsTrendData} options={barChartOptions} />
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <PieChart className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-bold text-neutral-900">
                Статусы заявок
              </h3>
            </div>
            <div className="h-64 flex items-center justify-center">
              <Doughnut data={statusData} options={doughnutOptions} />
            </div>
          </div>

          {/* Top Shows */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Tv className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-bold text-neutral-900">
                Топ передач по доходу
              </h3>
            </div>
            <div className="h-64">
              <Bar data={topShowsData} options={barChartOptions} />
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 border border-primary-200 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-primary-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-primary-600" />
              </div>
              <h4 className="text-sm font-semibold text-primary-900">Процент одобрения</h4>
            </div>
            <p className="text-4xl font-bold text-primary-600">{metrics?.approval_rate}%</p>
            <p className="text-sm text-primary-700 mt-2">
              {metrics?.approved_applications} из {metrics?.total_applications} заявок
            </p>
          </div>

          <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 border border-primary-200 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Clock className="h-6 w-6 text-primary-600" />
              </div>
              <h4 className="text-sm font-semibold text-primary-900">Ср. время обработки</h4>
            </div>
            <p className="text-4xl font-bold text-primary-600">{metrics?.avg_response_time}ч</p>
            <p className="text-sm text-primary-700 mt-2">на заявку</p>
          </div>

          <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 border border-primary-200 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Tv className="h-6 w-6 text-primary-600" />
              </div>
              <h4 className="text-sm font-semibold text-primary-900">Уникальных передач</h4>
            </div>
            <p className="text-4xl font-bold text-primary-600">{metrics?.unique_shows}</p>
            <p className="text-sm text-primary-700 mt-2">в активной ротации</p>
          </div>
        </div>

        {/* Top Shows Table */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-white">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-bold text-neutral-900">
                Детальная статистика по передачам
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-gradient-to-r from-neutral-50 to-neutral-100/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Передача</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Заявок</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Доход</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Ср. стоимость</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {topShows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50 mb-4">
                        <Tv className="h-8 w-8 text-primary-400" />
                      </div>
                      <p className="text-neutral-600">Нет данных о передачах</p>
                    </td>
                  </tr>
                ) : (
                  topShows.map((show, index) => (
                    <tr key={index} className="hover:bg-primary-50/30 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-primary-600">#{index + 1}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Tv className="h-4 w-4 text-neutral-400" />
                          <span className="text-sm font-semibold text-neutral-900">{show.show_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                        {show.applications}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-600">
                        {show.revenue.toLocaleString('ru-RU')} ₽
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                        {show.avg_cost.toLocaleString('ru-RU')} ₽
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default DirectorCompanyStatsPage

