import React from 'react'
import { motion } from 'framer-motion'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { Card, StatCard } from '../ui/Card'
import { TrendingUp, TrendingDown } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string
    fill?: boolean
  }[]
}

interface DashboardProps {
  title: string
  charts: {
    type: 'line' | 'bar' | 'doughnut'
    title: string
    data: ChartData
    options?: any
  }[]
  stats?: {
    label: string
    value: string | number
    change?: number
    changeType?: 'increase' | 'decrease'
    icon?: React.ReactNode
    gradient?: string
  }[]
}

const Dashboard: React.FC<DashboardProps> = ({ title, charts, stats }) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 16,
          font: {
            size: 13,
            family: 'Inter, system-ui, sans-serif',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        borderRadius: 8,
        titleFont: {
          size: 13,
          weight: '600',
        },
        bodyFont: {
          size: 13,
        },
        displayColors: true,
        boxPadding: 6,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          color: '#64748b',
        },
      },
      y: {
        grid: {
          color: '#f1f5f9',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          color: '#64748b',
        },
      },
    },
  }

  const getChartComponent = (chart: any) => {
    const options = { ...defaultOptions, ...chart.options }

    switch (chart.type) {
      case 'line':
        return <Line data={chart.data} options={options} />
      case 'bar':
        return <Bar data={chart.data} options={options} />
      case 'doughnut':
        return <Doughnut data={chart.data} options={options} />
      default:
        return null
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-section text-neutral-950">{title}</h1>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => (
            <motion.div key={index} variants={itemVariants}>
              <StatCard
                label={stat.label}
                value={stat.value}
                change={stat.change}
                changeType={stat.changeType}
                icon={stat.icon}
                gradient={stat.gradient}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Charts */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`grid gap-6 ${charts.length === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}
      >
        {charts.map((chart, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-neutral-950 mb-6">
                {chart.title}
              </h3>
              <div className={charts.length === 1 ? 'h-[400px]' : 'h-80'}>
                {getChartComponent(chart)}
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

export default Dashboard
