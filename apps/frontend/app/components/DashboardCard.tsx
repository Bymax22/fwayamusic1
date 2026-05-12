"use client";

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface DashboardCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  change?: string;
  color: string;
  onClick?: () => void;
  loading?: boolean;
  className?: string;
}

export function DashboardCard({
  title,
  value,
  icon,
  change,
  color,
  onClick,
  loading = false,
  className = ''
}: DashboardCardProps) {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br ${color} p-4 rounded-xl shadow-lg animate-pulse ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-white/20 rounded mb-2"></div>
            <div className="h-6 bg-white/20 rounded"></div>
          </div>
          <div className="w-8 h-8 bg-white/20 rounded-full"></div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-gradient-to-br ${color} p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-xl font-bold text-white mb-1">{value}</div>
          <div className="text-white/90 text-sm">{title}</div>
        </div>
        <div className="text-white/80 text-lg">
          {icon}
        </div>
      </div>
      {change && (
        <div className="mt-2 text-white/80 text-xs flex items-center gap-1">
          <span className={change.startsWith('+') ? 'text-green-300' : change.startsWith('-') ? 'text-red-300' : 'text-white/80'}>
            {change}
          </span>
        </div>
      )}
    </motion.div>
  );
}