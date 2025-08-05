'use client';

import React from 'react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface SparklineData {
  value: number;
  date?: string;
}

interface SparklineChartProps {
  data?: SparklineData[];
  height?: number;
  color?: string;
  type?: 'line' | 'area';
  trend?: 'up' | 'down' | 'neutral';
}

// Données simulées pour différents types de sparklines
const generateMockData = (trend: 'up' | 'down' | 'neutral' = 'neutral', points: number = 12): SparklineData[] => {
  const data: SparklineData[] = [];
  let baseValue = 100;
  
  for (let i = 0; i < points; i++) {
    let variation;
    switch (trend) {
      case 'up':
        variation = Math.random() * 15 + 2; // Tendance haussière
        break;
      case 'down':
        variation = Math.random() * -15 - 2; // Tendance baissière
        break;
      default:
        variation = (Math.random() - 0.5) * 20; // Neutre
    }
    
    baseValue += variation;
    data.push({
      value: Math.max(0, baseValue),
      date: `Day ${i + 1}`
    });
  }
  
  return data;
};

export function SparklineChart({ 
  data, 
  height = 60, 
  color = '#10b981',
  type = 'line',
  trend = 'neutral'
}: SparklineChartProps) {
  
  const chartData = data || generateMockData(trend);
  
  // Déterminer la couleur selon la tendance
  const getColor = () => {
    if (color !== '#10b981') return color; // Si une couleur spécifique est fournie
    
    switch (trend) {
      case 'up':
        return '#10b981'; // Vert
      case 'down':
        return '#ef4444'; // Rouge
      default:
        return '#6b7280'; // Gris
    }
  };

  const finalColor = getColor();

  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`gradient-${trend}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={finalColor} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={finalColor} stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={finalColor}
            fill={`url(#gradient-${trend})`}
            strokeWidth={2}
            dot={false}
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={finalColor}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3, stroke: finalColor, strokeWidth: 2, fill: '#fff' }}
          animationDuration={1000}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Composant spécialisé pour les cartes de stats
interface StatCardSparklineProps {
  trend: 'up' | 'down' | 'neutral';
  type?: 'line' | 'area';
  className?: string;
}

export function StatCardSparkline({ trend, type = 'area', className = '' }: StatCardSparklineProps) {
  return (
    <div className={`w-full h-12 ${className}`}>
      <SparklineChart 
        trend={trend} 
        type={type}
        height={48}
      />
    </div>
  );
}