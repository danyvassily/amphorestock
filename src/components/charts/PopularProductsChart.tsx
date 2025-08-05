'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Badge } from '@/components/ui/badge';

interface ProductData {
  name: string;
  sales: number;
  stock: number;
  category: string;
  trend: 'up' | 'down' | 'stable';
  stockStatus: 'good' | 'low' | 'critical';
}

interface PopularProductsChartProps {
  data?: ProductData[];
  height?: number;
  title?: string;
  maxProducts?: number;
}

// Données simulées attrayantes
const mockProductData: ProductData[] = [
  { name: 'Château Margaux 2019', sales: 85, stock: 12, category: 'Vin Rouge', trend: 'up', stockStatus: 'low' },
  { name: 'Hennessy XO', sales: 72, stock: 8, category: 'Cognac', trend: 'up', stockStatus: 'critical' },
  { name: 'Dom Pérignon 2012', sales: 68, stock: 15, category: 'Champagne', trend: 'stable', stockStatus: 'good' },
  { name: 'Macallan 18 ans', sales: 61, stock: 6, category: 'Whisky', trend: 'up', stockStatus: 'critical' },
  { name: 'Chablis Premier Cru', sales: 55, stock: 22, category: 'Vin Blanc', trend: 'down', stockStatus: 'good' },
  { name: 'Rémy Martin VSOP', sales: 48, stock: 18, category: 'Cognac', trend: 'stable', stockStatus: 'good' },
  { name: 'Krug Grande Cuvée', sales: 42, stock: 9, category: 'Champagne', trend: 'up', stockStatus: 'low' },
  { name: 'Bollinger RD 2008', sales: 38, stock: 14, category: 'Champagne', trend: 'stable', stockStatus: 'good' },
];

const getBarColor = (stockStatus: string, trend: string) => {
  if (stockStatus === 'critical') return '#ef4444'; // Rouge
  if (stockStatus === 'low') return '#f59e0b'; // Orange
  if (trend === 'up') return '#10b981'; // Vert
  if (trend === 'down') return '#6b7280'; // Gris
  return '#3b82f6'; // Bleu par défaut
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up':
      return '📈';
    case 'down':
      return '📉';
    default:
      return '➡️';
  }
};

const getStockBadge = (stockStatus: string, stock: number) => {
  const variants = {
    good: 'default' as const,
    low: 'secondary' as const,
    critical: 'destructive' as const
  };
  
  const labels = {
    good: 'Stock OK',
    low: 'Stock faible',
    critical: 'Critique'
  };
  
  return (
    <Badge variant={variants[stockStatus as keyof typeof variants]} className="text-xs">
      {labels[stockStatus as keyof typeof labels]} ({stock})
    </Badge>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-200 min-w-[200px]">
        <p className="font-semibold text-gray-900 mb-2">{data.name}</p>
        <p className="text-sm text-gray-600 mb-1">
          <span className="font-medium">Ventes:</span> {data.sales}
        </p>
        <p className="text-sm text-gray-600 mb-1">
          <span className="font-medium">Stock:</span> {data.stock} unités
        </p>
        <p className="text-sm text-gray-600 mb-1">
          <span className="font-medium">Catégorie:</span> {data.category}
        </p>
        <p className="text-sm text-gray-600 flex items-center gap-1">
          <span className="font-medium">Tendance:</span> 
          {getTrendIcon(data.trend)} 
          {data.trend === 'up' ? 'Hausse' : data.trend === 'down' ? 'Baisse' : 'Stable'}
        </p>
      </div>
    );
  }
  return null;
};

export function PopularProductsChart({ 
  data = mockProductData, 
  height = 400, 
  title = "Produits Populaires",
  maxProducts = 8
}: PopularProductsChartProps) {
  
  const chartData = data.slice(0, maxProducts);

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-center text-gray-800">{title}</h3>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique principal */}
        <div className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={chartData}
              layout="horizontal"
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fontSize: 11 }}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="sales" 
                radius={[0, 4, 4, 0]}
                animationDuration={1000}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.stockStatus, entry.trend)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Liste détaillée */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 mb-4">Détails & Stock</h4>
          <div className="space-y-3 max-h-[350px] overflow-y-auto">
            {chartData.map((product, index) => (
              <div 
                key={product.name}
                className="p-3 rounded-lg border hover:shadow-sm transition-shadow bg-white"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-sm text-gray-900 truncate">
                      {product.name}
                    </h5>
                    <p className="text-xs text-gray-500">{product.category}</p>
                  </div>
                  <span className="text-lg ml-2">{getTrendIcon(product.trend)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">{product.sales}</span> ventes
                  </div>
                  {getStockBadge(product.stockStatus, product.stock)}
                </div>
                
                {/* Barre de progression pour les ventes */}
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(product.sales / Math.max(...chartData.map(p => p.sales))) * 100}%`,
                        backgroundColor: getBarColor(product.stockStatus, product.trend)
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}