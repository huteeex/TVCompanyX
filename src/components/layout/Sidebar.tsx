import React from 'react'
import { useSelector } from 'react-redux'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { RootState } from '../../redux/store'
import {
  Home,
  Calculator,
  FileText,
  Clock,
  User,
  MessageSquare,
  BarChart3,
  FileDown,
  Calendar,
  ClipboardList,
  DollarSign,
  Settings,
  Bell,
  Users,
  Server,
  Tv,
  Building2,
  Play
} from 'lucide-react'

interface SidebarProps {
  role: string
}

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const router = useRouter()
  const { sidebarOpen } = useSelector((state: RootState) => state.ui)
  const { rooms } = useSelector((state: RootState) => state.chat)
  
  // Calculate total unread messages
  const totalUnread = rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0)

  const getNavigationItems = (userRole: string) => {
    const baseItems = [
      {
        name: 'Главная',
        href: `/${userRole}`,
        icon: Home,
      },
    ]

    switch (userRole) {
      case 'customer':
        return [
          ...baseItems,
          {
            name: 'Калькулятор стоимости',
            href: `/${userRole}/calculator`,
            icon: Calculator,
          },
          {
            name: 'Подать заявку',
            href: `/${userRole}/application`,
            icon: FileText,
          },
          {
            name: 'Мои заявки',
            href: `/${userRole}/applications`,
            icon: Clock,
          },
          {
            name: 'Документы',
            href: `/${userRole}/documents`,
            icon: FileText,
          },
          {
            name: 'Профиль',
            href: `/${userRole}/profile`,
            icon: User,
          },
          {
            name: 'Чат с агентом',
            href: `/${userRole}/chat`,
            icon: MessageSquare,
          },
        ]

      case 'agent':
        return [
          ...baseItems,
          {
            name: 'Заявки клиентов',
            href: `/${userRole}/applications`,
            icon: ClipboardList,
          },
          {
            name: 'Комиссии',
            href: `/${userRole}/commissions`,
            icon: BarChart3,
          },
          {
            name: 'Отчеты',
            href: `/${userRole}/reports`,
            icon: FileDown,
          },
          {
            name: 'Чат с клиентами',
            href: `/${userRole}/chat`,
            icon: MessageSquare,
            badge: totalUnread > 0 ? totalUnread : undefined,
          },
        ]

      case 'commercial':
        return [
          ...baseItems,
          {
            name: 'Управление шоу',
            href: `/${userRole}/shows`,
            icon: Tv,
          },
          {
            name: 'Расписание рекламы',
            href: `/${userRole}/ad-schedule`,
            icon: Calendar,
          },
          {
            name: 'Расписание шоу',
            href: `/${userRole}/schedule`,
            icon: Clock,
          },
          {
            name: 'Заявки от агентов',
            href: `/${userRole}/applications`,
            icon: ClipboardList,
          },
          {
            name: 'Чат с агентами',
            href: `/${userRole}/chat`,
            icon: MessageSquare,
          },
        ]

      case 'accountant':
        return [
          ...baseItems,
          {
            name: 'Одобренные заявки',
            href: `/${userRole}/applications`,
            icon: ClipboardList,
          },
          {
            name: 'Отчеты',
            href: `/${userRole}/reports`,
            icon: FileDown,
          },
          {
            name: 'Доходы',
            href: `/${userRole}/revenue`,
            icon: DollarSign,
          },
        ]

      case 'admin':
        return [
          ...baseItems,
          {
            name: 'Учетные записи',
            href: `/${userRole}/users`,
            icon: Users,
          },
          {
            name: 'Статистика',
            href: `/${userRole}/stats`,
            icon: BarChart3,
          },
          {
            name: 'Логи сервера',
            href: `/${userRole}/logs`,
            icon: Server,
          },
          {
            name: 'Настройки системы',
            href: `/${userRole}/settings`,
            icon: Settings,
          },
        ]

      case 'director':
        return [
          ...baseItems,
          {
            name: 'Статистика сотрудников',
            href: `/${userRole}/staff-stats`,
            icon: Tv,
          },
          {
            name: 'Комиссии агентов',
            href: `/${userRole}/commissions`,
            icon: DollarSign,
          },
          {
            name: 'Отчеты по клиентам',
            href: `/${userRole}/client-reports`,
            icon: FileDown,
          },
          {
            name: 'Статистика компании',
            href: `/${userRole}/company-stats`,
            icon: Building2,
          },
        ]

      case 'it_admin':
        return [
          {
            name: 'Главная',
            href: `/it-admin/dashboard`,
            icon: BarChart3,
          },
          {
            name: 'Управление сотрудниками',
            href: `/it-admin/staff`,
            icon: Users,
          },
        ]

      case 'company':
        return [
          ...baseItems,
          {
            name: 'Компания',
            href: `/${userRole}/dashboard`,
            icon: Building2,
          },
        ]

      default:
        return baseItems
    }
  }

  const navigationItems = getNavigationItems(role)

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-neutral-200/50 lg:static lg:inset-0 min-h-screen">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-neutral-200/50">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700">
              <Play className="h-4 w-4 text-white" fill="white" />
            </div>
            <span className="text-sm font-semibold text-neutral-950">Меню</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item, index) => {
            const isActive = router.pathname === item.href
            const isChatLink = item.href.includes('/chat')
            const showBadge = isChatLink && totalUnread > 0
            
            return (
              <Link
                key={item.name}
                href={item.href}
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ x: 4 }}
                  className={`group relative flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-50 to-primary-100/50 text-primary-700 shadow-soft'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 w-1 h-8 bg-gradient-to-b from-primary-500 to-primary-600 rounded-r-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  
                  <div className="flex items-center ml-2">
                    <item.icon className={`h-5 w-5 mr-3 transition-colors ${
                      isActive ? 'text-primary-600' : 'text-neutral-500 group-hover:text-neutral-700'
                    }`} />
                    <span>{item.name}</span>
                  </div>
                  
                  {showBadge && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-soft"
                    >
                      {totalUnread}
                    </motion.span>
                  )}
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-neutral-200/50">
          <div className="flex items-center justify-center space-x-1.5 text-xs text-neutral-400">
            <span>v1.0.0</span>
            <span>•</span>
            <span className="font-medium">2026</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
