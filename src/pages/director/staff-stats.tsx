import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../redux/store'
import Layout from '../../components/layout/Layout'
import toast from 'react-hot-toast'
import axios from 'axios'
import { 
  Users,
  TrendingUp,
  Target,
  Award,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  Activity,
  Tv,
  Clock,
  Mail,
  Phone
} from 'lucide-react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
  Title,
  Tooltip,
  Legend
)

interface StaffMember {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  role_display: string
  total_applications: number
  approved_applications: number
  rejected_applications: number
  pending_applications: number
  in_progress_applications: number
  revenue: number
  commission: number
  kpi: number
  avg_response_time: number
  customer_satisfaction: number
  unique_shows: number
  shows: string[]
  created_at: string
}

interface PerformanceMetrics {
  top_performer: StaffMember | null
  avg_kpi: number
  total_revenue: number
  total_commission: number
  avg_response_time: number
  total_applications: number
  approval_rate: number
}

const DirectorStaffStatsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    roleFilter: 'all',
    sortBy: 'kpi',
  })
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)

  useEffect(() => {
    if (user) {
      loadStaffStats()
    }
  }, [user])

  const loadStaffStats = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filters.startDate) params.start_date = filters.startDate
      if (filters.endDate) params.end_date = filters.endDate
      if (filters.roleFilter !== 'all') params.role_filter = filters.roleFilter

      const response = await axios.get('/api/director/staff-kpi', { params })
      
      let staff = response.data.staff_kpi || []
      
      // Sort staff
      if (filters.sortBy === 'kpi') {
        staff.sort((a: StaffMember, b: StaffMember) => b.kpi - a.kpi)
      } else if (filters.sortBy === 'revenue') {
        staff.sort((a: StaffMember, b: StaffMember) => b.revenue - a.revenue)
      } else if (filters.sortBy === 'applications') {
        staff.sort((a: StaffMember, b: StaffMember) => b.total_applications - a.total_applications)
      }

      // Mock some additional data for demonstration
      staff = staff.map((s: any) => ({
        ...s,
        pending_applications: Math.max(0, s.total_applications - s.approved_applications - s.rejected_applications),
        in_progress_applications: Math.floor(s.total_applications * 0.2),
        avg_response_time: Math.random() * 24 + 1,
        customer_satisfaction: 3 + Math.random() * 2,
      }))

      setStaffMembers(staff)
      
      // Calculate metrics
      if (staff.length > 0) {
        const topPerformer = staff.reduce((max: StaffMember, curr: StaffMember) => 
          curr.kpi > max.kpi ? curr : max
        )
        
        const avgKpi = staff.reduce((sum: number, s: StaffMember) => sum + s.kpi, 0) / staff.length
        const totalRevenue = staff.reduce((sum: number, s: StaffMember) => sum + s.revenue, 0)
        const totalCommission = staff.reduce((sum: number, s: StaffMember) => sum + s.commission, 0)
        const avgResponseTime = staff.reduce((sum: number, s: StaffMember) => sum + s.avg_response_time, 0) / staff.length
        const totalApplications = staff.reduce((sum: number, s: StaffMember) => sum + s.total_applications, 0)
        const totalApproved = staff.reduce((sum: number, s: StaffMember) => sum + s.approved_applications, 0)
        
        setMetrics({
          top_performer: topPerformer,
          avg_kpi: Math.round(avgKpi),
          total_revenue: totalRevenue,
          total_commission: totalCommission,
          avg_response_time: Math.round(avgResponseTime * 10) / 10,
          total_applications: totalApplications,
          approval_rate: totalApplications > 0 ? Math.round((totalApproved / totalApplications) * 100) : 0
        })
      }
    } catch (error: any) {
      console.error('Error loading staff stats:', error)
      toast.error('Ошибка загрузки статистики сотрудников')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = () => {
    loadStaffStats()
  }

  const handleExport = () => {
    toast.success('Экспорт статистики (в разработке)')
  }

  const kpiChartData = {
    labels: staffMembers.slice(0, 10).map(s => s.name.split(' ')[0]),
    datasets: [
      {
        label: 'KPI (%)',
        data: staffMembers.slice(0, 10).map(s => s.kpi),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  }

  const revenueChartData = {
    labels: staffMembers.slice(0, 10).map(s => s.name.split(' ')[0]),
    datasets: [
      {
        label: 'Доход (₽)',
        data: staffMembers.slice(0, 10).map(s => s.revenue),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2,
        borderRadius: 8,
      },
      {
        label: 'Комиссия (₽)',
        data: staffMembers.slice(0, 10).map(s => s.commission),
        backgroundColor: 'rgba(163, 163, 163, 0.6)',
        borderColor: 'rgb(115, 115, 115)',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  }

  const applicationChartData = {
    labels: staffMembers.slice(0, 8).map(s => s.name.split(' ')[0]),
    datasets: [
      {
        label: 'Одобрено',
        data: staffMembers.slice(0, 8).map(s => s.approved_applications),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2,
      },
      {
        label: 'Отклонено',
        data: staffMembers.slice(0, 8).map(s => s.rejected_applications),
        backgroundColor: 'rgba(163, 163, 163, 0.6)',
        borderColor: 'rgb(115, 115, 115)',
        borderWidth: 2,
      },
      {
        label: 'В работе',
        data: staffMembers.slice(0, 8).map(s => s.in_progress_applications),
        backgroundColor: 'rgba(99, 102, 241, 0.4)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: { size: 12 },
        },
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
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Статистика сотрудников
                </h1>
                <p className="text-primary-100">
                  Детальный анализ производительности команды
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
                onClick={loadStaffStats}
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
                Фильтры и сортировка
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                Роль
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

            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Сортировка
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              >
                <option value="kpi">По KPI</option>
                <option value="revenue">По доходу</option>
                <option value="applications">По заявкам</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group bg-gradient-to-br from-primary-600 to-primary-500 rounded-xl shadow-md p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-100">Средний KPI</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {metrics.avg_kpi}%
                  </p>
                  <p className="text-xs text-primary-100 mt-1">по всем сотрудникам</p>
                </div>
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Target className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-600">Общий доход</p>
                  <p className="text-2xl font-bold text-primary-600 mt-2">
                    {metrics.total_revenue.toLocaleString('ru-RU')} ₽
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">заработано командой</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 group-hover:from-primary-200 group-hover:to-primary-100 transition-all duration-300">
                  <DollarSign className="h-8 w-8 text-primary-600" />
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-600">Ср. время отклика</p>
                  <p className="text-3xl font-bold text-neutral-900 mt-2 group-hover:text-primary-600 transition-colors">
                    {metrics.avg_response_time}ч
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">на заявку</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 group-hover:from-primary-200 group-hover:to-primary-100 transition-all duration-300">
                  <Clock className="h-8 w-8 text-primary-600" />
                </div>
              </div>
            </div>

            <div className="group bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-600">Процент одобрения</p>
                  <p className="text-3xl font-bold text-neutral-900 mt-2">
                    {metrics.approval_rate}%
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">из {metrics.total_applications} заявок</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 group-hover:from-primary-200 group-hover:to-primary-100 transition-all duration-300">
                  <CheckCircle className="h-8 w-8 text-primary-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Performer Card */}
        {metrics?.top_performer && (
          <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 border-2 border-primary-300 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-primary-600 rounded-2xl">
                  <Award className="h-10 w-10 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-700">🏆 Лучший сотрудник</p>
                  <h3 className="text-2xl font-bold text-primary-900 mt-1">
                    {metrics.top_performer.name}
                  </h3>
                  <p className="text-sm text-primary-700 mt-1">{metrics.top_performer.role_display}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-primary-700">KPI</p>
                <p className="text-5xl font-bold text-primary-600">{metrics.top_performer.kpi}%</p>
                <p className="text-sm text-primary-700 mt-1">
                  Доход: {metrics.top_performer.revenue.toLocaleString('ru-RU')} ₽
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <BarChart3 className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-bold text-neutral-900">
                Сравнение KPI (топ-10)
              </h3>
            </div>
            <div className="h-64">
              <Bar data={kpiChartData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <DollarSign className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-bold text-neutral-900">
                Доход и комиссия
              </h3>
            </div>
            <div className="h-64">
              <Bar data={revenueChartData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <Activity className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-bold text-neutral-900">
                Распределение заявок по статусам
              </h3>
            </div>
            <div className="h-80">
              <Bar data={applicationChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-primary-600" />
                <h3 className="text-lg font-bold text-neutral-900">
                  Все сотрудники ({staffMembers.length})
                </h3>
              </div>
              <div className="text-sm text-neutral-600">
                Сортировка: {filters.sortBy === 'kpi' ? 'По KPI' : filters.sortBy === 'revenue' ? 'По доходу' : 'По заявкам'}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-gradient-to-r from-neutral-50 to-neutral-100/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Сотрудник</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Роль</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Заявок</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Одобрено</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">KPI</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Доход</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Комиссия</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Время отклика</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {staffMembers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50 mb-4">
                        <Users className="h-8 w-8 text-primary-400" />
                      </div>
                      <p className="text-neutral-600">Нет данных за выбранный период</p>
                    </td>
                  </tr>
                ) : (
                  staffMembers.map((staff, index) => (
                    <tr 
                      key={staff.id} 
                      className="hover:bg-primary-50/30 transition-colors duration-150 cursor-pointer"
                      onClick={() => setSelectedStaff(staff)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-primary-600">#{index + 1}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-neutral-900">{staff.name}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Mail className="h-3 w-3 text-neutral-400" />
                          <span className="text-xs text-neutral-500">{staff.email}</span>
                        </div>
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
                          <Clock className="h-4 w-4 text-neutral-400" />
                          <span className="text-sm text-neutral-600">{staff.avg_response_time.toFixed(1)}ч</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Staff Details Modal */}
        {selectedStaff && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedStaff(null)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-primary-600 to-primary-500 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{selectedStaff.name}</h3>
                      <p className="text-primary-100">{selectedStaff.role_display}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStaff(null)}
                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-3">Контактная информация</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-primary-600" />
                      <span className="text-neutral-900">{selectedStaff.email}</span>
                    </div>
                    {selectedStaff.phone && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-4 w-4 text-primary-600" />
                        <span className="text-neutral-900">{selectedStaff.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-3">Показатели эффективности</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary-50 rounded-lg p-4">
                      <p className="text-xs text-primary-700 mb-1">KPI</p>
                      <p className="text-2xl font-bold text-primary-600">{selectedStaff.kpi}%</p>
                    </div>
                    <div className="bg-neutral-50 rounded-lg p-4">
                      <p className="text-xs text-neutral-700 mb-1">Время отклика</p>
                      <p className="text-2xl font-bold text-neutral-900">{selectedStaff.avg_response_time.toFixed(1)}ч</p>
                    </div>
                    <div className="bg-neutral-50 rounded-lg p-4">
                      <p className="text-xs text-neutral-700 mb-1">Доход</p>
                      <p className="text-xl font-bold text-neutral-900">{selectedStaff.revenue.toLocaleString('ru-RU')} ₽</p>
                    </div>
                    <div className="bg-neutral-50 rounded-lg p-4">
                      <p className="text-xs text-neutral-700 mb-1">Комиссия</p>
                      <p className="text-xl font-bold text-neutral-900">{selectedStaff.commission.toLocaleString('ru-RU')} ₽</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-neutral-700 mb-3">Статистика заявок</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                      <span className="text-sm text-neutral-700">Всего заявок</span>
                      <span className="text-sm font-bold text-neutral-900">{selectedStaff.total_applications}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                      <span className="text-sm text-primary-700">Одобрено</span>
                      <span className="text-sm font-bold text-primary-600">{selectedStaff.approved_applications}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                      <span className="text-sm text-neutral-700">Отклонено</span>
                      <span className="text-sm font-bold text-neutral-900">{selectedStaff.rejected_applications}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                      <span className="text-sm text-neutral-700">В работе</span>
                      <span className="text-sm font-bold text-neutral-900">{selectedStaff.in_progress_applications}</span>
                    </div>
                  </div>
                </div>

                {selectedStaff.shows && selectedStaff.shows.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-700 mb-3">
                      Работает с передачами ({selectedStaff.unique_shows})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedStaff.shows.slice(0, 10).map((show, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full"
                        >
                          <Tv className="h-3 w-3" />
                          <span>{show}</span>
                        </span>
                      ))}
                      {selectedStaff.shows.length > 10 && (
                        <span className="inline-flex px-3 py-1.5 bg-neutral-100 text-neutral-600 text-xs font-medium rounded-full">
                          +{selectedStaff.shows.length - 10} еще
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default DirectorStaffStatsPage

