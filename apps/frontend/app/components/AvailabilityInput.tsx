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
    if (status === 'available') return <FaCheck className="text-purple/75" />;
    if (status === 'taken') return <FaTimes className="text-purple/75" />;
    return null;
  };

  const getStatusText = () => {
    if (status === 'checking') return 'Checking...';
    if (status === 'available') return 'Available';
    if (status === 'taken') return field === 'email' ? 'Email already in use' : 'Username taken';
    return null;
  };

  const statusColor = {
    unknown: 'text-white/60',
    checking: 'text-white/60',
    available: 'text-purple/75',
    taken: 'text-purple/75',
  }[status];

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-white/90 mb-2">
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
          className={`w-full px-4 py-3 rounded-xl bg-background text-white placeholder-white/60 focus:outline-none transition-colors ${
            disabled
              ? 'cursor-not-allowed opacity-70 bg-background'
              : error || status === 'taken'
              ? 'focus:ring-2 focus:ring-purple/75'
              : status === 'available'
              ? 'focus:ring-2 focus:ring-purple/75'
              : 'focus:ring-2 focus:ring-purple/75'
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
        <p className="text-xs text-purple/75 mt-1">{error}</p>
      )}
    </div>
  );
}
