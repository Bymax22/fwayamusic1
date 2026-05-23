"use client";

import { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { COUNTRIES } from '@/lib/countries';

interface CountrySelectProps {
  label: string;
  value: string;
  onChange: (countryCode: string) => void;
  error?: string;
}

export function CountrySelect({ label, value, onChange, error }: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = COUNTRIES.find(c => c.code === value);
  
  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2.5 bg-[#101010] text-white text-left flex items-center justify-between rounded-3xl ring-1 ring-white/10 hover:ring-purple-500 focus:outline-none transition-all"
        >
          <span className="flex items-center gap-2">
            {selectedCountry ? (
              <>
                <span className="text-lg">{selectedCountry.flag}</span>
                <span>{selectedCountry.name}</span>
              </>
            ) : (
              <span className="text-gray-400">Select a country</span>
            )}
          </span>
          <FaChevronDown
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#101010] ring-1 ring-purple-500/30 z-50 max-h-96 overflow-hidden flex flex-col rounded-3xl">
            <div className="p-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-[#0f0f0f] text-white text-sm placeholder-gray-500 focus:outline-none rounded-2xl"
              />
            </div>
            <div className="overflow-y-auto">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    onChange(country.code);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-all rounded-3xl ${
                    value === country.code ? 'bg-purple-700/20' : 'hover:bg-[#111]'
                  }`}
                >
                  <span className="text-lg">{country.flag}</span>
                  <div>
                    <div className="text-white text-sm">{country.name}</div>
                    <div className="text-gray-400 text-xs">{country.code}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
