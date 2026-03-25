import React, { useState, useEffect, useCallback } from 'react'
import Layout from '../../components/layout/Layout'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { ArrowPathIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'

interface AuditLog {
  id: number
  entity: string
  entity_id: string
  action: string
  changed_at: string
  payload: any
  changed_by_name?: string
  changed_by_email?: string
}

const ACTION_COLORS: Record<string, string> = {
  INSERT: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  CREATE: 'bg-green-100 text-green-800',
  LOGIN: 'bg-purple-100 text-purple-800',
}

const AdminLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [entityTypes, setEntityTypes] = useState<string[]>([])
  const [actionTypes, setActionTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const [entityFilter, setEntityFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [limit] = useState(100)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { limit }
      if (entityFilter) params.entity = entityFilter
      if (actionFilter) params.action = actionFilter
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo

      const res = await api.get('/admin/logs', { params })
      setLogs(res.data.logs)
      setTotal(res.data.total)
      if (res.data.entityTypes?.length) setEntityTypes(res.data.entityTypes)
      if (res.data.actionTypes?.length) setActionTypes(res.data.actionTypes)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Ошибка загрузки логов')
    } finally {
      setLoading(false)
    }
  }, [entityFilter, actionFilter, dateFrom, dateTo, limit])

  useEffect(() => { loadLogs() }, [loadLogs])

  const filtered = search
    ? logs.filter(l =>
        l.entity.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        (l.changed_by_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.changed_by_email || '').toLowerCase().includes(search.toLowerCase()) ||
        l.entity_id.toLowerCase().includes(search.toLowerCase())
      )
    : logs

  const resetFilters = () => {
    setEntityFilter('')
    setActionFilter('')
    setDateFrom('')
    setDateTo('')
    setSearch('')
  }

  return (
    <Layout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Логи аудита</h1>
            <p className="text-secondary-600">История изменений в системе</p>
          </div>
          <button
            onClick={loadLogs}
            className="flex items-center gap-2 px-3 py-2 border border-secondary-300 rounded-md text-secondary-700 hover:bg-secondary-50"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Обновить
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-secondary-700">
            <FunnelIcon className="h-4 w-4" />
            Фильтры
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Поиск..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>

            <select
              value={entityFilter}
              onChange={e => setEntityFilter(e.target.value)}
              className="px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">Все сущности</option>
              {entityTypes.map(e => <option key={e} value={e}>{e}</option>)}
            </select>

            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">Все действия</option>
              {actionTypes.map(a => <option key={a} value={a}>{a}</option>)}
            </select>

            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              title="С даты"
            />

            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              title="По дату"
            />
          </div>
          {(entityFilter || actionFilter || dateFrom || dateTo || search) && (
            <button
              onClick={resetFilters}
              className="text-sm text-primary-600 hover:underline"
            >
              Сбросить фильтры
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <p className="text-secondary-500 font-medium">Логи не найдены</p>
              <p className="text-sm text-secondary-400">
                Таблица audit_log пуста или фильтры не дали результатов
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200 text-sm">
                <thead className="bg-secondary-50">
                  <tr>
                    {['#', 'Сущность', 'ID объекта', 'Действие', 'Кто изменил', 'Дата', 'Данные'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-200">
                  {filtered.map(log => (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-secondary-50">
                        <td className="px-4 py-3 text-secondary-400 text-xs">{log.id}</td>
                        <td className="px-4 py-3 font-medium text-secondary-900">{log.entity}</td>
                        <td className="px-4 py-3 text-secondary-500 font-mono text-xs" title={log.entity_id}>
                          {log.entity_id?.slice(0, 8)}…
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${ACTION_COLORS[log.action?.toUpperCase()] ?? 'bg-gray-100 text-gray-800'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-secondary-600">
                          {log.changed_by_name || log.changed_by_email || <span className="text-secondary-400">Система</span>}
                        </td>
                        <td className="px-4 py-3 text-secondary-500 whitespace-nowrap">
                          {new Date(log.changed_at).toLocaleString('ru-RU')}
                        </td>
                        <td className="px-4 py-3">
                          {log.payload && (
                            <button
                              onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                              className="text-primary-600 hover:underline text-xs"
                            >
                              {expandedId === log.id ? 'Скрыть' : 'Показать'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedId === log.id && log.payload && (
                        <tr className="bg-secondary-50">
                          <td colSpan={7} className="px-4 py-3">
                            <pre className="text-xs text-secondary-700 bg-white border border-secondary-200 rounded p-3 overflow-x-auto max-h-48">
                              {JSON.stringify(log.payload, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-sm text-secondary-500">
          Показано {filtered.length} из {total} записей (последние {limit})
        </p>
      </div>
    </Layout>
  )
}

export default AdminLogsPage


