"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  ColumnDef, 
  flexRender, 
  getCoreRowModel, 
  getPaginationRowModel, 
  useReactTable,
  SortingState,
  getSortedRowModel
} from "@tanstack/react-table"
import { Eye, RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { getOrders, updateOrderStatus, getOrder } from "@/app/actions/orders"

// Типы данных для заказов
interface OrderItem {
  id: number
  quantity: number
  price: number
  
  // Поля из нового API
  productId?: number
  title?: string
  
  // Поля из старого API
  product_id?: number
  order_id?: number
  product?: {
    id: number
    name: string
    sku?: string
  }
}

interface Order {
  id: number
  status: string
  
  // Поля из нового API
  userEmail?: string
  userName?: string
  userPhone?: string
  address?: string
  createdAt?: string
  updatedAt?: string
  totalPrice?: number
  items?: OrderItem[]
  
  // Поля из старого API
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  created_at?: string
  total_amount?: number
  orderItems?: OrderItem[]
}

// Отображаемые статусы заказов с соответствием серверным значениям
const orderStatuses = [
  { value: "CREATED", label: "Новый" },
  { value: "VIEWED", label: "В обработке" },
  { value: "COMPLETED", label: "Выполнен" },
  { value: "CANCELED", label: "Отменен" }
]

// Функция для форматирования даты
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Функция для определения цвета статуса
function getStatusColor(status: string) {
  switch (status) {
    case "CREATED":
      return "bg-blue-100 text-blue-800"
    case "VIEWED":
      return "bg-yellow-100 text-yellow-800"
    case "COMPLETED":
      return "bg-green-100 text-green-800"
    case "CANCELED":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function OrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({
    currentPage: Number.parseInt(searchParams.get("page") || "1", 10),
    totalPages: 1,
    limit: 10
  })
  
  // Фильтр по статусу
  const [statusFilter, setStatusFilter] = useState<string>("")
  
  // Состояние для просмотра деталей заказа
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  
  // Отладочный эффект для логирования товаров в заказе
  useEffect(() => {
    if (selectedOrder) {
      console.log("Render order details with items:", selectedOrder.items);
    }
  }, [selectedOrder]);
  
  // Загрузка заказов
  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await getOrders({
        status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
        limit: pagination.limit,
        offset: (pagination.currentPage - 1) * pagination.limit
      })
      
      if (response.success) {
        // Форматируем данные и обновляем состояние
        const orders = response.orders.map((order: any) => ({
          id: order.id,
          status: order.status,
          created_at: order.created_at,
          updated_at: order.updated_at,
          customer_name: order.customer_name,
          email: order.email,
          phone: order.phone,
          address: order.address,
          comment: order.comment,
          total_amount: order.total_amount,
          items_count: order.items_count,
          total_items: order.total_items
        }))
        
        setOrders(orders)
        setPagination(prev => ({
          ...prev,
          totalPages: Math.ceil((response.pagination?.total || 0) / pagination.limit)
        }))
      } else {
        console.error('Ошибка при загрузке заказов:', response.error)
      }
    } catch (error) {
      console.error('Ошибка при загрузке заказов:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Загружаем заказы при изменении пагинации или фильтра
  useEffect(() => {
    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.currentPage, pagination.limit, statusFilter])
  
  // Определение колонок таблицы
  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="text-center">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "customer_name",
      header: "Клиент",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("customer_name")}</div>
          <div className="text-sm text-muted-foreground">{row.original.customer_email}</div>
        </div>
      ),
    },
    {
      accessorKey: "total_amount",
      header: "Сумма",
      cell: ({ row }) => (
        <div className="text-right font-medium">
          ₽{Number(row.getValue("total_amount")).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Статус",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge className={getStatusColor(status)}>
            {orderStatuses.find(s => s.value === status)?.label || status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Дата",
      cell: ({ row }) => <div>{formatDate(row.getValue("created_at"))}</div>,
    },
    {
      id: "actions",
      header: "Действия",
      cell: ({ row }) => {
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/orders/${row.original.id}`)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Открыть
            </Button>
          </div>
        )
      },enableSorting: false,
    },
  ]
  
  // Инициализация таблицы
  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })
  
  // Обработка просмотра заказа
  const handleViewOrder = async (orderId: number) => {
    try {
      setLoading(true)
      const response = await getOrder({ orderId })
      
      if (response.success && response.order) {
        // Убедимся, что полученный заказ соответствует ожидаемой структуре Order
        const order = {
          ...response.order,
          // Поля для отображения данных клиента
          customer_name: response.order.customer_name || response.order.userName || '',
          customer_email: response.order.customer_email || response.order.userEmail || response.order.email || '',
          customer_phone: response.order.customer_phone || response.order.userPhone || response.order.phone || '',
          // Товары в заказе
          items: response.order.items || [],
          orderItems: response.order.items || []
        } as Order;
        
        // Подробный лог для отладки
        console.log("Loaded order:", order);
        console.log("Items in order:", order.items);
        console.log("Order items structure:", JSON.stringify(order.items, null, 2));
        setSelectedOrder(order);
        setDetailsOpen(true);
      } else {
        toast({
          title: "Ошибка",
          description: response.error || "Не удалось загрузить информацию о заказе",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Ошибка при загрузке деталей заказа:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить информацию о заказе",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Обработка изменения статуса заказа
  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      setUpdatingStatus(true)
      console.log(`Обновление статуса заказа #${orderId} на ${newStatus}`);
      const response = await updateOrderStatus({ orderId, status: newStatus })
      
      // Проверяем наличие полных данных в ответе
      console.log("Ответ от updateOrderStatus:", JSON.stringify(response, null, 2));
      
      if (response.success) {
        toast({
          title: "Успешно",
          description: "Статус заказа обновлен",
          variant: "default"
        })
        
        // Если в ответе есть данные заказа с товарами, используем их
        if (response.order) {
          console.log("Найдены данные заказа в ответе:", JSON.stringify(response.order, null, 2));
          // Дополнительная валидация наличия товаров
          const hasItems = response.order.items && Array.isArray(response.order.items) && response.order.items.length > 0;
          console.log(`Заказ содержит товары: ${hasItems} (количество: ${hasItems ? response.order.items.length : 0})`);
          // Обновляем выбранный заказ
          setSelectedOrder(response.order);
        } else {
          // Если в ответе нет данных заказа, делаем дополнительный запрос
          console.log("Загрузка полных данных заказа через getOrder");
          const orderDetails = await getOrder({ orderId });
          
          if (orderDetails.success && orderDetails.order) {
            console.log("Получены данные через getOrder:", JSON.stringify(orderDetails.order, null, 2));
            // Обновляем данные заказа с полной информацией
            const fullOrder = {
              ...orderDetails.order,
              // Поля для отображения данных клиента
              customer_name: orderDetails.order.customer_name || orderDetails.order.userName || '',
              customer_email: orderDetails.order.customer_email || orderDetails.order.userEmail || orderDetails.order.email || '',
              customer_phone: orderDetails.order.customer_phone || orderDetails.order.userPhone || orderDetails.order.phone || '',
              // Обновляем статус заказа
              status: newStatus,
              // Товары в заказе
              items: orderDetails.order.items || [],
              orderItems: orderDetails.order.items || []
            } as Order;
            
            console.log("Updated order with items:", JSON.stringify(fullOrder.items, null, 2));
            setSelectedOrder(fullOrder);
          } else {
            // Если не удалось загрузить полную информацию, просто обновляем статус
            if (selectedOrder && selectedOrder.id === orderId) {
              setSelectedOrder({ ...selectedOrder, status: newStatus })
            }
          }
        }
        
        // Обновляем список заказов
        setOrders(prev => 
          prev.map(order => 
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        )
        
        // Перезагружаем список заказов для обновления данных
        loadOrders()
      } else {
        toast({
          title: "Ошибка",
          description: response.error || "Не удалось обновить статус заказа",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Ошибка при обновлении статуса заказа:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус заказа",
        variant: "destructive"
      })
    } finally {
      setUpdatingStatus(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <RefreshCcw className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Заказы</h1>
          <p className="text-muted-foreground">Управление заказами и отслеживание статусов</p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPagination(prev => ({ ...prev, currentPage: 1 })); // При смене фильтра возвращаемся на первую страницу
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Все статусы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              {orderStatuses.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="rounded-md border">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <Input
            placeholder="Поиск заказов..."
            className="max-w-sm"
            // Реализовать поиск по заказам
          />
          <Select
            value={pagination.limit.toString()}
            onValueChange={(value) => 
              setPagination({ ...pagination, limit: parseInt(value), currentPage: 1 })
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="10 на странице" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 на странице</SelectItem>
              <SelectItem value="10">10 на странице</SelectItem>
              <SelectItem value="20">20 на странице</SelectItem>
              <SelectItem value="50">50 на странице</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Заказы не найдены.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-end space-x-2 p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => 
              setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })
            }
            disabled={pagination.currentPage <= 1}
          >
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            Страница {pagination.currentPage} из {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => 
              setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })
            }
            disabled={pagination.currentPage >= pagination.totalPages}
          >
            Далее
          </Button>
        </div>
      </div>
      
      {/* Диалог деталей заказа */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Заказ #{selectedOrder.id}</DialogTitle>
                <DialogDescription>
                  Оформлен {formatDate(selectedOrder.createdAt || selectedOrder.created_at || new Date().toISOString())}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Информация о клиенте</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">ФИО</dt>
                          <dd>{selectedOrder.userName || selectedOrder.customer_name || 'Не указано'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                          <dd>{selectedOrder.userEmail || selectedOrder.customer_email || 'Не указано'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Телефон</dt>
                          <dd>{selectedOrder.userPhone || selectedOrder.customer_phone || 'Не указано'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Адрес</dt>
                          <dd>{selectedOrder.address || 'Не указано'}</dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Статус заказа</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(selectedOrder.status)}>
                            {orderStatuses.find(s => s.value === selectedOrder.status)?.label || selectedOrder.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Текущий статус
                          </span>
                        </div>
                        
                        <div>
                          <label htmlFor="status-select" className="text-sm font-medium">
                            Изменить статус
                          </label>
                          <Select
                            disabled={updatingStatus}
                            value={selectedOrder.status}
                            onValueChange={(value) => handleStatusChange(selectedOrder.id, value)}
                          >
                            <SelectTrigger id="status-select">
                              <SelectValue placeholder="Выберите статус" />
                            </SelectTrigger>
                            <SelectContent>
                              {orderStatuses.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Товары в заказе</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Товар</TableHead>
                          <TableHead className="text-right">Цена</TableHead>
                          <TableHead className="text-center">Кол-во</TableHead>
                          <TableHead className="text-right">Сумма</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Отладочная информация - вызываем консольный лог через useEffect */}
                        {selectedOrder && selectedOrder.items && selectedOrder.items.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              Товары в заказе не найдены
                            </TableCell>
                          </TableRow>
                        )}
                        {/* Отладочная информация о товарах в заказе */}
                        {selectedOrder && (
                          <>
                            {console.log("Rendering items in dialog:", selectedOrder.items)}
                          </>
                        )}
                        
                        {selectedOrder && Array.isArray(selectedOrder.items) && selectedOrder.items.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-start gap-3">
                                {(item.product?.image || item.image_url) && (
                                  <div className="relative w-10 h-10 overflow-hidden rounded border">
                                    <img 
                                      src={item.product?.image || item.image_url || ''} 
                                      alt={item.title || item.product?.name || 'Товар'}
                                      className="object-cover w-full h-full"
                                    />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{item.title || item.name || (item.product?.name) || 'Товар'}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {item.product?.sku ? `Артикул: ${item.product.sku}` : 
                                      `ID: ${item.productId || item.product_id || (item.product?.id) || ''}`}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              ₽{(item.price || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.quantity || 1}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ₽{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    <div className="flex justify-end mt-4 pt-4 border-t">
                      <div className="text-right space-y-1">
                        <div className="text-lg font-bold">
                          Итого: ₽{(selectedOrder.totalPrice || selectedOrder.total_amount || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <DialogFooter>
                <Button onClick={() => setDetailsOpen(false)}>
                  Закрыть
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
