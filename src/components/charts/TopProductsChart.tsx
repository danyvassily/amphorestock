'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ProductSales } from '@/types';

interface TopProductsChartProps {
  data: ProductSales[];
  title?: string;
  height?: number;
  maxProducts?: number;
  showRevenue?: boolean;
  showSales?: boolean;
  showProfit?: boolean;
}

export function TopProductsChart({ 
  data, 
  title = "Top produits", 
  height = 300,
  maxProducts = 10,
  showRevenue = true,
  showSales = false,
  showProfit = false
}: TopProductsChartProps) {
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
    .slice(0, maxProducts)
    .map(item => ({
      name: item.productName.length > 15 
        ? item.productName.substring(0, 15) + '...' 
        : item.productName,
      fullName: item.productName,
      revenue: item.revenue,
      sales: item.salesCount,
      profit: item.profit,
      averagePrice: item.averagePrice,
      category: item.category
    }));

  // Fonction pour le tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-card-foreground mb-2">{data.fullName}</p>
          
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-muted-foreground">
              {entry.name}:               <span 
                className="font-semibold text-primary" 
              >
                {entry.name.includes('Chiffre') || entry.name.includes('Bénéfice') || entry.name.includes('Prix')
                  ? formatCurrency(entry.value)
                  : entry.value
                }
              </span>
            </p>
          ))}
          
          <p className="text-sm text-muted-foreground">
            Prix moyen: <span className="font-semibold">{formatCurrency(data.averagePrice)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={60}
            tick={{ fontSize: 11 }}
            interval={0}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={showRevenue || showProfit ? formatCurrency : undefined}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {showRevenue && (
            <Bar
              dataKey="revenue"
              name="Chiffre d'affaires"
              fill="#10b981"
              radius={[2, 2, 0, 0]}
            />
          )}
          
          {showSales && (
            <Bar
              dataKey="sales"
              name="Ventes"
              fill="#f59e0b"
              radius={[2, 2, 0, 0]}
            />
          )}
          
          {showProfit && (
            <Bar
              dataKey="profit"
              name="Bénéfice"
              fill="#3b82f6"
              radius={[2, 2, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
      
      {/* Liste complémentaire des produits */}
      <div className="mt-6 space-y-2">
        <h4 className="font-medium text-sm text-muted-foreground mb-3">Détail des performances</h4>
        <div className="grid gap-2 max-h-40 overflow-y-auto">
          {data.slice(0, maxProducts).map((product, index) => (
            <div key={product.productId} className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-semibold text-muted-foreground">#{index + 1}</span>
                <span className="font-medium truncate">{product.productName}</span>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <span className="text-muted-foreground">Ventes: </span>
                  <span className="font-semibold">{product.salesCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">CA: </span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(product.revenue)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Bénéfice: </span>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(product.profit)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}