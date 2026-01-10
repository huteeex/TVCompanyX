import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../redux/store'
import { adAPI } from '../../utils/api'
import Layout from '../../components/layout/Layout'
import toast from 'react-hot-toast'
import { 
  ClipboardList,
  CheckCircle,
  XCircle,
  RefreshCw,
  DollarSign
} from 'lucide-react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface Application {
  id: string
  customer_name?: string
  customer_first_name?: string
  customer_last_name?: string
  customer_email?: string
  show_name?: string
  scheduled_at?: string
  duration_seconds?: number
  status: string
  cost: string
  created_at: string
}

type PeriodType = 'day' | 'week' | 'month'

const CommercialDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const [allApplications, setAllApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodType>('day')

  useEffect(() => {
    if (user) {
      loadAllApplications()
    }
  }, [user])

  const loadAllApplications = async () => {
    setLoading(true)
    try {
      const response = await adAPI.getApplications()
      setAllApplications(response.data)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка загрузки заявок')
    } finally {
      setLoading(false)
    }
  }

  // Filter applications by period
  const getFilteredApplications = () => {
    const now = new Date()
    const startDate = new Date()

    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    return allApplications.filter(app => {
      const appDate = new Date(app.created_at)
      return appDate >= startDate
    })
  }

  const filteredApps = getFilteredApplications()

  // Calculate statistics
  const stats = {
    pending: filteredApps.filter(app => 
      app.status === 'sent_to_commercial' || app.status === 'in_progress'
    ).length,
    approved: filteredApps.filter(app => app.status === 'approved').length,
    rejected: filteredApps.filter(app => app.status === 'rejected').length,
    total: filteredApps.length,
    totalRevenue: filteredApps
      .filter(app => app.status === 'approved')
      .reduce((sum, app) => sum + (parseFloat(app.cost) || 0), 0),
  }

  // Applications on review (sent_to_commercial)
  const pendingApplications = allApplications.filter(app => app.status === 'sent_to_commercial')

  const handleApproveApplication = async (applicationId: string) => {
    try {
      await adAPI.updateApplication(applicationId, { status: 'approved' })
      toast.success('Заявка одобрена')
      loadAllApplications()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка одобрения заявки')
    }
  }

  const handleRejectApplication = async (applicationId: string) => {
    try {
      await adAPI.updateApplication(applicationId, { status: 'rejected' })
      toast.success('Заявка отклонена')
      loadAllApplications()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка отклонения заявки')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      pending: { color: 'bg-neutral-100 text-neutral-700', text: 'Ожидает агента' },
      in_progress: { color: 'bg-primary-100 text-primary-700', text: 'В работе' },
      sent_to_commercial: { color: 'bg-primary-200 text-primary-800', text: 'На рассмотрении' },
      approved: { color: 'bg-primary-100 text-primary-700', text: 'Одобрено' },
      rejected: { color: 'bg-neutral-200 text-neutral-700', text: 'Отклонено' },
    }

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status }
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const getPeriodLabel = () => {
    switch (period) {
      case 'day': return 'за день'
      case 'week': return 'за неделю'
      case 'month': return 'за месяц'
    }
  }

  // Chart data for status distribution
  const chartData = {
    labels: ['На рассмотрении', 'Одобрено', 'Отклонено'],
    datasets: [
      {
        label: `Количество заявок ${getPeriodLabel()}`,
        data: [stats.pending, stats.approved, stats.rejected],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(99, 102, 241, 0.6)',
          'rgba(163, 163, 163, 0.5)',
        ],
        borderColor: [
          'rgb(99, 102, 241)',
          'rgb(99, 102, 241)',
          'rgb(115, 115, 115)',
        ],
        borderWidth: 2,
        borderRadius: 8,
        barThickness: 60,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2.5,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Статусы заявок ${getPeriodLabel()}`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: '#4338ca',
        padding: {
          bottom: 24,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 13,
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
            size: 13,
            weight: 500,
          },
          color: '#525252',
        },
        grid: {
          display: false,
        },
      },
    },
  }

  if (loading) {
    return (
      <Layout role="commercial">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout role="commercial">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 rounded-2xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Добро пожаловать, {user?.name}!
              </h1>
              <p className="text-primary-100">
                Панель управления коммерческого отдела
              </p>
            </div>
            <button
              onClick={loadAllApplications}
              className="flex items-center space-x-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 hover:scale-105"
            >
              <RefreshCw className="h-5 w-5" />
              <span className="font-medium">Обновить</span>
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-semibold text-neutral-700">Период статистики:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setPeriod('day')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  period === 'day'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-200'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:scale-105'
                }`}
              >
                День
              </button>
              <button
                onClick={() => setPeriod('week')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  period === 'week'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-200'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:scale-105'
                }`}
              >
                Неделя
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  period === 'month'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-200'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:scale-105'
                }`}
              >
                Месяц
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-600">Заявок на рассмотрении</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2 group-hover:text-primary-600 transition-colors">{stats.pending}</p>
                <p className="text-xs text-neutral-500 mt-1">{getPeriodLabel()}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 group-hover:from-primary-200 group-hover:to-primary-100 transition-all duration-300">
                <ClipboardList className="h-8 w-8 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-600">Одобрено</p>
                <p className="text-3xl font-bold text-primary-600 mt-2 group-hover:scale-110 transition-transform">{stats.approved}</p>
                <p className="text-xs text-neutral-500 mt-1">{getPeriodLabel()}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 group-hover:from-primary-200 group-hover:to-primary-100 transition-all duration-300">
                <CheckCircle className="h-8 w-8 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-lg hover:border-neutral-300 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-600">Отклонено</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.rejected}</p>
                <p className="text-xs text-neutral-500 mt-1">{getPeriodLabel()}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-50 group-hover:from-neutral-200 group-hover:to-neutral-100 transition-all duration-300">
                <XCircle className="h-8 w-8 text-neutral-500" />
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-primary-600 to-primary-500 rounded-xl shadow-md p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-primary-100">Общий доход</p>
                <p className="text-2xl font-bold text-white mt-2">
                  {stats.totalRevenue.toLocaleString('ru-RU')} ₽
                </p>
                <p className="text-xs text-primary-100 mt-1">{getPeriodLabel()}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
          <div className="max-w-4xl mx-auto">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Pending Applications Table */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-white">
            <h3 className="text-lg font-bold text-neutral-900">
              Заявки на рассмотрении
              <span className="ml-2 inline-flex items-center justify-center px-3 py-1 text-sm font-semibold text-primary-600 bg-primary-100 rounded-full">
                {pendingApplications.length}
              </span>
            </h3>
          </div>

          <div className="p-6">
            {pendingApplications.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50 mb-4">
                  <ClipboardList className="h-8 w-8 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Заявки не найдены
                </h3>
                <p className="text-neutral-600">
                  Нет заявок на рассмотрение
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-gradient-to-r from-neutral-50 to-neutral-100/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Клиент
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Шоу
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Дата размещения
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Длительность
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Стоимость
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {pendingApplications.map((application) => (
                      <tr key={application.id} className="hover:bg-primary-50/30 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                          {application.customer_name || 
                           `${application.customer_first_name || ''} ${application.customer_last_name || ''}`.trim() ||
                           application.customer_email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {application.show_name || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {application.scheduled_at 
                            ? new Date(application.scheduled_at).toLocaleDateString('ru-RU')
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {application.duration_seconds 
                            ? `${Math.floor(application.duration_seconds / 60)} мин ${application.duration_seconds % 60} сек`
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                          {(parseFloat(application.cost) || 0).toLocaleString('ru-RU')} ₽
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleApproveApplication(application.id)}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-700 hover:to-primary-600 transition-all duration-300 hover:scale-105 shadow-sm"
                            title="Одобрить"
                          >
                            <CheckCircle className="h-4 w-4 mr-1.5" />
                            Одобрить
                          </button>
                          <button
                            onClick={() => handleRejectApplication(application.id)}
                            className="inline-flex items-center px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-all duration-300 hover:scale-105"
                            title="Отклонить"
                          >
                            <XCircle className="h-4 w-4 mr-1.5" />
                            Отклонить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default CommercialDashboard
