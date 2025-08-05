'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { CategorySales } from '@/types';

interface CategoryPieChartProps {
  data: CategorySales[];
  title?: string;
  height?: number;
  showPercentage?: boolean;
}

// Couleurs pour les différentes catégories
const CATEGORY_COLORS: { [key: string]: string } = {
  'vin-rouge': '#dc2626',
  'vin-blanc': '#fbbf24',
  'vin-rose': '#ec4899',
  'vins': '#8b5cf6',
  'spiritueux': '#f97316',
  'bieres': '#eab308',
  'softs': '#06b6d4',
  'autres': '#6b7280',
  'champagne': '#fde047',
  'digestifs': '#a855f7',
  'aperitifs': '#10b981'
};

const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] || '#6b7280';
};

const getCategoryLabel = (category: string): string => {
  const labels: { [key: string]: string } = {
    'vin-rouge': '🍷 Vins rouges',
    'vin-blanc': '🥂 Vins blancs', 
    'vin-rose': '🌹 Vins rosés',
    'vins': '🍾 Autres vins',
    'spiritueux': '🥃 Spiritueux',
    'bieres': '🍺 Bières',
    'softs': '🥤 Softs',
    'autres': '📦 Autres',
    'champagne': '🍾 Champagnes',
    'digestifs': '🥃 Digestifs',
    'aperitifs': '🍸 Apéritifs'
  };
  return labels[category] || category;
};

export function CategoryPieChart({ 
  data, 
  title = "Répartition par catégorie", 
  height = 300,
  showPercentage = true 
}: CategoryPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">Aucune donnée disponible</p>
          <p className="text-sm">Les graphiques apparaîtront après les premières ventes</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Préparer les données pour le graphique
  const chartData = data
    .filter(item => item.revenue > 0)
    .map(item => ({
      name: getCategoryLabel(item.category),
      value: item.revenue,
      sales: item.salesCount,
      profit: item.profit,
      percentage: item.percentage,
      color: getCategoryColor(item.category)
    }))
    .sort((a, b) => b.value - a.value);

  // Fonction pour le tooltip personnalisé
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-card-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            CA: <span className="font-semibold text-green-600">{formatCurrency(data.value)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Ventes: <span className="font-semibold">{data.sales}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Bénéfice: <span className="font-semibold text-blue-600">{formatCurrency(data.profit)}</span>
          </p>
          {showPercentage && (
            <p className="text-sm text-muted-foreground">
              Part: <span className="font-semibold">{data.percentage.toFixed(1)}%</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Fonction pour personnaliser les labels
  const renderLabel = (entry: any) => {
    if (showPercentage && entry.percentage > 5) {
      return `${entry.percentage.toFixed(0)}%`;
    }
    return null;
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                stroke={entry.color}
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value, entry: any) => (
              <span className="text-muted-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Résumé sous le graphique */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
        {chartData.slice(0, 6).map((item, index) => (
          <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
            <div 
              className="w-3 h-3 rounded-full bg-primary" 
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.name}</p>
              <p className="text-muted-foreground">{formatCurrency(item.value)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}