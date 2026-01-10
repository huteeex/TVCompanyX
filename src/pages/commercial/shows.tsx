import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../redux/store'
import Layout from '../../components/layout/Layout'
import toast from 'react-hot-toast'
import { IMaskInput } from 'react-imask'
import { 
  Plus,
  Edit2,
  Trash2,
  Tv,
  Clock,
  DollarSign,
  Save,
  X as XIcon
} from 'lucide-react'

interface Show {
  id: string
  name: string
  show_type: string
  time_slot: string
  base_price_per_min: number
  duration_minutes: number
  description?: string
  is_active: boolean
  is_recurring?: boolean
  recurring_days?: string
  created_at: string
}

const ShowsManagementPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const [shows, setShows] = useState<Show[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingShow, setEditingShow] = useState<Show | null>(null)
  const [timeConflict, setTimeConflict] = useState<{show: string, time: string} | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    show_type: 'program',
    time_slot: '',
    base_price_per_min: '',
    duration_minutes: 60,
    description: '',
    is_active: true,
    is_recurring: false,
    recurring_days: 'daily'
  })

  useEffect(() => {
    loadShows()
  }, [])

  const loadShows = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/shows', { credentials: 'same-origin' })
      if (response.ok) {
        const data = await response.json()
        setShows(data)
      } else {
        throw new Error('Failed to load shows')
      }
    } catch (error) {
      toast.error('Ошибка загрузки списка шоу')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    let newValue: any = value
    
    if (type === 'number') {
      newValue = value === '' ? '' : parseFloat(value) || ''
    } else if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))
  }

  const openCreateModal = () => {
    setEditingShow(null)
    setFormData({
      name: '',
      show_type: 'program',
      time_slot: '',
      base_price_per_min: '',
      duration_minutes: 60,
      description: '',
      is_active: true,
      is_recurring: false,
      recurring_days: 'daily'
    })
    setIsModalOpen(true)
  }

  const openEditModal = (show: Show) => {
    setEditingShow(show)
    setFormData({
      name: show.name,
      show_type: show.show_type || 'program',
      time_slot: show.time_slot,
      base_price_per_min: show.base_price_per_min.toString(),
      duration_minutes: show.duration_minutes,
      description: show.description || '',
      is_active: show.is_active,
      is_recurring: show.is_recurring || false,
      recurring_days: show.recurring_days || 'daily'
    })
    setTimeConflict(null)
    setIsModalOpen(true)
  }

  const checkTimeConflict = async (timeSlot: string) => {
    if (!timeSlot || !timeSlot.includes('-')) {
      setTimeConflict(null)
      return
    }

    try {
      const response = await fetch('/api/shows/check-time-conflict', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          time_slot: timeSlot,
          show_id: editingShow?.id,
          is_recurring: formData.is_recurring,
          recurring_days: formData.recurring_days
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.conflict && data.conflicts && data.conflicts.length > 0) {
          const conflict = data.conflicts[0]
          setTimeConflict({
            show: conflict.name,
            time: conflict.time_slot
          })
          toast.error(`Конфликт времени: "${conflict.name}" (${conflict.time_slot})`)
        } else {
          setTimeConflict(null)
        }
      }
    } catch (error) {
      console.error('Error checking time conflict:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check for time conflict before submitting
    if (timeConflict) {
      toast.error('Исправьте конфликт времени перед сохранением')
      return
    }
    
    try {
      const url = editingShow ? `/api/shows/${editingShow.id}` : '/api/shows'
      const method = editingShow ? 'PUT' : 'POST'
      
      // Convert string values to numbers
      const submitData = {
        ...formData,
        base_price_per_min: parseFloat(formData.base_price_per_min as any) || 0,
        duration_minutes: parseInt(formData.duration_minutes as any) || 60
      }
      
      const response = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        toast.success(editingShow ? 'Шоу обновлено' : 'Шоу создано')
        setIsModalOpen(false)
        loadShows()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка сохранения шоу')
      }
    } catch (error: any) {
      toast.error(error.message || 'Ошибка сохранения шоу')
    }
  }

  const handleDelete = async (showId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это шоу?')) return
    
    try {
      const response = await fetch(`/api/shows/${showId}`, {
        method: 'DELETE',
        credentials: 'same-origin'
      })

      if (response.ok) {
        toast.success('Шоу удалено')
        loadShows()
      } else {
        throw new Error('Ошибка удаления шоу')
      }
    } catch (error) {
      toast.error('Ошибка удаления шоу')
    }
  }

  const getShowTypeText = (type: string) => {
    const types: Record<string, string> = {
      program: 'Программа',
      series: 'Сериал',
      morning: 'Утреннее шоу',
      day: 'Дневное шоу',
      evening: 'Вечернее шоу',
      news: 'Новости',
      entertainment: 'Развлекательное',
      sport: 'Спортивное',
      documentary: 'Документальное',
      children: 'Детское',
      movie: 'Кино'
    }
    return types[type] || type
  }

  const getShowTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      series: 'bg-primary-100 text-primary-800',
      morning: 'bg-primary-50 text-primary-700',
      day: 'bg-primary-100 text-primary-800',
      evening: 'bg-primary-200 text-primary-900',
      news: 'bg-neutral-100 text-neutral-800',
      entertainment: 'bg-primary-100 text-primary-800',
      sport: 'bg-primary-100 text-primary-800',
      documentary: 'bg-neutral-100 text-neutral-800',
      children: 'bg-primary-50 text-primary-700',
      movie: 'bg-primary-100 text-primary-800',
      program: 'bg-primary-100 text-primary-800'
    }
    return colors[type] || 'bg-neutral-100 text-neutral-800'
  }

  return (
    <Layout role="commercial">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 rounded-2xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Tv className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Управление шоу
                </h1>
                <p className="text-primary-100">
                  Создание и редактирование телевизионных программ
                </p>
              </div>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center space-x-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 hover:scale-105"
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">Создать шоу</span>
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-600">Всего шоу</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2 group-hover:text-primary-600 transition-colors">{shows.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 group-hover:from-primary-200 group-hover:to-primary-100 transition-all duration-300">
                <Tv className="h-8 w-8 text-primary-600" />
              </div>
            </div>
          </div>
          <div className="group bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-600">Активных</p>
                <p className="text-3xl font-bold text-primary-600 mt-2 group-hover:scale-110 transition-transform">
                  {shows.filter(s => s.is_active).length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 group-hover:from-primary-200 group-hover:to-primary-100 transition-all duration-300">
                <Clock className="h-8 w-8 text-primary-600" />
              </div>
            </div>
          </div>
          <div className="group bg-gradient-to-br from-primary-600 to-primary-500 rounded-xl shadow-md p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-primary-100">Ср. цена/мин</p>
                <p className="text-2xl font-bold text-white mt-2">
                  {shows.length > 0 
                    ? Math.round(shows.reduce((sum, s) => sum + (Number(s.base_price_per_min) || 0), 0) / shows.length).toLocaleString('ru-RU')
                    : 0} ₽
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Shows Table */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-neutral-600 font-medium">Загрузка шоу...</p>
            </div>
          ) : shows.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50 mb-4">
                <Tv className="h-8 w-8 text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Нет созданных шоу</h3>
              <p className="text-neutral-600 mb-4">Создайте первое шоу для управления расписанием</p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:from-primary-700 hover:to-primary-600 transition-all duration-300 hover:scale-105 shadow-sm"
              >
                <Plus className="h-5 w-5 mr-2" />
                Создать первое шоу
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-gradient-to-r from-neutral-50 to-neutral-100/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Название
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Тип
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Время
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Длительность
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Цена/мин
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {shows.map((show) => (
                    <tr key={show.id} className="hover:bg-primary-50/30 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{show.name}</div>
                        {show.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">{show.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getShowTypeColor(show.show_type)}`}>
                          {getShowTypeText(show.show_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {show.time_slot}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {show.duration_minutes} мин
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {show.base_price_per_min.toLocaleString('ru-RU')} ₽
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          show.is_active 
                            ? 'bg-primary-100 text-primary-700' 
                            : 'bg-neutral-100 text-neutral-700'
                        }`}>
                          {show.is_active ? 'Активно' : 'Неактивно'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(show)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200"
                            title="Редактировать"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(show.id)}
                            className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full my-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-neutral-900">
                {editingShow ? 'Редактировать шоу' : 'Создать новое шоу'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <XIcon className="h-5 w-5 text-neutral-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название шоу *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Например: Вечерние новости"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип шоу *
                  </label>
                  <select
                    name="show_type"
                    value={formData.show_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="program">Программа</option>
                    <option value="series">Сериал</option>
                    <option value="morning">Утреннее шоу</option>
                    <option value="day">Дневное шоу</option>
                    <option value="evening">Вечернее шоу</option>
                    <option value="news">Новости</option>
                    <option value="entertainment">Развлекательное</option>
                    <option value="sport">Спортивное</option>
                    <option value="documentary">Документальное</option>
                    <option value="children">Детское</option>
                    <option value="movie">Кино</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Время показа *
                  </label>
                  <IMaskInput
                    mask="HH:MM-HH:MM"
                    blocks={{
                      HH: {
                        mask: IMask.MaskedRange,
                        from: 0,
                        to: 23,
                        maxLength: 2
                      },
                      MM: {
                        mask: IMask.MaskedRange,
                        from: 0,
                        to: 59,
                        maxLength: 2
                      }
                    }}
                    lazy={false}
                    overwrite
                    value={formData.time_slot}
                    unmask={false}
                    onAccept={(value) => {
                      handleInputChange({ target: { name: 'time_slot', value } } as any);
                    }}
                    onBlur={(e: any) => checkTimeConflict(e.target.value)}
                    required
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      timeConflict 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-primary-500'
                    }`}
                    placeholder="09:00-10:00"
                  />
                  <p className="mt-1 text-xs text-gray-500">Формат: ЧЧ:ММ-ЧЧ:ММ</p>
                  {timeConflict && (
                    <p className="mt-1 text-xs text-red-600">
                      ⚠️ В это время уже идёт "{timeConflict.show}" ({timeConflict.time})
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Длительность (минуты) *
                  </label>
                  <input
                    type="number"
                    name="duration_minutes"
                    value={formData.duration_minutes}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Базовая цена за минуту (₽) *
                </label>
                <input
                  type="number"
                  name="base_price_per_min"
                  value={formData.base_price_per_min}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Краткое описание программы..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Шоу активно (доступно для размещения рекламы)
                </label>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex items-center px-6 py-2.5 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-all duration-200"
                >
                  <XIcon className="h-4 w-4 mr-2" />
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex items-center px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg hover:from-primary-700 hover:to-primary-600 transition-all duration-300 hover:scale-105 shadow-sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingShow ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default ShowsManagementPage
