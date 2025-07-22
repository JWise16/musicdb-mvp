import React, { useState, useEffect, useCallback } from 'react';

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

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const calculatePosition = useCallback((val: number) => {
    return val; // Already in percentage
  }, []);

  const calculateValue = useCallback((position: number) => {
    return Math.round(Math.max(0, Math.min(100, position)));
  }, []);

  const handleMouseDown = (handle: 'min' | 'max') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(handle);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const slider = document.getElementById('percent-slider-track');
    if (!slider) return;

    const rect = slider.getBoundingClientRect();
    const position = ((e.clientX - rect.left) / rect.width) * 100;
    const newValue = calculateValue(position);

    setLocalValue(prev => {
      if (isDragging === 'min') {
        return [Math.min(newValue, prev[1]), prev[1]];
      } else {
        return [prev[0], Math.max(newValue, prev[0])];
      }
    });
  }, [isDragging, calculateValue]);

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
            id="percent-slider-track"
            className="absolute top-1/2 transform -translate-y-1/2 w-full h-2 bg-gray-200 rounded-full cursor-pointer"
          >
            {/* Active range */}
            <div
              className="absolute h-full bg-black rounded-full"
              style={{
                left: `${minPos}%`,
                width: `${maxPos - minPos}%`,
              }}
            />
            
            {/* Min handle */}
            <div
              className="absolute w-5 h-5 bg-white border-2 border-black rounded-full cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 shadow-sm hover:border-gray-800 transition-colors"
              style={{ left: `${minPos}%`, top: '50%' }}
              onMouseDown={handleMouseDown('min')}
            />
            
            {/* Max handle */}
            <div
              className="absolute w-5 h-5 bg-white border-2 border-black rounded-full cursor-grab active:cursor-grabbing transform -translate-x-1/2 -translate-y-1/2 shadow-sm hover:border-gray-800 transition-colors"
              style={{ left: `${maxPos}%`, top: '50%' }}
              onMouseDown={handleMouseDown('max')}
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