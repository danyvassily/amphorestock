'use client';

import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { Badge } from '@/components/ui/badge';

interface CategoryData {
  name: string;
  value: number;
  count: number;
  percentage: number;
  color: string;
}

interface CategoryDonutChartProps {
  data?: CategoryData[];
  height?: number;
  title?: string;
}

// Couleurs vibrantes pour les catégories
const COLORS = [
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#84cc16', // Lime
  '#f97316', // Orange
  '#ec4899', // Pink
  '#6366f1'  // Indigo
];

// Données simulées attrayantes
const mockCategoryData: CategoryData[] = [
  { name: 'Vins', value: 12500, count: 45, percentage: 35, color: COLORS[0] },
  { name: 'Spiritueux', value: 8700, count: 32, percentage: 24, color: COLORS[1] },
  { name: 'Bières', value: 6200, count: 28, percentage: 17, color: COLORS[2] },
  { name: 'Softs', value: 4800, count: 25, percentage: 13, color: COLORS[3] },
  { name: 'Champagnes', value: 3200, count: 12, percentage: 9, color: COLORS[4] },
  { name: 'Autres', value: 800, count: 8, percentage: 2, color: COLORS[5] },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-900 mb-2">{data.name}</p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Valeur:</span> {data.value.toLocaleString('fr-FR')}€
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Produits:</span> {data.count}
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Part:</span> {data.percentage}%
        </p>
      </div>
    );
  }
  return null;
};

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percentage < 5) return null; // Ne pas afficher les labels pour les petites sections

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-xs font-bold drop-shadow-sm"
    >
      {`${percentage}%`}
    </text>
  );
};

export function CategoryDonutChart({ 
  data = mockCategoryData, 
  height = 350, 
  title = "Répartition par Catégories"
}: CategoryDonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const totalProducts = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">{title}</h3>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        {/* Graphique en donut */}
        <div className="relative">
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={120}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                animationBegin={0}
                animationDuration={800}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={activeIndex === index ? '#fff' : 'none'}
                    strokeWidth={activeIndex === index ? 3 : 0}
                                          className={`transition-all duration-200 ${
                        activeIndex === index 
                          ? 'brightness-110 scale-105' 
                          : 'hover:brightness-105'
                      }`}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Centre du donut avec stats totales */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {totalValue.toLocaleString('fr-FR')}€
              </div>
              <div className="text-sm text-gray-500">
                {totalProducts} produits
              </div>
            </div>
          </div>
        </div>

        {/* Légende interactive */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 mb-4">Détail par catégorie</h4>
          {data.map((category, index) => (
            <div 
              key={category.name}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${
                activeIndex === index 
                  ? 'bg-gray-50 border-gray-300 shadow-sm' 
                  : 'hover:bg-gray-25'
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <div>
                  <div className="font-medium text-gray-900">{category.name}</div>
                  <div className="text-sm text-gray-500">{category.count} produits</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {category.value.toLocaleString('fr-FR')}€
                </div>
                <Badge variant="secondary" className="text-xs">
                  {category.percentage}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}