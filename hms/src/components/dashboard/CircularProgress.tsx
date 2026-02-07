// src/components/dashboard/CircularProgress.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface CircularProgressProps {
  title: string;
  value: number;
  maxValue?: number;
  label?: string;
  sublabel?: string;
  color?: string;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  title,
  value,
  maxValue = 100,
  label,
  sublabel,
  color = '#3b82f6',
  className,
}) => {
  const percentage = (value / maxValue) * 100;

  const data = [
    { name: 'Completed', value: percentage },
    { name: 'Remaining', value: 100 - percentage },
  ];

  const COLORS = [color, '#e5e7eb'];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={450}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{value}</div>
              {label && <div className="text-xs text-muted-foreground mt-1">{label}</div>}
            </div>
          </div>
        </div>

        {sublabel && (
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">{sublabel}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
