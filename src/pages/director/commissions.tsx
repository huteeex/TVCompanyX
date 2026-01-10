import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../redux/store'
import Layout from '../../components/layout/Layout'
import toast from 'react-hot-toast'
import axios from 'axios'
import { 
  DollarSign,
  Users,
  TrendingUp,
  Settings,
  Save,
  RefreshCw,
  Edit2,
  Check,
  X,
  Award,
  Percent,
  Calculator
} from 'lucide-react'

interface CommissionRule {
  id: string
  role: string
  role_display: string
  base_rate: number // базовая ставка в %
  tier_1_threshold: number // порог 1-го уровня (кол-во одобренных заявок)
  tier_1_bonus: number // бонус 1-го уровня в %
  tier_2_threshold: number
  tier_2_bonus: number
  tier_3_threshold: number
  tier_3_bonus: number
  revenue_multiplier: number // множитель от дохода (0.01 = 1%)
}

interface StaffCommission {
  id: string
  name: string
  role: string
  role_display: string
  approved_applications: number
  revenue: number
  current_tier: number
  commission_rate: number // текущая ставка с учетом бонусов
  total_commission: number
}

const DirectorCommissionsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([])
  const [staffCommissions, setStaffCommissions] = useState<StaffCommission[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRule, setEditingRule] = useState<string | null>(null)
  const [editedRule, setEditedRule] = useState<CommissionRule | null>(null)

  useEffect(() => {
    if (user) {
      loadCommissions()
    }
  }, [user])

  const loadCommissions = async () => {
    setLoading(true)
    try {
      // Load commission rules from DB
      const rulesResponse = await axios.get('/api/director/commission-rules')
      const rules = rulesResponse.data || []
      
      // Add display names
      const rulesWithDisplay = rules.map((r: any) => ({
        ...r,
        role_display: r.role === 'agent' ? 'Агент' : r.role === 'commercial' ? 'Коммерческий отдел' : r.role
      }))
      setCommissionRules(rulesWithDisplay)

      // Load staff commissions (calculated on backend)
      const commissionsResponse = await axios.get('/api/director/staff-commissions')
      const staffData = commissionsResponse.data || []

      // Format staff commissions
      const staffWithCommissions: StaffCommission[] = staffData.map((s: any) => ({
        id: s.id,
        name: `${s.first_name || ''} ${s.middle_name || ''} ${s.last_name || ''}`.trim() || s.email,
        role: s.role,
        role_display: s.role === 'agent' ? 'Агент' : s.role === 'commercial' ? 'Коммерческий отдел' : s.role,
        approved_applications: s.approved_applications || 0,
        revenue: parseFloat(s.total_revenue) || 0,
        current_tier: s.tier || 0,
        commission_rate: parseFloat(s.commission_rate) || 0,
        total_commission: parseFloat(s.total_commission) || 0,
      }))

      setStaffCommissions(staffWithCommissions)
    } catch (error: any) {
      console.error('Error loading commissions:', error)
      toast.error('Ошибка загрузки данных о комиссиях')
    } finally {
      setLoading(false)
    }
  }

  const handleEditRule = (rule: CommissionRule) => {
    setEditingRule(rule.id)
    setEditedRule({ ...rule })
  }

  const handleCancelEdit = () => {
    setEditingRule(null)
    setEditedRule(null)
  }

  const handleSaveRule = async () => {
    if (!editedRule) return

    try {
      // Save to database via API
      await axios.put(`/api/director/commission-rules/${editedRule.id}`, {
        base_rate: editedRule.base_rate,
        revenue_multiplier: editedRule.revenue_multiplier,
        tier_1_threshold: editedRule.tier_1_threshold,
        tier_1_bonus: editedRule.tier_1_bonus,
        tier_2_threshold: editedRule.tier_2_threshold,
        tier_2_bonus: editedRule.tier_2_bonus,
        tier_3_threshold: editedRule.tier_3_threshold,
        tier_3_bonus: editedRule.tier_3_bonus,
      })
      
      toast.success('Правило комиссии обновлено')
      setEditingRule(null)
      setEditedRule(null)
      // Reload data from server
      loadCommissions()
    } catch (error: any) {
      console.error('Error saving rule:', error)
      toast.error('Ошибка сохранения правила')
    }
  }

  const getTierBadge = (tier: number) => {
    if (tier === 3) return <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary-600 text-white shadow-sm">Уровень 3</span>
    if (tier === 2) return <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary-500 text-white shadow-sm">Уровень 2</span>
    if (tier === 1) return <span className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary-400 text-white shadow-sm">Уровень 1</span>
    return <span className="px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-300 text-neutral-700 shadow-sm">Базовый</span>
  }

  const totalCommissions = staffCommissions.reduce((sum, s) => sum + s.total_commission, 0)
  const avgCommissionRate = staffCommissions.length > 0
    ? staffCommissions.reduce((sum, s) => sum + s.commission_rate, 0) / staffCommissions.length
    : 0

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
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Комиссии агентов
                </h1>
                <p className="text-primary-100">
                  Управление правилами и расчет комиссионных
                </p>
              </div>
            </div>
            <button
              onClick={loadCommissions}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-300 hover:scale-105 disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              <span className="font-medium">Обновить</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group bg-gradient-to-br from-primary-600 to-primary-500 rounded-xl shadow-md p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-primary-100">Всего комиссий</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {totalCommissions.toLocaleString('ru-RU')} ₽
                </p>
                <p className="text-xs text-primary-100 mt-1">за текущий период</p>
              </div>
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <Calculator className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-600">Средняя ставка</p>
                <p className="text-3xl font-bold text-primary-600 mt-2">
                  {avgCommissionRate.toFixed(1)}%
                </p>
                <p className="text-xs text-neutral-500 mt-1">по всем сотрудникам</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 group-hover:from-primary-200 group-hover:to-primary-100 transition-all duration-300">
                <Percent className="h-8 w-8 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-xl shadow-sm border border-neutral-200 p-6 hover:shadow-lg hover:border-primary-300 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-600">Сотрудников</p>
                <p className="text-3xl font-bold text-neutral-900 mt-2">
                  {staffCommissions.length}
                </p>
                <p className="text-xs text-neutral-500 mt-1">получают комиссию</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 group-hover:from-primary-200 group-hover:to-primary-100 transition-all duration-300">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Commission Rules */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-white">
            <div className="flex items-center space-x-2">
              <Settings className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-bold text-neutral-900">
                Правила начисления комиссий
              </h3>
            </div>
            <p className="text-sm text-neutral-600 mt-2">
              Настройте базовые ставки и бонусные уровни для каждой роли
            </p>
          </div>

          <div className="p-6 space-y-4">
            {commissionRules.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50 mb-4">
                  <Settings className="h-8 w-8 text-primary-400" />
                </div>
                <p className="text-neutral-600">Правила комиссий не настроены</p>
              </div>
            ) : (
              commissionRules.map((rule) => {
                const isEditing = editingRule === rule.id
                const displayRule = isEditing ? editedRule! : rule

                return (
                  <div key={rule.id} className="border border-neutral-200 rounded-xl p-6 hover:border-primary-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-neutral-900">{displayRule.role_display}</h4>
                        <p className="text-sm text-neutral-600">Роль: {displayRule.role}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={handleSaveRule}
                              className="flex items-center space-x-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                              <Check className="h-4 w-4" />
                              <span className="text-sm font-medium">Сохранить</span>
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex items-center space-x-1 px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors"
                            >
                              <X className="h-4 w-4" />
                              <span className="text-sm font-medium">Отмена</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleEditRule(rule)}
                            className="flex items-center space-x-1 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                            <span className="text-sm font-medium">Редактировать</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Base Rate */}
                      <div className="bg-primary-50 rounded-lg p-4">
                        <label className="block text-xs font-semibold text-primary-700 mb-2">
                          Базовая ставка (%)
                        </label>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.1"
                            value={displayRule.base_rate}
                            onChange={(e) => setEditedRule({ ...displayRule, base_rate: parseFloat(e.target.value) })}
                            className="w-full px-3 py-2 border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        ) : (
                          <p className="text-2xl font-bold text-primary-600">{displayRule.base_rate}%</p>
                        )}
                      </div>

                      {/* Revenue Multiplier */}
                      <div className="bg-neutral-50 rounded-lg p-4">
                        <label className="block text-xs font-semibold text-neutral-700 mb-2">
                          Процент от дохода
                        </label>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.001"
                            value={displayRule.revenue_multiplier}
                            onChange={(e) => setEditedRule({ ...displayRule, revenue_multiplier: parseFloat(e.target.value) })}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        ) : (
                          <p className="text-2xl font-bold text-neutral-900">{(displayRule.revenue_multiplier * 100).toFixed(1)}%</p>
                        )}
                      </div>

                      {/* Tier 1 */}
                      <div className="bg-neutral-50 rounded-lg p-4">
                        <label className="block text-xs font-semibold text-neutral-700 mb-2">
                          ⭐ Tier 1: Заявок / Бонус (%)
                        </label>
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={displayRule.tier_1_threshold}
                              onChange={(e) => setEditedRule({ ...displayRule, tier_1_threshold: parseInt(e.target.value) })}
                              className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <span className="text-neutral-600">/</span>
                            <input
                              type="number"
                              step="0.1"
                              value={displayRule.tier_1_bonus}
                              onChange={(e) => setEditedRule({ ...displayRule, tier_1_bonus: parseFloat(e.target.value) })}
                              className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        ) : (
                          <p className="text-xl font-bold text-neutral-900">
                            {displayRule.tier_1_threshold} / +{displayRule.tier_1_bonus}%
                          </p>
                        )}
                      </div>

                      {/* Tier 2 */}
                      <div className="bg-neutral-50 rounded-lg p-4">
                        <label className="block text-xs font-semibold text-neutral-700 mb-2">
                          ⭐⭐ Tier 2: Заявок / Бонус (%)
                        </label>
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={displayRule.tier_2_threshold}
                              onChange={(e) => setEditedRule({ ...displayRule, tier_2_threshold: parseInt(e.target.value) })}
                              className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <span className="text-neutral-600">/</span>
                            <input
                              type="number"
                              step="0.1"
                              value={displayRule.tier_2_bonus}
                              onChange={(e) => setEditedRule({ ...displayRule, tier_2_bonus: parseFloat(e.target.value) })}
                              className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        ) : (
                          <p className="text-xl font-bold text-neutral-900">
                            {displayRule.tier_2_threshold} / +{displayRule.tier_2_bonus}%
                          </p>
                        )}
                      </div>

                      {/* Tier 3 */}
                      <div className="bg-neutral-50 rounded-lg p-4 md:col-span-2">
                        <label className="block text-xs font-semibold text-neutral-700 mb-2">
                          ⭐⭐⭐ Tier 3: Заявок / Бонус (%)
                        </label>
                        {isEditing ? (
                          <div className="flex items-center space-x-2 max-w-md">
                            <input
                              type="number"
                              value={displayRule.tier_3_threshold}
                              onChange={(e) => setEditedRule({ ...displayRule, tier_3_threshold: parseInt(e.target.value) })}
                              className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <span className="text-neutral-600">/</span>
                            <input
                              type="number"
                              step="0.1"
                              value={displayRule.tier_3_bonus}
                              onChange={(e) => setEditedRule({ ...displayRule, tier_3_bonus: parseFloat(e.target.value) })}
                              className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        ) : (
                          <p className="text-xl font-bold text-neutral-900">
                            {displayRule.tier_3_threshold} / +{displayRule.tier_3_bonus}%
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Staff Commissions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-neutral-50 to-white">
            <div className="flex items-center space-x-2">
              <Award className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-bold text-neutral-900">
                Расчет комиссий сотрудников
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-gradient-to-r from-neutral-50 to-neutral-100/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Сотрудник</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Роль</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Одобрено</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Доход</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Уровень</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Ставка</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Комиссия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {staffCommissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50 mb-4">
                        <Users className="h-8 w-8 text-primary-400" />
                      </div>
                      <p className="text-neutral-600">Нет данных о комиссиях</p>
                    </td>
                  </tr>
                ) : (
                  staffCommissions.map((staff) => (
                    <tr key={staff.id} className="hover:bg-primary-50/30 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-neutral-900">{staff.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-700">
                          {staff.role_display}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                        {staff.approved_applications}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-neutral-900">
                        {staff.revenue.toLocaleString('ru-RU')} ₽
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTierBadge(staff.current_tier)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-primary-600">{staff.commission_rate}%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-primary-600">
                          {staff.total_commission.toLocaleString('ru-RU')} ₽
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 border border-primary-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-primary-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-primary-900 mb-2">Как работает система комиссий</h3>
              <ul className="text-sm text-primary-800 space-y-1">
                <li>• <strong>Базовая ставка</strong>: фиксированный процент от дохода по заявкам</li>
                <li>• <strong>Процент от дохода</strong>: дополнительный множитель на общий доход</li>
                <li>• <strong>Бонусные уровни (Tiers)</strong>: дополнительные бонусы при достижении порогов одобренных заявок</li>
                <li>• <strong>Итоговая комиссия</strong> = (Доход × (Базовая ставка + Бонус уровня) / 100)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default DirectorCommissionsPage

