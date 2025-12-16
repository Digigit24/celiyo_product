// src/components/dashboard/StatCard.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  subtitle?: string;
  value: string | number;
  previousValue?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  illustration?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: 'default' | 'gradient' | 'outlined';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  subtitle,
  value,
  previousValue,
  trend,
  illustration,
  action,
  className,
  variant = 'default',
}) => {
  const variantClasses = {
    default: 'bg-card',
    gradient: 'bg-gradient-to-br from-blue-500 to-purple-600 text-white',
    outlined: 'border-2 border-primary/20 bg-card',
  };

  return (
    <Card className={cn(variantClasses[variant], className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div>
              <h3 className={cn(
                "text-sm font-medium",
                variant === 'gradient' ? 'text-white/90' : 'text-muted-foreground'
              )}>
                {title}
              </h3>
              {subtitle && (
                <p className={cn(
                  "text-xs mt-1",
                  variant === 'gradient' ? 'text-white/70' : 'text-muted-foreground'
                )}>
                  {subtitle}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "text-3xl font-bold",
                  variant === 'gradient' ? 'text-white' : 'text-foreground'
                )}>
                  {value}
                </span>
                {trend && (
                  <span className={cn(
                    "text-sm font-medium flex items-center gap-1",
                    trend.isPositive
                      ? variant === 'gradient' ? 'text-white' : 'text-green-600'
                      : variant === 'gradient' ? 'text-white/90' : 'text-red-600'
                  )}>
                    {trend.isPositive ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {trend.value}%
                  </span>
                )}
              </div>

              {previousValue && (
                <p className={cn(
                  "text-xs",
                  variant === 'gradient' ? 'text-white/70' : 'text-muted-foreground'
                )}>
                  {previousValue}
                </p>
              )}
            </div>

            {action && (
              <Button
                onClick={action.onClick}
                size="sm"
                variant={variant === 'gradient' ? 'secondary' : 'default'}
                className="mt-2"
              >
                {action.label}
              </Button>
            )}
          </div>

          {illustration && (
            <div className="flex-shrink-0">
              {illustration}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
