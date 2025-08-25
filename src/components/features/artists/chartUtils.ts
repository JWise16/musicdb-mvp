import type { VibrateTimeSeriesData } from '../../../services/vibrateService';

export interface ChartDataPoint {
  date: string;
  value: number;
  formattedDate: string;
}

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

export const processTimeSeriesData = (data: VibrateTimeSeriesData): ChartDataPoint[] => {
  if (!data || Object.keys(data).length === 0) {
    return [];
  }

  const sortedEntries = Object.entries(data)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
  
  return sortedEntries.map(([date, value]) => ({
    date,
    value,
    formattedDate: formatDate(date)
  }));
};

export const getValueRange = (data: ChartDataPoint[]): [number, number] => {
  if (data.length === 0) return [0, 100];
  
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Add some padding to the range
  const padding = (max - min) * 0.1;
  return [Math.max(0, min - padding), max + padding];
};

export const calculateGrowth = (data: ChartDataPoint[]): number => {
  if (data.length < 2) return 0;
  
  const first = data[0].value;
  const last = data[data.length - 1].value;
  
  if (first === 0) return 0;
  
  return ((last - first) / first) * 100;
};
