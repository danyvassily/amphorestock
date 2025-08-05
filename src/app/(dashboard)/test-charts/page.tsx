'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockTrendChart } from "@/components/charts/StockTrendChart";
import { CategoryDonutChart } from "@/components/charts/CategoryDonutChart";
import { PopularProductsChart } from "@/components/charts/PopularProductsChart";
import { StatCardSparkline } from "@/components/charts/SparklineChart";

export default function TestChartsPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Test des Graphiques</h1>
      
      {/* Test des sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Sparkline - Tendance Positive</CardTitle>
          </CardHeader>
          <CardContent>
            <StatCardSparkline trend="up" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Sparkline - Tendance Négative</CardTitle>
          </CardHeader>
          <CardContent>
            <StatCardSparkline trend="down" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Sparkline - Neutre</CardTitle>
          </CardHeader>
          <CardContent>
            <StatCardSparkline trend="neutral" />
          </CardContent>
        </Card>
      </div>

      {/* Test du graphique de tendance */}
      <Card>
        <CardHeader>
          <CardTitle>Graphique de Tendance des Stocks</CardTitle>
        </CardHeader>
        <CardContent>
          <StockTrendChart />
        </CardContent>
      </Card>

      {/* Test du donut chart */}
      <Card>
        <CardHeader>
          <CardTitle>Graphique en Donut - Catégories</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryDonutChart />
        </CardContent>
      </Card>

      {/* Test du graphique des produits populaires */}
      <Card>
        <CardHeader>
          <CardTitle>Graphique des Produits Populaires</CardTitle>
        </CardHeader>
        <CardContent>
          <PopularProductsChart />
        </CardContent>
      </Card>
    </div>
  );
}