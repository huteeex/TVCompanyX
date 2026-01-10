import React, { useState, useEffect } from 'react'
import { X, Tv, Calendar, Clock, DollarSign, FileText, Phone, Save } from 'lucide-react'
import toast from 'react-hot-toast'

interface Application {
  id: string
  show_name: string
  show_id?: string
  time_slot: string
  scheduled_at: string
  duration_seconds: number
  cost: number
  status: string
  description: string
  contact_phone: string
  created_at: string
  updated_at: string
  agent_id?: string
  agent_name?: string
  customer_id?: string
}

interface Show {
  id: string
  name: string
  time_slot: string
}

interface EditApplicationModalProps {
  application: Application
  onClose: () => void
  onUpdate: () => void
}

const EditApplicationModal: React.FC<EditApplicationModalProps> = ({ application, onClose, onUpdate }) => {
  const [shows, setShows] = useState<Show[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    show_id: application.show_id || '',
    scheduled_at: application.scheduled_at ? new Date(application.scheduled_at).toISOString().slice(0, 16) : '',
    duration_seconds: application.duration_seconds || 0,
    cost: application.cost || 0,
    description: application.description || '',
    contact_phone: application.contact_phone || ''
  })

  useEffect(() => {
    loadShows()
  }, [])

  const loadShows = async () => {
    try {
      const response = await fetch('/api/shows', { credentials: 'same-origin' })
      if (response.ok) {
        const data = await response.json()
        setShows(data)
      }
    } catch (error) {
      console.error('Failed to load shows:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/applications/${application.id}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          show_id: formData.show_id,
          scheduled_at: formData.scheduled_at,
          duration_seconds: Number(formData.duration_seconds),
          cost: Number(formData.cost),
          description: formData.description,
          contact_phone: formData.contact_phone
        })
      })

      if (response.ok) {
        toast.success('Заявка успешно обновлена!')
        onUpdate()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Ошибка при обновлении заявки')
      }
    } catch (error) {
      toast.error('Ошибка при обновлении заявки')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h3 className="text-xl font-bold">Редактирование заявки</h3>
            <p className="text-primary-100 text-sm">ID: #{application.id.slice(-8)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Show Selection */}
          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <label className="flex items-center text-sm font-semibold text-neutral-700 mb-2">
              <Tv className="h-4 w-4 mr-2 text-primary-600" />
              Программа *
            </label>
            <select
              value={formData.show_id}
              onChange={(e) => setFormData({ ...formData, show_id: e.target.value })}
              required
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Выберите программу</option>
              {shows.map(show => (
                <option key={show.id} value={show.id}>
                  {show.name} ({show.time_slot})
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 mt-1">Выберите программу для размещения рекламы</p>
          </div>

          {/* Scheduled Date & Time */}
          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <label className="flex items-center text-sm font-semibold text-neutral-700 mb-2">
              <Calendar className="h-4 w-4 mr-2 text-primary-600" />
              Дата и время показа *
            </label>
            <input
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              required
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-neutral-500 mt-1">Укажите точную дату и время показа рекламы</p>
          </div>

          {/* Duration & Cost */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
              <label className="flex items-center text-sm font-semibold text-neutral-700 mb-2">
                <Clock className="h-4 w-4 mr-2 text-primary-600" />
                Длительность (секунды) *
              </label>
              <input
                type="number"
                value={formData.duration_seconds}
                onChange={(e) => setFormData({ ...formData, duration_seconds: Number(e.target.value) })}
                required
                min="1"
                max="300"
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-neutral-500 mt-1">
                {formData.duration_seconds > 0 && `≈ ${Math.floor(formData.duration_seconds / 60)} мин ${formData.duration_seconds % 60} сек`}
              </p>
            </div>

            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
              <label className="flex items-center text-sm font-semibold text-neutral-700 mb-2">
                <DollarSign className="h-4 w-4 mr-2 text-primary-600" />
                Стоимость (₽) *
              </label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-neutral-500 mt-1">
                {formData.cost > 0 && `${Number(formData.cost).toLocaleString('ru-RU')} ₽`}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <label className="flex items-center text-sm font-semibold text-neutral-700 mb-2">
              <FileText className="h-4 w-4 mr-2 text-primary-600" />
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Дополнительные детали заявки..."
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-neutral-500 mt-1">{formData.description.length} символов</p>
          </div>

          {/* Contact Phone */}
          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <label className="flex items-center text-sm font-semibold text-neutral-700 mb-2">
              <Phone className="h-4 w-4 mr-2 text-primary-600" />
              Контактный телефон
            </label>
            <input
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              placeholder="+7 (900) 000 00-00"
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-neutral-500 mt-1">Телефон для связи по этой заявке</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors font-medium"
            >
              Отменить
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Сохранить изменения
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditApplicationModal
