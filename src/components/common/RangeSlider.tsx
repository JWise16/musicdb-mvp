import React, { useState, useEffect, useCallback } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  formatValue?: (value: number) => string;
  histogram?: number[];
  className?: string;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  value,
  onChange,
  step = 1,
  formatValue = (val) => val.toString(),
  histogram = [],
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const calculatePosition = useCallback((val: number) => {
    return ((val - min) / (max - min)) * 100;
  }, [min, max]);

  const calculateValue = useCallback((position: number) => {
    const rawValue = min + (position / 100) * (max - min);
    return Math.round(rawValue / step) * step;
  }, [min, max, step]);

  const handleMouseDown = (handle: 'min' | 'max') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(handle);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const slider = document.getElementById('range-slider-track');
    if (!slider) return;

    const rect = slider.getBoundingClientRect();
    const position = ((e.clientX - rect.left) / rect.width) * 100;
    const newValue = Math.max(min, Math.min(max, calculateValue(position)));

    setLocalValue(prev => {
      if (isDragging === 'min') {
        return [Math.min(newValue, prev[1]), prev[1]];
      } else {
        return [prev[0], Math.max(newValue, prev[0])];
      }
    });
  }, [isDragging, min, max, calculateValue]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      onChange(localValue);
      setIsDragging(null);
    }
  }, [isDragging, localValue, onChange]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleInputChange = (type: 'min' | 'max', inputValue: string) => {
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue)) return;

    const clampedValue = Math.max(min, Math.min(max, numValue));
    const newValue: [number, number] = type === 'min' 
      ? [Math.min(clampedValue, localValue[1]), localValue[1]]
      : [localValue[0], Math.max(clampedValue, localValue[0])];
    
    setLocalValue(newValue);
    onChange(newValue);
  };

  const minPos = calculatePosition(localValue[0]);
  const maxPos = calculatePosition(localValue[1]);

  // Generate histogram bars
  const histogramBars = histogram.length > 0 ? (
    <div className="absolute left-0 right-0 flex items-end justify-between px-1" style={{ height: '44px', bottom: '12px' }}>
      {histogram.map((count, index) => {
        const height = Math.max(2, (count / Math.max(...histogram)) * 36);
        return (
          <div
            key={index}
            className="bg-gray-300 rounded-sm opacity-70"
            style={{
              width: `${90 / histogram.length}%`,
              height: `${height}px`,
            }}
          />
        );
      })}
    </div>
  ) : null;

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Venue Size
        </label>
        <p className="text-xs text-gray-500 mb-4">
          Capacity, includes all fees
        </p>
        
        {/* Histogram with slider on x-axis */}
        <div className="relative h-16 mb-4">
          {/* Histogram bars positioned above the slider */}
          {histogramBars}
          
          {/* Slider track positioned at bottom as x-axis */}
          <div 
            id="range-slider-track"
            className="absolute w-full h-1 bg-gray-300 rounded-full cursor-pointer"
            style={{ bottom: '-1px' }}
          >
            {/* Active range */}
            <div
              className="absolute h-full bg-gray-900 rounded-full"
              style={{
                left: `${minPos}%`,
                width: `${maxPos - minPos}%`,
              }}
            />
            
            {/* Min handle */}
            <div
              className="absolute w-6 h-6 bg-white border-2 border-gray-400 rounded-full cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 shadow-sm hover:border-gray-600 transition-colors"
              style={{ left: `${minPos}%`, top: '50%' }}
              onMouseDown={handleMouseDown('min')}
            />
            
            {/* Max handle */}
            <div
              className="absolute w-6 h-6 bg-white border-2 border-gray-400 rounded-full cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 shadow-sm hover:border-gray-600 transition-colors"
              style={{ left: `${maxPos}%`, top: '50%' }}
              onMouseDown={handleMouseDown('max')}
            />
          </div>
        </div>
        
        {/* Input fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Minimum</label>
            <div className="relative">
              <input
                type="number"
                min={min}
                max={max}
                value={localValue[0]}
                onChange={(e) => handleInputChange('min', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-center"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Maximum</label>
            <div className="relative">
              <input
                type="number"
                min={min}
                max={max}
                value={localValue[1] >= 1000 ? '1000+' : localValue[1]}
                onChange={(e) => handleInputChange('max', e.target.value.replace('+', ''))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-center"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RangeSlider; 