"use client";

import { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';

interface AvailabilityInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  field: 'email' | 'username';
  status: 'unknown' | 'checking' | 'available' | 'taken';
  onCheckAvailability: (field: 'email' | 'username', value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
}

export function AvailabilityInput({
  label,
  placeholder,
  value,
  onChange,
  field,
  status,
  onCheckAvailability,
  onBlur,
  disabled,
  error,
}: AvailabilityInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    onChange(nextValue);
    if (nextValue && (field === 'email' || field === 'username')) {
      onCheckAvailability(field, nextValue);
    }
  };

  const handleBlur = () => {
    if (value && (field === 'email' || field === 'username')) {
      onCheckAvailability(field, value);
    }
    onBlur?.();
  };

  const getStatusIcon = () => {
    if (status === 'checking') return <FaSpinner className="animate-spin" />;
    if (status === 'available') return <FaCheck className="text-green-500" />;
    if (status === 'taken') return <FaTimes className="text-red-500" />;
    return null;
  };

  const getStatusText = () => {
    if (status === 'checking') return 'Checking...';
    if (status === 'available') return 'Available';
    if (status === 'taken') return field === 'email' ? 'Email already in use' : 'Username taken';
    return null;
  };

  const statusColor = {
    unknown: 'text-gray-400',
    checking: 'text-gray-400',
    available: 'text-green-500',
    taken: 'text-red-500',
  }[status];

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={field === 'email' ? 'email' : 'text'}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={`w-full px-4 py-3 rounded-3xl bg-[#101010] text-white placeholder-gray-500 focus:outline-none transition-colors ring-1 ${
            disabled
              ? 'cursor-not-allowed opacity-70 bg-[#0b0b0b] ring-white/10'
              : error || status === 'taken'
              ? 'ring-red-500 focus:ring-red-500'
              : status === 'available'
              ? 'ring-emerald-500 focus:ring-emerald-500'
              : 'ring-white/10 focus:ring-purple-500'
          }`}
        />
        {status !== 'unknown' && (
          <div className="absolute right-3 top-3 flex items-center gap-2">
            {getStatusIcon()}
            {status !== 'checking' && (
              <span className={`text-xs font-medium ${statusColor}`}>
                {getStatusText()}
              </span>
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
