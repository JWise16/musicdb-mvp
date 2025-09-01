import { useClarity } from '../../../hooks/useClarity';

interface TimeFrameSelectorProps {
  timeFrame: 'YTD' | 'MTD' | 'ALL';
  onTimeFrameChange: (timeFrame: 'YTD' | 'MTD' | 'ALL') => void;
}

const TimeFrameSelector = ({ timeFrame, onTimeFrameChange }: TimeFrameSelectorProps) => {
  const { trackDashboard } = useClarity();
  
  const timeFrameOptions = [
    { value: 'YTD' as const, label: 'Year to Date' },
    { value: 'MTD' as const, label: 'Month to Date' },
    { value: 'ALL' as const, label: 'All Time' }
  ];

  const handleTimeFrameChange = (newTimeFrame: 'YTD' | 'MTD' | 'ALL') => {
    trackDashboard('timeframe_changed', { timeframe: newTimeFrame });
    onTimeFrameChange(newTimeFrame);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Time Frame:</span>
      <div className="flex bg-gray-100 rounded-lg p-1">
        {timeFrameOptions.map(option => (
          <button
            key={option.value}
            onClick={() => handleTimeFrameChange(option.value)}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              timeFrame === option.value
                ? 'bg-white font-bold text-black shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeFrameSelector; 