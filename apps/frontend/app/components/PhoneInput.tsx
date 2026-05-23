"use client";

import { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { COUNTRIES, getCountryByCode } from '@/lib/countries';

interface PhoneInputProps {
  label: string;
  value: string;
  countryCode: string;
  onPhoneChange: (phone: string) => void;
  onCountryChange: (countryCode: string) => void;
  error?: string;
}

export function PhoneInput({
  label,
  value,
  countryCode,
  onPhoneChange,
  onCountryChange,
  error,
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = getCountryByCode(countryCode) || COUNTRIES[0];
  
  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm)
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        {/* Country Code Dropdown */}
        <div className="relative w-24" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-3 py-2.5 bg-[#101010] text-white text-sm flex items-center justify-center gap-1 rounded-3xl ring-1 ring-white/10 hover:ring-purple-500 focus:outline-none transition-all"
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <FaChevronDown className="text-xs" />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#101010] ring-1 ring-purple-500/30 z-50 max-h-64 overflow-hidden flex flex-col w-48 rounded-3xl">
              <div className="p-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f0f0f] text-white text-xs placeholder-gray-500 focus:outline-none rounded-2xl"
                />
              </div>
              <div className="overflow-y-auto">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => {
                      onCountryChange(country.code);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-800 transition-colors text-xs ${
                      countryCode === country.code ? 'bg-purple-600' : ''
                    }`}
                  >
                    <span className="text-base">{country.flag}</span>
                    <span>{country.dialCode}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <div className="flex-1">
          <input
            type="tel"
            placeholder="Phone number"
            value={value}
            onChange={(e) => {
              const phoneNumber = e.target.value.replace(/\D/g, '');
              onPhoneChange(phoneNumber);
            }}
            className={`w-full px-4 py-2.5 rounded-3xl bg-[#101010] text-white placeholder-gray-500 focus:outline-none transition-colors ring-1 ${
              error
                ? 'ring-red-500 focus:ring-red-500'
                : 'ring-white/10 focus:ring-purple-500'
            }`}
          />
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
