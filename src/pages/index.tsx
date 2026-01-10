import React, { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { motion, useInView, useAnimation } from 'framer-motion'
import { 
  Play, 
  Users, 
  TrendingUp, 
  FileText,
  DollarSign,
  Settings,
  Building,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Zap
} from 'lucide-react'

const HomePage: React.FC = () => {
  const router = useRouter()
  const controls = useAnimation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      controls.start('visible')
    }
  }, [isInView, controls])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-neutral-200/50 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 shadow-glow">
                <Play className="h-5 w-5 text-white" fill="white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-neutral-950 tracking-tight">
                  TV Company
                </h1>
                <p className="text-xs text-neutral-500">
                  Ad Platform
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/auth')}
                className="group relative px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl overflow-hidden transition-all duration-300 hover:shadow-glow active:scale-[0.97]"
              >
                <span className="relative z-10 flex items-center">
                  Войти
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="pt-24">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-neutral-50 to-neutral-100 pb-24 pt-16">
          <div className="absolute inset-0 bg-grid-neutral-200/50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-200/50 mb-8"
              >
                <Sparkles className="h-4 w-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-700">Premium Advertising Platform 2026</span>
              </motion.div>

              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="text-hero-sm md:text-hero text-neutral-950 mb-6 animate-breathe"
              >
                Управление рекламой{' '}
                <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 bg-clip-text text-transparent">
                  нового поколения
                </span>
              </motion.h1>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="text-lg md:text-xl text-neutral-600 max-w-3xl mx-auto mb-10 leading-relaxed"
              >
                Современная платформа для управления рекламными размещениями, 
                расчета стоимости и взаимодействия между всеми участниками процесса
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <button
                  onClick={() => router.push('/auth')}
                  className="group relative px-8 py-4 bg-primary-600 text-white text-base font-semibold rounded-xl overflow-hidden transition-all duration-300 hover:shadow-glow-accent active:scale-[0.97]"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    Начать работу
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-2" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
                <button
                  onClick={() => router.push('/services')}
                  className="group px-8 py-4 bg-white text-neutral-950 border-2 border-neutral-200 text-base font-semibold rounded-xl hover:border-primary-300 hover:bg-neutral-50 transition-all duration-300 active:scale-[0.97]"
                >
                  Узнать больше
                </button>
              </motion.div>
            </motion.div>

            {/* Floating stats */}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="grid grid-cols-3 gap-6 max-w-3xl mx-auto mt-20"
            >
              {[
                { label: 'Активных кампаний', value: '1.2K+', icon: Zap },
                { label: 'Довольных клиентов', value: '450+', icon: Users },
                { label: 'Успешных размещений', value: '98%', icon: TrendingUp },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
                  className="bg-white rounded-2xl p-6 border border-neutral-200/50 shadow-soft hover:shadow-soft-lg transition-all duration-300"
                >
                  <stat.icon className="h-6 w-6 text-primary-600 mb-3 mx-auto" />
                  <div className="text-3xl font-bold text-neutral-950 mb-1">{stat.value}</div>
                  <div className="text-sm text-neutral-600">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section ref={ref} className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={controls}
              className="text-center mb-16"
            >
              <motion.h2 variants={itemVariants} className="text-section text-neutral-950 mb-4">
                Всё для эффективной работы
              </motion.h2>
              <motion.p variants={itemVariants} className="text-lg text-neutral-600 max-w-2xl mx-auto">
                Инструменты и функции, которые делают управление рекламой простым и приятным
              </motion.p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={controls}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {[
                {
                  icon: Play,
                  title: 'Управление рекламой',
                  description: 'Полный цикл от подачи заявки до размещения рекламы с автоматическим расчетом стоимости',
                  gradient: 'from-primary-500 to-primary-600',
                },
                {
                  icon: BarChart3,
                  title: 'Аналитика и отчеты',
                  description: 'Детальная аналитика по всем показателям и автоматические отчеты в реальном времени',
                  gradient: 'from-teal-500 to-teal-600',
                },
                {
                  icon: Users,
                  title: 'Командная работа',
                  description: 'Эффективное взаимодействие между всеми участниками процесса через встроенные чаты',
                  gradient: 'from-accent-400 to-accent-500',
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group relative bg-gradient-to-b from-neutral-50 to-white rounded-2xl p-8 border border-neutral-200/50 hover:border-primary-200 hover:shadow-soft-lg transition-all duration-300"
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-soft mb-6`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-950 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>


        {/* Roles Section */}
        <section className="py-24 bg-gradient-to-b from-neutral-50 to-neutral-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-center mb-16"
            >
              <h3 className="text-section text-neutral-950 mb-4">
                Для каждой роли — свой функционал
              </h3>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                Персонализированные дашборды и инструменты для эффективной работы
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Users,
                  role: 'Заказчик рекламы',
                  features: ['Расчет стоимости рекламы', 'Подача заявок', 'Отслеживание статуса'],
                  gradient: 'from-primary-500 to-primary-600',
                  bg: 'bg-primary-50',
                  border: 'border-primary-200/50',
                  textColor: 'text-primary-700',
                },
                {
                  icon: TrendingUp,
                  role: 'Рекламный агент',
                  features: ['Управление заявками', 'Расчет комиссий', 'Генерация отчетов'],
                  gradient: 'from-teal-500 to-teal-600',
                  bg: 'bg-teal-50',
                  border: 'border-teal-200/50',
                  textColor: 'text-teal-700',
                },
                {
                  icon: FileText,
                  role: 'Коммерческий отдел',
                  features: ['Составление расписания', 'Управление заявками', 'Планирование эфира'],
                  gradient: 'from-accent-400 to-accent-500',
                  bg: 'bg-accent-50',
                  border: 'border-accent-200/50',
                  textColor: 'text-accent-700',
                },
                {
                  icon: DollarSign,
                  role: 'Бухгалтер',
                  features: ['Финансовые отчеты', 'Управление платежами', 'Контроль доходов'],
                  gradient: 'from-amber-400 to-amber-500',
                  bg: 'bg-amber-50',
                  border: 'border-amber-200/50',
                  textColor: 'text-amber-700',
                },
                {
                  icon: Settings,
                  role: 'ИТ-администратор',
                  features: ['Управление пользователями', 'Мониторинг системы', 'Техническая поддержка'],
                  gradient: 'from-rose-400 to-rose-500',
                  bg: 'bg-rose-50',
                  border: 'border-rose-200/50',
                  textColor: 'text-rose-700',
                },
                {
                  icon: Building,
                  role: 'Директор',
                  features: ['Аналитика компании', 'Стратегические отчеты', 'Управление KPI'],
                  gradient: 'from-violet-500 to-violet-600',
                  bg: 'bg-violet-50',
                  border: 'border-violet-200/50',
                  textColor: 'text-violet-700',
                },
              ].map((roleData, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  whileHover={{ y: -6, transition: { duration: 0.3 } }}
                  className={`group relative ${roleData.bg} rounded-2xl p-6 border ${roleData.border} hover:shadow-soft-lg transition-all duration-300`}
                >
                  <div className="flex items-center mb-5">
                    <div className={`flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${roleData.gradient} shadow-soft mr-3`}>
                      <roleData.icon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className={`text-base font-semibold ${roleData.textColor.replace('700', '900')}`}>
                      {roleData.role}
                    </h4>
                  </div>
                  <ul className={`${roleData.textColor} text-sm space-y-2.5`}>
                    {roleData.features.map((feature, j) => (
                      <li key={j} className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 rounded-3xl p-12 md:p-16 text-white shadow-glow"
            >
              <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,transparent_50%,black)]" />
              
              <div className="relative text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-6"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">Присоединяйтесь к нам</span>
                </motion.div>

                <motion.h3
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-3xl md:text-4xl font-bold mb-4"
                >
                  Готовы начать работу?
                </motion.h3>
                
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-lg md:text-xl mb-8 opacity-95"
                >
                  Присоединяйтесь к нашей системе управления рекламой уже сегодня
                </motion.p>
                
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  onClick={() => router.push('/auth')}
                  className="group inline-flex items-center px-8 py-4 bg-white text-primary-600 text-base font-semibold rounded-xl hover:bg-neutral-50 transition-all duration-300 shadow-soft-lg active:scale-[0.97]"
                >
                  Войти в систему
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-2" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-950 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700">
                <Play className="h-5 w-5 text-white" fill="white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">TV Company</p>
                <p className="text-xs text-neutral-400">Ad Platform</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-neutral-400">
                &copy; 2026 TV Company Ad System. Все права защищены.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
