import React, { useState, useRef, useEffect } from 'react';
import RangeSlider from './RangeSlider';

interface VenueSizeDropdownProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  histogram?: number[];
}

const formatRange = (range: [number, number]) => {
  const [min, max] = range;
  return `${min} - ${max >= 1000 ? '1000+' : max}`;
};

const VenueSizeDropdown: React.FC<VenueSizeDropdownProps> = ({ min, max, value, onChange, histogram }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Handle range change and close dropdown
  const handleRangeChange = (range: [number, number]) => {
    onChange(range);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-left focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-sm text-gray-700 font-medium">Venue Size</span>
        <span className="ml-2 text-gray-900 font-semibold">{formatRange(value)}</span>
        <svg
          className={`ml-auto w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 left-0 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg p-4 min-w-[260px]">
          <RangeSlider
            min={min}
            max={max}
            value={value}
            onChange={handleRangeChange}
            histogram={histogram}
          />
        </div>
      )}
    </div>
  );
};

export default VenueSizeDropdown; 