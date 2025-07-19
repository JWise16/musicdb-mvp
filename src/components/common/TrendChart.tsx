import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface TrendChartProps {
  data: { value: number }[];
  color: string;
  className?: string;
}

const TrendChart = ({ data, color, className = "" }: TrendChartProps) => {
  // If no data or insufficient data points, show a flat line
  if (!data || data.length < 2) {
    const fallbackData = [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }];
    return (
      <div className={`h-12 w-20 ${className}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={fallbackData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="#e5e7eb"
              strokeWidth={1.5}
              dot={false}
              activeDot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className={`h-12 w-20 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart; 