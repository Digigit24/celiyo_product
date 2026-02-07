// src/components/dashboard/BarChart.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BarChartProps {
  title: string;
  data: Array<{
    name: string;
    value: number;
  }>;
  color?: string;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  title,
  data,
  color = '#3b82f6',
  className,
}) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium">{payload[0].payload.name}</p>
          <p className="text-sm" style={{ color }}>
            Value: {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <RechartsBarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
            <XAxis
              dataKey="name"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              axisLine={false}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              fill={color}
              radius={[8, 8, 0, 0]}
            />
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
