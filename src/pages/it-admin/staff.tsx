import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../redux/store'
import Layout from '../../components/layout/Layout'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import {
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'

interface StaffMember {
  id: string
  name: string
  first_name?: string
  middle_name?: string
  last_name?: string
  email: string
  role: string
  is_active: boolean
  phone?: string
  bank_details?: any
  created_at: string
}

const StaffManagementPage: React.FC = () => {
  const router = useRouter()
  const user = useSelector((s: RootState) => s.auth.user)
  const [loading, setLoading] = useState(true)
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [filteredRole, setFilteredRole] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    role: 'agent',
    phone: '',
    bank_details: ''
  })

  useEffect(() => {
    if (!user) {
      router.push('/auth')
      return
    }
    
    if (user.role !== 'it_admin') {
      toast.error('Access denied')
      router.push('/')
      return
    }
    
    loadStaff()
  }, [user])

  const loadStaff = async () => {
    try {
      const url = filteredRole && filteredRole !== 'all' 
        ? `/api/admin/staff?role=${filteredRole}`
        : `/api/admin/staff`
      
      const res = await fetch(url, { credentials: 'same-origin' })
      if (res.ok) {
        const data = await res.json()
        setStaff(data)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error loading staff:', error)
      toast.error('Ошибка загрузки данных')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'it_admin') {
      loadStaff()
    }
  }, [filteredRole])

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        toast.success('Сотрудник создан')
        setShowCreateModal(false)
        setFormData({
          email: '',
          password: '',
          first_name: '',
          middle_name: '',
          last_name: '',
          role: 'agent',
          phone: '',
          bank_details: ''
        })
        loadStaff()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Ошибка создания')
      }
    } catch (error) {
      console.error('Error creating staff:', error)
      toast.error('Ошибка создания')
    }
  }

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaff) return
    
    try {
      const updateData: any = {}
      if (formData.email) updateData.email = formData.email
      if (formData.password) updateData.password = formData.password
      if (formData.first_name !== undefined) updateData.first_name = formData.first_name
      if (formData.middle_name !== undefined) updateData.middle_name = formData.middle_name
      if (formData.last_name !== undefined) updateData.last_name = formData.last_name
      if (formData.role) updateData.role = formData.role
      if (formData.phone !== undefined) updateData.phone = formData.phone
      if (formData.bank_details !== undefined) updateData.bank_details = formData.bank_details
      
      const res = await fetch(`/api/admin/staff/${selectedStaff.id}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })
      
      if (res.ok) {
        toast.success('Сотрудник обновлён')
        setShowEditModal(false)
        setSelectedStaff(null)
        loadStaff()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Ошибка обновления')
      }
    } catch (error) {
      console.error('Error updating staff:', error)
      toast.error('Ошибка обновления')
    }
  }

  const handleDeactivateStaff = async (staffId: string) => {
    if (!confirm('Деактивировать сотрудника?')) return
    
    try {
      const res = await fetch(`/api/admin/staff/${staffId}`, {
        method: 'DELETE',
        credentials: 'same-origin'
      })
      
      if (res.ok) {
        toast.success('Сотрудник деактивирован')
        loadStaff()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Ошибка')
      }
    } catch (error) {
      console.error('Error deactivating staff:', error)
      toast.error('Ошибка')
    }
  }

  const getRoleName = (role: string) => {
    const names: { [key: string]: string } = {
      agent: 'Агент',
      commercial: 'Коммерческий',
      director: 'Директор',
      accountant: 'Бухгалтер',
      company: 'Компания',
      it_admin: 'IT Админ'
    }
    return names[role] || role
  }

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      agent: 'bg-green-100 text-green-800',
      commercial: 'bg-purple-100 text-purple-800',
      director: 'bg-red-100 text-red-800',
      accountant: 'bg-yellow-100 text-yellow-800',
      company: 'bg-blue-100 text-blue-800',
      it_admin: 'bg-gray-100 text-gray-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Управление сотрудниками</h1>
            <p className="mt-2 text-gray-600">Создание и редактирование учётных записей</p>
          </div>
          <button
            onClick={() => {
              setFormData({
                email: '',
                password: '',
                first_name: '',
                middle_name: '',
                last_name: '',
                role: 'agent',
                phone: '',
                bank_details: ''
              })
              setShowPassword(false)
              setShowCreateModal(true)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <UserPlusIcon className="h-5 w-5" />
            Создать сотрудника
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex gap-2">
            {['all', 'agent', 'commercial', 'director', 'accountant', 'it_admin'].map(role => (
              <button
                key={role}
                onClick={() => setFilteredRole(role)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filteredRole === role
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {role === 'all' ? 'Все' : getRoleName(role)}
              </button>
            ))}
          </div>
        </div>

        {/* Staff Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ФИО</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Роль</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Телефон</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staff.map(member => (
                  <tr key={member.id} className={!member.is_active ? 'bg-gray-50 opacity-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {member.first_name || member.last_name
                          ? `${member.last_name || ''} ${member.first_name || ''} ${member.middle_name || ''}`.trim()
                          : member.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {member.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(member.role)}`}>
                        {getRoleName(member.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {member.phone || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.is_active ? (
                        <span className="flex items-center text-green-600 text-sm">
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Активен
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600 text-sm">
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          Деактивирован
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedStaff(member)
                          setFormData({
                            email: member.email,
                            password: '',
                            first_name: member.first_name || '',
                            middle_name: member.middle_name || '',
                            last_name: member.last_name || '',
                            role: member.role,
                            phone: member.phone || '',
                            bank_details: member.bank_details ? JSON.stringify(member.bank_details) : ''
                          })
                          setShowEditPassword(false)
                          setShowEditModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <PencilIcon className="h-5 w-5 inline" />
                      </button>
                      {member.is_active && (
                        <button
                          onClick={() => handleDeactivateStaff(member.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Создать сотрудника</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-white">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия *</label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      className="w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      className="w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Отчество</label>
                  <input
                    type="text"
                    value={formData.middle_name}
                    onChange={(e) => setFormData({...formData, middle_name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Пароль *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full border border-gray-300 rounded-md p-2 pr-10"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Роль *</label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full border border-gray-300 rounded-md p-2"
                  >
                    <option value="agent">Агент</option>
                    <option value="commercial">Коммерческий</option>
                    <option value="director">Директор</option>
                    <option value="accountant">Бухгалтер</option>
                    <option value="company">Компания</option>
                    <option value="it_admin">IT Админ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Создать
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-green-600 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Редактировать сотрудника</h2>
                <button onClick={() => {
                  setShowEditModal(false)
                  setSelectedStaff(null)
                }} className="text-white">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateStaff} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      className="w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      className="w-full border border-gray-300 rounded-md p-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Отчество</label>
                  <input
                    type="text"
                    value={formData.middle_name}
                    onChange={(e) => setFormData({...formData, middle_name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль</label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full border border-gray-300 rounded-md p-2 pr-10"
                      placeholder="Оставьте пустым, чтобы не менять"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showEditPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full border border-gray-300 rounded-md p-2"
                  >
                    <option value="agent">Агент</option>
                    <option value="commercial">Коммерческий</option>
                    <option value="director">Директор</option>
                    <option value="accountant">Бухгалтер</option>
                    <option value="company">Компания</option>
                    <option value="it_admin">IT Админ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-md p-2"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedStaff(null)
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default StaffManagementPage
