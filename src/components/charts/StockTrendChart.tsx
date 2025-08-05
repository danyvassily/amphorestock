'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface StockDataPoint {
  date: string;
  totalStock: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

interface StockTrendChartProps {
  data?: StockDataPoint[];
  height?: number;
  title?: string;
}

// Données simulées pour la démonstration
const mockStockData: StockDataPoint[] = [
  { date: '01/11', totalStock: 450, lowStock: 12, outOfStock: 3, totalValue: 15400 },
  { date: '02/11', totalStock: 440, lowStock: 15, outOfStock: 2, totalValue: 15200 },
  { date: '03/11', totalStock: 465, lowStock: 8, outOfStock: 1, totalValue: 16100 },
  { date: '04/11', totalStock: 470, lowStock: 10, outOfStock: 2, totalValue: 16300 },
  { date: '05/11', totalStock: 445, lowStock: 18, outOfStock: 4, totalValue: 15800 },
  { date: '06/11', totalStock: 480, lowStock: 6, outOfStock: 1, totalValue: 16800 },
  { date: '07/11', totalStock: 475, lowStock: 9, outOfStock: 2, totalValue: 16600 },
  { date: '08/11', totalStock: 490, lowStock: 5, outOfStock: 1, totalValue: 17200 },
  { date: '09/11', totalStock: 485, lowStock: 7, outOfStock: 3, totalValue: 17000 },
  { date: '10/11', totalStock: 500, lowStock: 4, outOfStock: 0, totalValue: 17500 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-900 mb-2">{`Date: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm text-gray-700">
            <span className="font-medium" style={{ color: entry.color }}>{entry.name}:</span> {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function StockTrendChart({ 
  data = mockStockData, 
  height = 300, 
  title = "Évolution du Stock"
}: StockTrendChartProps) {
  
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="totalStock" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="lowStock" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="outOfStock" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          <Area
            type="monotone"
            dataKey="totalStock"
            stackId="1"
            stroke="#10b981"
            fill="url(#totalStock)"
            strokeWidth={2}
            name="Stock Total"
          />
          <Area
            type="monotone"
            dataKey="lowStock"
            stackId="2"
            stroke="#f59e0b"
            fill="url(#lowStock)"
            strokeWidth={2}
            name="Stock Faible"
          />
          <Area
            type="monotone"
            dataKey="outOfStock"
            stackId="3"
            stroke="#ef4444"
            fill="url(#outOfStock)"
            strokeWidth={2}
            name="Rupture"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}