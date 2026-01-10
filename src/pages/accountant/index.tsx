import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../../redux/store'
import { fetchDashboardData } from '../../redux/slices/dashboardSlice'
import { adAPI } from '../../utils/api'
import Layout from '../../components/layout/Layout'
import Dashboard from '../../components/dashboard/Dashboard'
import toast from 'react-hot-toast'
import { 
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline'

interface Application {
  id: string
  clientName: string
  clientEmail: string
  show: string
  date: string
  duration: number
  status: 'approved'
  cost: number
}

const AccountantDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const { data, loading } = useSelector((state: RootState) => state.dashboard)
  const [applications, setApplications] = useState<Application[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    if (user) {
      dispatch(fetchDashboardData('accountant'))
      loadApplications()
    }
  }, [dispatch, user])

  const loadApplications = async () => {
    setApplicationsLoading(true)
    try {
      const response = await adAPI.getApplications({ 
        status: 'approved'
      })
      setApplications(response.data)
      setCurrentPage(1) // Reset to first page when loading new data
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Ошибка загрузки заявок')
    } finally {
      setApplicationsLoading(false)
    }
  }

  const stats = [
    {
      label: 'Одобренных заявок',
      value: applications.length || 0,
      change: 8,
      changeType: 'increase' as const,
    },
    {
      label: 'Общий доход',
      value: `${applications.reduce((sum, app) => sum + app.cost, 0).toLocaleString('ru-RU')} ₽`,
      change: 15,
      changeType: 'increase' as const,
    },
  ]

  // Вычисляем доходы по месяцам из реальных заявок
  const getMonthlyRevenue = () => {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
    const currentMonth = new Date().getMonth()
    const monthlyData = new Array(12).fill(0)
    
    // Группируем заявки по месяцам
    applications.forEach(app => {
      const appMonth = new Date(app.date).getMonth()
      monthlyData[appMonth] += app.cost
    })
    
    // Берем последние 6 месяцев
    const last6Months = []
    const last6MonthsLabels = []
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12
      last6MonthsLabels.push(months[monthIndex])
      last6Months.push(monthlyData[monthIndex])
    }
    
    return { labels: last6MonthsLabels, data: last6Months }
  }

  const monthlyRevenue = getMonthlyRevenue()

  // Пагинация
  const totalPages = Math.ceil(applications.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentApplications = applications.slice(indexOfFirstItem, indexOfLastItem)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const charts = [
    {
      type: 'line' as const,
      title: 'Доходы по месяцам',
      data: {
        labels: monthlyRevenue.labels,
        datasets: [
          {
            label: 'Доход (₽)',
            data: monthlyRevenue.data,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
          },
        ],
      },
    },
  ]

  if (loading) {
    return (
      <Layout role="accountant">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout role="accountant">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Добро пожаловать, {user?.name}!
            </h1>
            <p className="text-neutral-600">
              Панель управления бухгалтера
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard - Full Width */}
      <div className="my-6">
        <Dashboard title="Финансовая статистика" charts={charts} stats={stats} />
      </div>

      <div className="space-y-6">
        {/* Applications Table */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
          <div className="p-6 border-b border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-900">
              Одобренные заявки ({applications.length})
            </h3>
          </div>

          <div className="p-6">
            {applicationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardDocumentListIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  Заявки не найдены
                </h3>
                <p className="text-neutral-600">
                  Нет заявок, соответствующих фильтрам
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Клиент
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Шоу
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Дата
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Стоимость
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {currentApplications.map((application) => (
                      <tr key={application.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-neutral-900">
                            {application.clientName}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {application.clientEmail}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {application.show}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {new Date(application.date).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                          {application.cost.toLocaleString('ru-RU')} ₽
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-neutral-200 pt-4">
                  <div className="text-sm text-neutral-600">
                    Показаны {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, applications.length)} из {applications.length} заявок
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        currentPage === 1
                          ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                          : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      Назад
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          currentPage === page
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        currentPage === totalPages
                          ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                          : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      Вперед
                    </button>
                  </div>
                </div>
              )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default AccountantDashboard
