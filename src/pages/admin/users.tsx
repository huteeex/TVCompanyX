import React, { useState, useEffect, useCallback } from 'react'
import Layout from '../../components/layout/Layout'
import { userAPI } from '../../utils/api'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

interface User {
  id: string
  name: string
  first_name?: string
  middle_name?: string
  last_name?: string
  email: string
  role: string
  is_active: boolean
  phone?: string
  created_at: string
}

const ROLE_LABELS: Record<string, string> = {
  customer: 'Заказчик',
  agent: 'Агент',
  commercial: 'Коммерческий',
  accountant: 'Бухгалтер',
  admin: 'ИТ-Администратор',
  it_admin: 'ИТ-Администратор',
  director: 'Директор',
}

const ROLE_COLORS: Record<string, string> = {
  customer: 'bg-blue-100 text-blue-800',
  agent: 'bg-purple-100 text-purple-800',
  commercial: 'bg-orange-100 text-orange-800',
  accountant: 'bg-yellow-100 text-yellow-800',
  admin: 'bg-red-100 text-red-800',
  it_admin: 'bg-red-100 text-red-800',
  director: 'bg-green-100 text-green-800',
}

const EMPTY_FORM = {
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
  password: '',
  role: 'customer',
  phone: '',
}

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await userAPI.getUsers()
      setUsers(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ошибка загрузки пользователей')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const openCreate = () => {
    setEditingUser(null)
    setForm({ ...EMPTY_FORM })
    setShowModal(true)
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    setForm({
      first_name: user.first_name || '',
      middle_name: user.middle_name || '',
      last_name: user.last_name || '',
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone || '',
    })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const displayName = [form.last_name, form.first_name, form.middle_name].filter(Boolean).join(' ') || form.email

      if (editingUser) {
        const payload: any = {
          first_name: form.first_name || null,
          middle_name: form.middle_name || null,
          last_name: form.last_name || null,
          name: displayName,
          email: form.email,
          role: form.role,
          phone: form.phone || null,
        }
        await userAPI.updateUser(editingUser.id, payload)
        toast.success('Пользователь обновлён')
      } else {
        if (!form.password) { toast.error('Укажите пароль'); return }
        await userAPI.createUser({
          first_name: form.first_name || null,
          middle_name: form.middle_name || null,
          last_name: form.last_name || null,
          name: displayName,
          email: form.email,
          password: form.password,
          role: form.role,
          phone: form.phone || null,
        })
        toast.success('Пользователь создан')
      }
      setShowModal(false)
      loadUsers()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (user: User) => {
    try {
      await userAPI.updateUser(user.id, { is_active: !user.is_active })
      toast.success(user.is_active ? 'Пользователь деактивирован' : 'Пользователь активирован')
      loadUsers()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ошибка изменения статуса')
    }
  }

  const handleDelete = async (userId: string) => {
    try {
      await userAPI.deleteUser(userId)
      toast.success('Пользователь удалён')
      setDeleteConfirm(null)
      loadUsers()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ошибка удаления')
    }
  }

  const filtered = users.filter(u => {
    const matchSearch =
      !search ||
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.first_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.last_name || '').toLowerCase().includes(search.toLowerCase())
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <Layout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Учётные записи</h1>
            <p className="text-secondary-600">Управление пользователями системы</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadUsers}
              className="flex items-center gap-2 px-3 py-2 border border-secondary-300 rounded-md text-secondary-700 hover:bg-secondary-50"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Обновить
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-5 w-5" />
              Добавить
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Поиск по имени или email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Все роли</option>
              {Object.entries(ROLE_LABELS)
                .filter(([k]) => k !== 'admin')
                .map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-secondary-500">
              Пользователи не найдены
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    {['Пользователь', 'Email', 'Роль', 'Телефон', 'Статус', 'Создан', 'Действия'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-200">
                  {filtered.map(user => (
                    <tr key={user.id} className="hover:bg-secondary-50">
                      <td className="px-4 py-3 text-sm font-medium text-secondary-900">
                        {user.name || [user.first_name, user.last_name].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-secondary-600">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-800'}`}>
                          {ROLE_LABELS[user.role] ?? user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-secondary-600">{user.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {user.is_active
                            ? <><CheckCircleIcon className="h-3 w-3" />Активен</>
                            : <><XCircleIcon className="h-3 w-3" />Неактивен</>}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-secondary-500">
                        {new Date(user.created_at).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(user)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Редактировать"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(user)}
                            className={user.is_active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                            title={user.is_active ? 'Деактивировать' : 'Активировать'}
                          >
                            {user.is_active ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(user.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Удалить"
                          >
                            <TrashIcon className="h-4 w-4" />
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

        <p className="text-sm text-secondary-500">
          Показано {filtered.length} из {users.length} пользователей
        </p>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-secondary-200">
              <h2 className="text-lg font-semibold text-secondary-900">
                {editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
              </h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Фамилия</label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Иванов"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Имя</label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Иван"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Отчество</label>
                  <input
                    type="text"
                    value={form.middle_name}
                    onChange={e => setForm(f => ({ ...f, middle_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Иванович"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="user@example.com"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Пароль *</label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Минимум 6 символов"
                    minLength={6}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Роль *</label>
                  <select
                    required
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {Object.entries(ROLE_LABELS)
                      .filter(([k]) => k !== 'admin')
                      .map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Телефон</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="+7 999 000 00 00"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-secondary-300 rounded-md text-secondary-700 hover:bg-secondary-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? 'Сохранение...' : editingUser ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-secondary-900">Подтвердите удаление</h2>
            <p className="text-secondary-600 text-sm">
              Если у пользователя есть связанные данные, он будет деактивирован вместо удаления.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-secondary-300 rounded-md text-secondary-700 hover:bg-secondary-50"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default AdminUsersPage


