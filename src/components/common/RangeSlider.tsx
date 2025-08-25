import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  histogram?: number[];
  className?: string;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  value,
  onChange,
  step = 1,
  histogram = [],
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const [localValue, setLocalValue] = useState(value);
  const [inputValues, setInputValues] = useState({ min: value[0].toString(), max: value[1].toString() });
  const [isInputFocused, setIsInputFocused] = useState<'min' | 'max' | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ value: [number, number]; clientX: number } | null>(null);
  
  // Generate unique ID for this slider instance
  const sliderId = useMemo(() => `range-slider-${Math.random().toString(36).substr(2, 9)}`, []);

  // Update local value and input values when prop changes (but not when dragging or input is focused)
  useEffect(() => {
    if (!isDragging && !isInputFocused) {
      setLocalValue(value);
      setInputValues({ min: value[0].toString(), max: value[1].toString() });
    }
  }, [value, isDragging, isInputFocused]);

  const calculatePosition = useCallback((val: number) => {
    return ((val - min) / (max - min)) * 100;
  }, [min, max]);

  const calculateValue = useCallback((position: number) => {
    const rawValue = min + (position / 100) * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    return Math.max(min, Math.min(max, steppedValue));
  }, [min, max, step]);

  const updateValue = useCallback((clientX: number) => {
    if (!sliderRef.current || !isDragging || !dragStartRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const position = ((clientX - rect.left) / rect.width) * 100;
    const newValue = calculateValue(position);

    setLocalValue(prev => {
      const updated: [number, number] = isDragging === 'min' 
        ? [Math.min(newValue, prev[1]), prev[1]]
        : [prev[0], Math.max(newValue, prev[0])];
      
      return updated;
    });
  }, [isDragging, calculateValue]);

  const handlePointerDown = (handle: 'min' | 'max') => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Capture pointer for consistent tracking
    if (e.currentTarget instanceof Element) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    
    setIsDragging(handle);
    dragStartRef.current = {
      value: localValue,
      clientX: e.clientX
    };
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    updateValue(e.clientX);
  }, [isDragging, updateValue]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    // Release pointer capture
    if (e.target instanceof Element) {
      e.target.releasePointerCapture(e.pointerId);
    }
    
    // Final update and commit changes
    updateValue(e.clientX);
    onChange(localValue);
    setIsDragging(null);
    dragStartRef.current = null;
  }, [isDragging, localValue, onChange, updateValue]);

  // Set up global event listeners when dragging starts
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      document.addEventListener('pointercancel', handlePointerUp);
      
      return () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
        document.removeEventListener('pointercancel', handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  const handleInputChange = (type: 'min' | 'max', inputValue: string) => {
    // Update input display immediately
    setInputValues(prev => ({
      ...prev,
      [type]: inputValue
    }));

    // Parse the value (remove any '+' symbols)
    const cleanValue = inputValue.replace('+', '');
    const numValue = parseInt(cleanValue, 10);
    
    // If invalid or empty, don't update the actual value yet
    if (isNaN(numValue) || cleanValue === '') {
      return;
    }

    // Clamp the value to valid range
    const clampedValue = Math.max(min, Math.min(max, numValue));
    
    // Create new range value
    const newValue: [number, number] = type === 'min' 
      ? [Math.min(clampedValue, localValue[1]), localValue[1]]
      : [localValue[0], Math.max(clampedValue, localValue[0])];
    
    // Update local value and commit to parent
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleInputBlur = (type: 'min' | 'max') => () => {
    setIsInputFocused(null);
    
    // Validate and fix input value on blur
    const inputValue = inputValues[type];
    const cleanValue = inputValue.replace('+', '');
    const numValue = parseInt(cleanValue, 10);
    
    if (isNaN(numValue) || cleanValue === '') {
      // Reset to current local value
      setInputValues(prev => ({
        ...prev,
        [type]: localValue[type === 'min' ? 0 : 1].toString()
      }));
    } else {
      // Ensure the value is properly clamped and formatted
      const clampedValue = Math.max(min, Math.min(max, numValue));
      setInputValues(prev => ({
        ...prev,
        [type]: clampedValue.toString()
      }));
    }
  };

  const handleInputFocus = (type: 'min' | 'max') => () => {
    setIsInputFocused(type);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow Enter key to blur the input
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
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
            ref={sliderRef}
            id={sliderId}
            className="absolute w-full h-1 bg-gray-300 rounded-full cursor-pointer touch-none"
            style={{ bottom: '-1px' }}
          >
            {/* Active range */}
            <div
              className="absolute h-full bg-gray-900 rounded-full pointer-events-none"
              style={{
                left: `${minPos}%`,
                width: `${maxPos - minPos}%`,
              }}
            />
            
            {/* Min handle */}
            <div
              className={`absolute w-6 h-6 bg-white border-2 border-gray-400 rounded-full cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 shadow-sm hover:border-gray-600 transition-colors touch-none select-none ${isDragging === 'min' ? 'scale-110 border-gray-600' : ''}`}
              style={{ left: `${minPos}%`, top: '50%' }}
              onPointerDown={handlePointerDown('min')}
            />
            
            {/* Max handle */}
            <div
              className={`absolute w-6 h-6 bg-white border-2 border-gray-400 rounded-full cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 shadow-sm hover:border-gray-600 transition-colors touch-none select-none ${isDragging === 'max' ? 'scale-110 border-gray-600' : ''}`}
              style={{ left: `${maxPos}%`, top: '50%' }}
              onPointerDown={handlePointerDown('max')}
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
                value={inputValues.min}
                onChange={(e) => handleInputChange('min', e.target.value)}
                onFocus={handleInputFocus('min')}
                onBlur={handleInputBlur('min')}
                onKeyDown={handleInputKeyDown}
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
                value={inputValues.max}
                onChange={(e) => handleInputChange('max', e.target.value)}
                onFocus={handleInputFocus('max')}
                onBlur={handleInputBlur('max')}
                onKeyDown={handleInputKeyDown}
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