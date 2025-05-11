"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DollarSign, ShoppingBag, Package, RefreshCcw, TrendingUp, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getDashboardStats } from '../actions/admin'
import { Separator } from '@/components/ui/separator'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart, registerables } from 'chart.js'

// Регистрируем все компоненты Chart.js
Chart.register(...registerables);

interface DashboardStats {
  productsCount: number
  ordersCount: number
  totalSales: number
  completedSales: number
  newOrdersCount: number
  ordersByStatus: Record<string, number>
  popularProducts: Array<{id: number, name: string, count: number, total: number}>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getDashboardStats()
        setStats(data)
      } catch (error) {
        console.error('Ошибка при загрузке статистики:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <RefreshCcw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Данные для графика статусов заказов
  const orderStatusChartData = {
    labels: Object.keys(stats?.ordersByStatus || {}),
    datasets: [
      {
        label: 'Количество заказов',
        data: Object.values(stats?.ordersByStatus || {}),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Данные для графика популярных товаров
  const popularProductsChartData = {
    labels: stats?.popularProducts.map(p => p.name.slice(0, 20) + (p.name.length > 20 ? '...' : '')) || [],
    datasets: [
      {
        label: 'Количество продаж',
        data: stats?.popularProducts.map(p => p.total) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="container mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Панель управления</h1>
        <p className="text-muted-foreground">
          Обзор магазина и основная статистика
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общая выручка</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₽{stats?.totalSales.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              За все время
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выручка (выполненные)</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₽{stats?.completedSales.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Заказы со статусом "Выполнен"
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Новые заказы</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.newOrdersCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Ожидают обработки
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Товары</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.productsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Активных товаров
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Статусы заказов</CardTitle>
            <CardDescription>
              Распределение заказов по статусам
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex justify-center items-center">
            {stats?.ordersByStatus && Object.keys(stats.ordersByStatus).length > 0 ? (
              <Doughnut 
                data={orderStatusChartData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            ) : (
              <p className="text-muted-foreground">Нет данных о заказах</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Популярные товары</CardTitle>
            <CardDescription>
              Топ-5 самых продаваемых товаров
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {stats?.popularProducts && stats.popularProducts.length > 0 ? (
              <Bar 
                data={popularProductsChartData}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                }}
              />
            ) : (
              <p className="text-muted-foreground">Нет данных о популярных товарах</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Подробная информация о заказах</CardTitle>
          <CardDescription>
            Статистика заказов и продаж
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="status">
            <TabsList className="mb-4">
              <TabsTrigger value="status">По статусам</TabsTrigger>
              <TabsTrigger value="products">Популярные товары</TabsTrigger>
            </TabsList>
            <TabsContent value="status">
              <div className="space-y-4">
                {stats?.ordersByStatus && Object.keys(stats.ordersByStatus).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(stats.ordersByStatus).map(([status, count]) => {
                      let icon;
                      let color;

                      switch(status) {
                        case 'Новый':
                          icon = <AlertCircle className="h-5 w-5 text-blue-500" />;
                          color = 'bg-blue-50 text-blue-700';
                          break;
                        case 'В обработке':
                          icon = <Clock className="h-5 w-5 text-yellow-500" />;
                          color = 'bg-yellow-50 text-yellow-700';
                          break;
                        case 'Выполнен':
                          icon = <CheckCircle className="h-5 w-5 text-green-500" />;
                          color = 'bg-green-50 text-green-700';
                          break;
                        case 'Отменен':
                          icon = <AlertCircle className="h-5 w-5 text-red-500" />;
                          color = 'bg-red-50 text-red-700';
                          break;
                        default:
                          icon = <ShoppingBag className="h-5 w-5 text-gray-500" />;
                          color = 'bg-gray-50 text-gray-700';
                      }

                      return (
                        <div key={status} className={`p-4 rounded-lg ${color} flex items-center justify-between`}>
                          <div className="flex items-center gap-3">
                            {icon}
                            <div>
                              <div className="font-medium">{status}</div>
                              <div className="text-sm opacity-80">Заказов: {count}</div>
                            </div>
                          </div>
                          <div className="font-semibold text-lg">{((count / stats.ordersCount) * 100).toFixed(1)}%</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Нет данных о заказах</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="products">
              <div className="space-y-4">
                {stats?.popularProducts && stats.popularProducts.length > 0 ? (
                  <div className="space-y-4">
                    {stats.popularProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">ID: {product.id}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{product.total} шт.</div>
                          <div className="text-sm text-muted-foreground">{product.count} заказов</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Нет данных о популярных товарах</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
