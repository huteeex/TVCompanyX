import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/layout/Layout'
import toast from 'react-hot-toast'
import { DocumentTextIcon, CalendarIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { formatPhoneRu, normalizePhoneForServer } from '../../utils/format'

interface Show {
  id: string
  name: string
  base_price_per_min: number
  time_slot: string
  scheduled_date: string
  duration_minutes: number
  ad_minutes: number
  available_slots: number
}

interface ApplicationFormData {
  selectedDate: string
  showId: string
  durationSeconds: number
  description: string
  contactPhone: string
}

const ApplicationPage: React.FC = () => {
  const router = useRouter()
  const [shows, setShows] = useState<Show[]>([])
  const [loading, setLoading] = useState(false)
  const [showsLoading, setShowsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ApplicationFormData>({
    selectedDate: '',
    showId: '',
    durationSeconds: 30,
    description: '',
    contactPhone: ''
  })
  const [profilePhone, setProfilePhone] = useState<string | null>(null)
  const [useProfilePhone, setUseProfilePhone] = useState(false)
  const [bankMissingAlert, setBankMissingAlert] = useState<string | null>(null)
  const [hasBankDetails, setHasBankDetails] = useState<boolean>(true)
  const [userNameParts, setUserNameParts] = useState<{ first_name?: string; middle_name?: string; last_name?: string; name?: string } | null>(null)

  // Pre-fill form from URL parameters
  useEffect(() => {
    if (router.isReady) {
      const { seconds, showId, cost, date, time } = router.query
      
      if (date && seconds && showId) {
        // Full data from calculator
        setFormData(prev => ({
          ...prev,
          selectedDate: date as string,
          durationSeconds: parseInt(seconds as string),
          showId: showId as string
        }))
        
        // Load shows for the selected date
        loadShowsForDate(date as string)
        setCurrentStep(3) // Skip to step 3 if coming from calculator
      } else if (seconds && showId) {
        // Partial data (old format)
        setFormData(prev => ({
          ...prev,
          durationSeconds: parseInt(seconds as string),
          showId: showId as string
        }))
        setCurrentStep(1) // Start from step 1
      }
    }
  }, [router.isReady, router.query])

  // Load user profile for phone prefill
  useEffect(() => {
    let mounted = true
    const loadProfile = async () => {
      try {
        const resp = await fetch('/api/auth/me', { credentials: 'same-origin' })
        if (!resp.ok) return
        const body = await resp.json()
        if (!mounted) return
        setUserNameParts({ first_name: body.first_name, middle_name: body.middle_name, last_name: body.last_name, name: body.name })
        setProfilePhone(body.phone || null)
        const hasBank = body.bank_details && (typeof body.bank_details === 'object' ? Object.keys(body.bank_details).length > 0 : !!body.bank_details)
        setHasBankDetails(hasBank)
        if (!hasBank) {
          setBankMissingAlert('Перед подачей заявки заполните реквизиты банковской карты в профиле. Заявка будет доступна после заполнения.')
        } else {
          setBankMissingAlert(null)
        }
        if (body.phone) {
          setFormData(prev => ({ ...prev, contactPhone: prev.contactPhone || formatPhoneRu(body.phone) }))
        }
      } catch (e) {
        // ignore
      }
    }
    loadProfile()
    return () => { mounted = false }
  }, [])

  // Load shows for selected date
  const loadShowsForDate = async (date: string) => {
    if (!date) return
    
    setShowsLoading(true)
    try {
      const response = await fetch(`/api/schedule/by-date?date=${date}`)
      if (response.ok) {
        const showsData = await response.json()
        
        // Filter out shows that have already passed
        const now = new Date()
        const filteredShows = showsData.filter((show: Show) => {
          const startTime = show.time_slot.split('-')[0]
          const showDateTime = new Date(`${date}T${startTime}:00`)
          return showDateTime > now
        })
        
        setShows(filteredShows)
        if (filteredShows.length === 0 && showsData.length > 0) {
          toast.error('На выбранную дату все шоу уже прошли. Выберите другую дату.')
        } else if (filteredShows.length === 0) {
          toast.error('На выбранную дату нет запланированных шоу')
        }
      } else {
        throw new Error('Failed to load shows for date')
      }
    } catch (error) {
      toast.error('Ошибка загрузки шоу на выбранную дату')
      setShows([])
    } finally {
      setShowsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    let newValue: any = value
    if (name === 'durationSeconds') newValue = parseInt(value) || 0
    if (name === 'contactPhone') newValue = formatPhoneRu(value)
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value
    setFormData(prev => ({
      ...prev,
      selectedDate: date,
      showId: '' // Reset show selection when date changes
    }))
    
    if (date) {
      loadShowsForDate(date)
      setCurrentStep(2)
    }
  }

  const handleShowSelect = (showId: string) => {
    setFormData(prev => ({
      ...prev,
      showId
    }))
    setCurrentStep(3)
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if user has bank details
    if (!hasBankDetails) {
      toast.error('Для подачи заявки необходимо добавить банковскую карту в профиле')
      router.push('/customer/profile')
      return
    }
    
    if (!formData.showId || !formData.selectedDate || !formData.durationSeconds || !formData.contactPhone) {
      toast.error('Заполните все обязательные поля')
      return
    }

    setLoading(true)
    try {
      // Create scheduled_at by combining selected date with show time
      const selectedShow = shows.find(s => s.id === formData.showId)
      if (!selectedShow) {
        throw new Error('Выбранное шоу не найдено')
      }

      // Parse time slot (e.g., "19:00-20:00") to get start time
      const startTime = selectedShow.time_slot.split('-')[0]
      const scheduledAt = `${formData.selectedDate}T${startTime}:00`

      // Validate that scheduled time is in the future
      const scheduledDate = new Date(scheduledAt)
      const now = new Date()
      if (scheduledDate <= now) {
        toast.error('Невозможно подать заявку на прошедшее время. Выберите другую дату или шоу.')
        setLoading(false)
        return
      }

      const response = await fetch('/api/applications', {
        method: 'POST',
        // ensure HttpOnly cookie (session token) is sent
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        // do not send customer_id from client for normal customers — server assigns it from the authenticated token
        body: JSON.stringify({
          show_id: formData.showId,
          scheduled_at: scheduledAt,
          duration_seconds: formData.durationSeconds,
          description: formData.description,
          contact_phone: normalizePhoneForServer(formData.contactPhone)
        })
      })

      if (response.ok) {
        const application = await response.json()
        toast.success('Заявка успешно подана!')
        router.push('/customer/applications')
      } else {
        const error = await response.json()
        // If bank details missing, guide user to profile to add them
        if (error && error.error && error.error.toString().toLowerCase().includes('bank')) {
          toast.error(error.error)
          router.push('/customer/profile')
          return
        }
        throw new Error(error.error || 'Ошибка подачи заявки')
      }
    } catch (error: any) {
      toast.error(error.message || 'Ошибка подачи заявки')
    } finally {
      setLoading(false)
    }
  }

  const selectedShow = shows.find(show => show.id === formData.showId)

  return (
    <Layout role="customer">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <DocumentTextIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-neutral-900 truncate">
              Подача заявки на рекламу
            </h1>
            <p className="text-xs sm:text-base text-neutral-600 hidden sm:block">
              Пошаговая подача заявки на размещение рекламы
            </p>
          </div>
        </div>

        {/* Bank Details Missing Alert */}
        {bankMissingAlert && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-2 sm:ml-3 flex-1">
                <p className="text-xs sm:text-sm font-medium text-red-800">
                  {bankMissingAlert}
                </p>
                <button
                  onClick={() => router.push('/customer/profile')}
                  className="mt-2 text-xs sm:text-sm font-medium text-red-800 underline hover:text-red-900 active:scale-95 transition-transform"
                >
                  Перейти в профиль →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
          {/* Mobile: Compact horizontal progress */}
          <div className="md:hidden flex items-center justify-between overflow-x-auto">
            {[
              { step: 1, title: 'Дата', icon: CalendarIcon },
              { step: 2, title: 'Шоу', icon: ClockIcon },
              { step: 3, title: 'Параметры', icon: DocumentTextIcon },
              { step: 4, title: 'Готово', icon: CheckCircleIcon }
            ].map(({ step, title, icon: Icon }) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full mb-1 ${
                  currentStep >= step 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`text-xs font-medium text-center ${
                  currentStep >= step ? 'text-primary-600' : 'text-gray-500'
                }`}>
                  {title}
                </span>
              </div>
            ))}
          </div>

          {/* Desktop: Full horizontal progress */}
          <div className="hidden md:flex items-center justify-between">
            {[
              { step: 1, title: 'Выбор даты', icon: CalendarIcon },
              { step: 2, title: 'Выбор шоу', icon: ClockIcon },
              { step: 3, title: 'Параметры', icon: DocumentTextIcon },
              { step: 4, title: 'Подтверждение', icon: CheckCircleIcon }
            ].map(({ step, title, icon: Icon }) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= step 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep >= step ? 'text-primary-600' : 'text-gray-500'
                }`}>
                  {title}
                </span>
                {step < 4 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    currentStep > step ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
              <form onSubmit={handleSubmit}>
                {/* Step 1: Date Selection */}
                {currentStep === 1 && (
                  <div className="space-y-4 sm:space-y-6">
                    <h2 className="text-base sm:text-lg font-semibold text-neutral-900">
                      Шаг 1: Выберите дату показа
                    </h2>
                    <div>
                      <label htmlFor="selectedDate" className="block text-sm font-medium text-neutral-700 mb-2">
                        Дата показа рекламы *
                      </label>
                      <input
                        type="date"
                        id="selectedDate"
                        name="selectedDate"
                        value={formData.selectedDate}
                        onChange={handleDateChange}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2.5 text-base border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <p className="mt-2 text-xs sm:text-sm text-neutral-500">
                        Выберите дату, чтобы увидеть доступные шоу
                      </p>
                    </div>
                    {formData.selectedDate && (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="w-full bg-primary-600 text-white px-4 py-3 rounded-md hover:bg-primary-700 transition-colors text-base font-medium active:scale-95"
                      >
                        Продолжить
                      </button>
                    )}
                  </div>
                )}

                {/* Step 2: Show Selection */}
                {currentStep === 2 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base sm:text-lg font-semibold text-neutral-900">
                        Шаг 2: Выберите шоу
                      </h2>
                      <button
                        type="button"
                        onClick={prevStep}
                        className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 active:scale-95 transition-transform"
                      >
                        ← Назад
                      </button>
                    </div>
                    
                    <div>
                      <p className="text-xs sm:text-sm text-neutral-600 mb-4">
                        Доступные шоу на {formData.selectedDate 
                          ? new Date(formData.selectedDate).toLocaleDateString('ru-RU')
                          : 'выбранную дату'}:
                      </p>
                      
                      {showsLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                          <p className="text-sm text-neutral-600">Загрузка шоу...</p>
                        </div>
                      ) : shows.length === 0 ? (
                        <div className="text-center py-8">
                          <CalendarIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-sm text-gray-600">На выбранную дату нет запланированных шоу</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 sm:gap-4">
                          {shows.map((show) => (
                            <div
                              key={show.id}
                              onClick={() => handleShowSelect(show.id)}
                              className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-all active:scale-98 ${
                                formData.showId === show.id
                                  ? 'border-primary-500 bg-primary-50'
                                  : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-medium text-sm sm:text-base text-gray-900 flex-1">{show.name}</h3>
                                {formData.showId === show.id && (
                                  <CheckCircleIcon className="h-5 w-5 text-primary-600 flex-shrink-0 ml-2" />
                                )}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                                <div className="flex justify-between">
                                  <span>Время:</span>
                                  <span className="font-medium">{show.time_slot}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Длительность шоу:</span>
                                  <span className="font-medium">{show.duration_minutes} мин</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Цена за минуту:</span>
                                  <span className="font-medium">{show.base_price_per_min} ₽</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Доступные слоты:</span>
                                  <span className={`font-medium ${
                                    show.available_slots > 5 ? 'text-green-600' : 
                                    show.available_slots > 2 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {show.available_slots}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Parameters */}
                {currentStep === 3 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base sm:text-lg font-semibold text-neutral-900">
                        Шаг 3: Параметры рекламы
                      </h2>
                      <button
                        type="button"
                        onClick={prevStep}
                        className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 active:scale-95 transition-transform"
                      >
                        ← Назад
                      </button>
                    </div>

                    {selectedShow && (
                      <div className="bg-primary-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                        <h3 className="text-sm font-medium text-primary-900 mb-2">Выбранное шоу</h3>
                        <div className="text-xs sm:text-sm text-primary-800 space-y-1">
                          <p><strong>{selectedShow.name}</strong> - {selectedShow.time_slot}</p>
                          <p>Длительность шоу: {selectedShow.duration_minutes} минут</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label htmlFor="durationSeconds" className="block text-sm font-medium text-neutral-700 mb-2">
                        Длительность рекламы (секунды) *
                      </label>
                      <input
                        type="number"
                        id="durationSeconds"
                        name="durationSeconds"
                        value={formData.durationSeconds}
                        onChange={handleInputChange}
                        required
                        min="5"
                        max="300"
                        className="w-full px-3 py-2.5 text-base border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <p className="mt-2 text-xs sm:text-sm text-neutral-500">
                        Минимум 5 секунд, максимум 300 секунд (5 минут)
                      </p>
                    </div>

                    <div>
                      <label htmlFor="contactPhone" className="block text-sm font-medium text-neutral-700 mb-2">
                        Контактный телефон *
                      </label>
                      <input
                        type="tel"
                        id="contactPhone"
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleInputChange}
                        required
                        placeholder="+7 (999) 123-45-67"
                        className="w-full px-3 py-2.5 text-base border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-2"
                      />
                      {profilePhone && (
                        <div className="flex items-center text-xs sm:text-sm">
                          <input 
                            id="useProfilePhone" 
                            type="checkbox" 
                            checked={useProfilePhone} 
                            onChange={(e) => {
                              const v = e.target.checked
                              setUseProfilePhone(v)
                              if (v && profilePhone) {
                                setFormData(prev => ({ ...prev, contactPhone: profilePhone }))
                              }
                            }} 
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" 
                          />
                          <label htmlFor="useProfilePhone" className="ml-2 text-neutral-600">
                            Использовать номер из профиля
                          </label>
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-2">
                        Описание рекламы
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="Опишите содержание рекламы, целевую аудиторию и другие важные детали..."
                        className="w-full px-3 py-2.5 text-base border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={nextStep}
                      className="w-full bg-primary-600 text-white px-4 py-3 rounded-md hover:bg-primary-700 transition-colors text-base font-medium active:scale-95"
                    >
                      Продолжить
                    </button>
                  </div>
                )}

                {/* Step 4: Confirmation */}
                {currentStep === 4 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base sm:text-lg font-semibold text-neutral-900">
                        Шаг 4: Подтверждение заявки
                      </h2>
                      <button
                        type="button"
                        onClick={prevStep}
                        className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 active:scale-95 transition-transform"
                      >
                        ← Назад
                      </button>
                    </div>

                    {selectedShow && (
                      <div className="bg-gray-50 rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900">Детали заявки</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                          <div>
                            <span className="text-gray-600">Дата показа:</span>
                            <p className="font-medium text-gray-900 mt-1">
                              {formData.selectedDate 
                                ? new Date(formData.selectedDate).toLocaleDateString('ru-RU')
                                : '—'}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Шоу:</span>
                            <p className="font-medium text-gray-900 mt-1">{selectedShow.name}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Время шоу:</span>
                            <p className="font-medium text-gray-900 mt-1">{selectedShow.time_slot}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Длительность рекламы:</span>
                            <p className="font-medium text-gray-900 mt-1">
                              {formData.durationSeconds} сек ({(formData.durationSeconds / 60).toFixed(2)} мин)
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-600">Базовая цена:</span>
                            <p className="font-medium text-gray-900 mt-1">{selectedShow.base_price_per_min} ₽/мин</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Контактный телефон:</span>
                            <p className="font-medium text-gray-900 mt-1">{formData.contactPhone}</p>
                          </div>
                        </div>

                        {formData.description && (
                          <div>
                            <span className="text-xs sm:text-sm text-gray-600">Описание:</span>
                            <p className="mt-1 text-xs sm:text-sm text-gray-900">{formData.description}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="submit"
                        disabled={loading || !hasBankDetails}
                        className="flex-1 bg-green-600 text-white px-4 py-3 text-base rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium active:scale-95"
                      >
                        {loading ? 'Отправка...' : 'Подать заявку'}
                      </button>
                      <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-3 text-base border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 active:scale-95"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}
                        ← Назад
                      </button>
                    </div>

                    {selectedShow && (
                      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                        <h3 className="font-semibold text-gray-900">Детали заявки</h3>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Дата показа:</span>
                            <span className="ml-2 font-medium">
                              {formData.selectedDate 
                                ? new Date(formData.selectedDate).toLocaleDateString('ru-RU')
                                : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Шоу:</span>
                            <span className="ml-2 font-medium">{selectedShow.name}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Время шоу:</span>
                            <span className="ml-2 font-medium">{selectedShow.time_slot}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Длительность рекламы:</span>
                            <span className="ml-2 font-medium">
                              {formData.durationSeconds} сек ({(formData.durationSeconds / 60).toFixed(2)} мин)
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Базовая цена:</span>
                            <span className="ml-2 font-medium">{selectedShow.base_price_per_min} ₽/мин</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Контактный телефон:</span>
                            <span className="ml-2 font-medium">{formData.contactPhone}</span>
                          </div>
                        </div>

                        {formData.description && (
                          <div>
                            <span className="text-gray-600">Описание:</span>
                            <p className="mt-1 text-sm text-gray-900">{formData.description}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={loading || !hasBankDetails}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        {loading ? 'Отправка...' : 'Подать заявку'}
                      </button>
                      <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Summary Sidebar - Hidden on mobile */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                📋 Сводка заявки
              </h3>

              {currentStep >= 1 && formData.selectedDate ? (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-xs font-medium text-blue-900 uppercase">Дата показа</p>
                      <p className="text-sm font-semibold text-blue-700">
                        {new Date(formData.selectedDate).toLocaleDateString('ru-RU', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500 text-center">
                    Выберите дату показа
                  </p>
                </div>
              )}

              {currentStep >= 2 && selectedShow ? (
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-green-600 mr-2" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-green-900 uppercase">Шоу</p>
                      <p className="text-sm font-semibold text-green-700">{selectedShow.name}</p>
                      <p className="text-xs text-green-600 mt-1">🕐 {selectedShow.time_slot}</p>
                    </div>
                  </div>
                </div>
              ) : currentStep >= 2 ? (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500 text-center">
                    Выберите шоу
                  </p>
                </div>
              ) : null}

              {currentStep >= 3 && formData.durationSeconds ? (
                <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-purple-600 mr-2" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-purple-900 uppercase">Длительность рекламы</p>
                      <p className="text-sm font-semibold text-purple-700">
                        {formData.durationSeconds} сек
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        ≈ {(formData.durationSeconds / 60).toFixed(2)} минут
                      </p>
                    </div>
                  </div>
                </div>
              ) : currentStep >= 3 ? (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500 text-center">
                    Укажите длительность
                  </p>
                </div>
              ) : null}

              {currentStep === 4 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Следующие шаги</h4>
                  <div className="text-sm text-green-800 space-y-1">
                    <p>1. Заявка будет рассмотрена агентом</p>
                    <p>2. При одобрении - отправлена в коммерческий отдел</p>
                    <p>3. После подтверждения - выставлен счет</p>
                    <p>4. После оплаты - размещение рекламы</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default ApplicationPage
