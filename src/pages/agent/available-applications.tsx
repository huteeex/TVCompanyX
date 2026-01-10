import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/layout/Layout'
import { useSelector } from 'react-redux'
import { RootState } from '../../redux/store'
import toast from 'react-hot-toast'
import { ClipboardList, Calendar, Clock, DollarSign, UserPlus, Eye, RefreshCw } from 'lucide-react'

const AvailableApplicationsPage: React.FC = () => {
  const router = useRouter()
  const user = useSelector((s: RootState) => s.auth.user)
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [takingApplication, setTakingApplication] = useState<string | null>(null)

  const loadApplications = async () => {
    setLoading(true)
    try {
      // Load only pending applications (not assigned to any agent)
      const response = await fetch('/api/applications?status=pending', {
        credentials: 'same-origin'
      })
      const data = await response.json()
      
      // Filter out applications that are not assigned yet
      const pendingApps = data.filter((app: any) => !app.agent_id)
      setApplications(pendingApps)
    } catch (error) {
      console.error('Failed to load applications:', error)
      toast.error('Ошибка загрузки заявок')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [])

  const handleTakeApplication = async (applicationId: string) => {
    setTakingApplication(applicationId)
    try {
      const response = await fetch(`/api/applications/${applicationId}/assign`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка при взятии заявки')
      }

      toast.success('Заявка взята в работу')
      
      // Reload applications
      await loadApplications()
      
      // Redirect to chat with this application
      router.push(`/agent/chat?room=application-${applicationId}`)
    } catch (error: any) {
      console.error('Failed to take application:', error)
      toast.error(error.message || 'Ошибка при взятии заявки')
    } finally {
      setTakingApplication(null)
    }
  }

  const handleViewDetails = (applicationId: string) => {
    // Open in new tab or navigate to details
    router.push(`/agent/applications?id=${applicationId}`)
  }

  if (loading) {
    return (
      <Layout role="agent">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout role="agent">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 rounded-2xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <ClipboardList className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Доступные заявки
                </h1>
                <p className="text-primary-100">
                  Выберите заявку для работы
                </p>
              </div>
            </div>
            <button
              onClick={loadApplications}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 hover:scale-105 disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              <span className="font-medium">Обновить</span>
            </button>
          </div>
        </div>

        {/* Applications Grid */}
        {applications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50 mb-4">
              <ClipboardList className="h-8 w-8 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Нет доступных заявок
            </h3>
            <p className="text-neutral-600">
              Все заявки уже взяты в работу другими агентами
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applications.map((app) => (
              <div
                key={app.id}
                className="group bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-300"
              >
                <div className="space-y-4">
                  {/* Application ID */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-500 uppercase">
                      Заявка
                    </span>
                    <span className="px-3 py-1 text-xs font-semibold bg-neutral-100 text-neutral-700 rounded-full">
                      #{app.id.slice(-8)}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div>
                    <div className="text-sm font-medium text-neutral-600 mb-1">Клиент</div>
                    <div className="text-lg font-bold text-neutral-900">
                      {app.customer_name || app.customerName || 'Без имени'}
                    </div>
                    {app.customer_email && (
                      <div className="text-sm text-neutral-600">{app.customer_email}</div>
                    )}
                  </div>

                  {/* Show Info */}
                  <div className="flex items-center space-x-2 text-sm text-neutral-700">
                    <Clock className="h-4 w-4 text-primary-600" />
                    <span className="font-medium">{app.show_name || app.show || 'Шоу не указано'}</span>
                  </div>

                  {/* Schedule Info */}
                  {app.scheduled_at && (
                    <div className="flex items-center space-x-2 text-sm text-neutral-700">
                      <Calendar className="h-4 w-4 text-primary-600" />
                      <span>
                        {new Date(app.scheduled_at).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}

                  {/* Cost */}
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-primary-600" />
                    <span className="text-lg font-bold text-primary-600">
                      {app.cost ? `${app.cost.toLocaleString('ru-RU')} ₽` : 'Не рассчитана'}
                    </span>
                  </div>

                  {/* Duration */}
                  {app.duration_seconds && (
                    <div className="text-sm text-neutral-600">
                      Длительность: {Math.floor(app.duration_seconds / 60)} мин {app.duration_seconds % 60} сек
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-neutral-200">
                    <button
                      onClick={() => handleViewDetails(app.id)}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-all duration-200"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Просмотр
                    </button>
                    <button
                      onClick={() => handleTakeApplication(app.id)}
                      disabled={takingApplication === app.id}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-700 hover:to-primary-600 transition-all duration-300 hover:scale-105 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {takingApplication === app.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Беру...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Взять
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default AvailableApplicationsPage
