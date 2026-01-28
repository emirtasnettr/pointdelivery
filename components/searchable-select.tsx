'use client';

import { useState, useRef, useEffect } from 'react';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  className?: string;
  emptyMessage?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Seçin veya ara...',
  disabled = false,
  id,
  'aria-label': ariaLabel,
  className = '',
  emptyMessage = 'Sonuç bulunamadı',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = query.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase().trim())
      )
    : options;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        aria-controls={id ? `${id}-listbox` : undefined}
        id={id}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`flex min-h-[44px] w-full cursor-pointer items-center justify-between rounded-xl border border-gray-300 bg-white px-4 py-3 text-left text-sm outline-none transition focus:border-[#16B24B] focus:ring-4 focus:ring-[#16B24B]/10 ${
          disabled ? 'cursor-not-allowed bg-gray-50 opacity-60' : ''
        }`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {open && (
        <div
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          <div className="border-b border-gray-100 p-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setOpen(false);
              }}
              placeholder="Ara..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#16B24B]"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-500">
                {emptyMessage}
              </div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  role="option"
                  aria-selected={opt.value === value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setQuery('');
                    setOpen(false);
                  }}
                  className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    opt.value === value
                      ? 'bg-[#16B24B]/10 font-medium text-[#118836]'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
