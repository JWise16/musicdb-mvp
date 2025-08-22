import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

interface PercentSoldSliderProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  className?: string;
}

const PercentSoldSlider: React.FC<PercentSoldSliderProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const [localValue, setLocalValue] = useState(value);
  const sliderRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ value: [number, number]; clientX: number } | null>(null);
  
  // Generate unique ID for this slider instance
  const sliderId = useMemo(() => `percent-slider-${Math.random().toString(36).substr(2, 9)}`, []);

  // Update local value only when not dragging to prevent conflicts
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  const calculatePosition = useCallback((val: number) => {
    return Math.max(0, Math.min(100, val)); // Clamp and return percentage
  }, []);

  const calculateValue = useCallback((position: number) => {
    return Math.round(Math.max(0, Math.min(100, position)));
  }, []);

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
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue)) return;

    const clampedValue = Math.max(0, Math.min(100, numValue));
    const newValue: [number, number] = type === 'min' 
      ? [Math.min(clampedValue, localValue[1]), localValue[1]]
      : [localValue[0], Math.max(clampedValue, localValue[0])];
    
    setLocalValue(newValue);
    onChange(newValue);
  };

  const minPos = calculatePosition(localValue[0]);
  const maxPos = calculatePosition(localValue[1]);

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-4">
        {/* Slider container */}
        <div className="relative h-6 mb-4">
          {/* Slider track */}
          <div 
            ref={sliderRef}
            id={sliderId}
            className="absolute top-1/2 transform -translate-y-1/2 w-full h-2 bg-gray-200 rounded-full cursor-pointer touch-none"
          >
            {/* Active range */}
            <div
              className="absolute h-full bg-black rounded-full pointer-events-none"
              style={{
                left: `${minPos}%`,
                width: `${maxPos - minPos}%`,
              }}
            />
            
            {/* Min handle */}
            <div
              className={`absolute w-5 h-5 bg-white border-2 border-black rounded-full cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 shadow-sm hover:border-gray-800 transition-colors touch-none select-none ${isDragging === 'min' ? 'scale-110 border-gray-800' : ''}`}
              style={{ left: `${minPos}%`, top: '50%' }}
              onPointerDown={handlePointerDown('min')}
            />
            
            {/* Max handle */}
            <div
              className={`absolute w-5 h-5 bg-white border-2 border-black rounded-full cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 shadow-sm hover:border-gray-800 transition-colors touch-none select-none ${isDragging === 'max' ? 'scale-110 border-gray-800' : ''}`}
              style={{ left: `${maxPos}%`, top: '50%' }}
              onPointerDown={handlePointerDown('max')}
            />
          </div>
        </div>
        
        {/* Input fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Minimum</label>
            <input
              type="number"
              min={0}
              max={100}
              value={localValue[0]}
              onChange={(e) => handleInputChange('min', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-center"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Maximum</label>
            <input
              type="number"
              min={0}
              max={100}
              value={localValue[1]}
              onChange={(e) => handleInputChange('max', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-center"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PercentSoldSlider; 