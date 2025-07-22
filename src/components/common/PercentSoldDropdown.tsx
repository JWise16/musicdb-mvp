import React, { useState, useRef, useEffect } from 'react';
import PercentSoldSlider from './PercentSoldSlider';

interface PercentSoldDropdownProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

const formatPercentRange = (range: [number, number]) => {
  const [min, max] = range;
  return `${min}% - ${max}%`;
};

const PercentSoldDropdown: React.FC<PercentSoldDropdownProps> = ({ value, onChange }) => {
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

  // Handle range change
  const handleRangeChange = (range: [number, number]) => {
    onChange(range);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-gray-200 text-left focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-gray-900 font-semibold">{formatPercentRange(value)}</span>
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
        <div className="absolute z-20 left-0 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg p-4 min-w-[220px]">
          <PercentSoldSlider
            value={value}
            onChange={handleRangeChange}
          />
        </div>
      )}
    </div>
  );
};

export default PercentSoldDropdown; 