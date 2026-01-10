import React from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  gradient?: boolean
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = false,
  gradient = false 
}) => {
  const Component = hover ? motion.div : 'div'
  const hoverProps = hover ? {
    whileHover: { y: -4, transition: { duration: 0.3 } },
  } : {}

  return (
    <Component
      {...hoverProps}
      className={`
        bg-white rounded-2xl border border-neutral-200/50 
        ${gradient ? 'bg-gradient-to-b from-white to-neutral-50' : ''}
        ${hover ? 'hover:shadow-soft-lg transition-all duration-300' : 'shadow-soft'}
        ${className}
      `}
    >
      {children}
    </Component>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease'
  icon?: React.ReactNode
  gradient?: string
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  changeType,
  icon,
  gradient = 'from-primary-500 to-primary-600'
}) => {
  return (
    <Card hover gradient className="p-6">
      <div className="flex items-start justify-between mb-4">
        {icon && (
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} shadow-soft`}>
            {icon}
          </div>
        )}
        {change !== undefined && (
          <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
            changeType === 'increase' 
              ? 'bg-teal-50 text-teal-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            <span>{changeType === 'increase' ? '↗' : '↘'}</span>
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-neutral-600 mb-2">
        {label}
      </p>
      <p className="text-3xl font-bold text-neutral-950">
        {value}
      </p>
    </Card>
  )
}
