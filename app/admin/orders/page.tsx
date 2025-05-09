"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { getAllOrders, updateOrderStatus, getOrderDetails } from "@/app/actions/admin"

// Тип для заказа
interface OrderItem {
  id: number
  product_id: number
  order_id: number
  quantity: number
  price: number
  product: {
    id: number
    name: string
    sku: string
  }
}

interface Order {
  id: number
  customer_name: string
  customer_email: string
  customer_phone: string
  status: string
  total_amount: number
  created_at: string
  orderItems: OrderItem[]
}

// Отображаемые статусы заказов
const orderStatuses = [
  { value: "новый", label: "Новый" },
  { value: "обработка", label: "В обработке" },
  { value: "отправлен", label: "Отправлен" },
  { value: "доставлен", label: "Доставлен" },
  { value: "отменен", label: "Отменен" }
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
    case "новый":
      return "bg-blue-100 text-blue-800"
    case "обработка":
      return "bg-yellow-100 text-yellow-800"
    case "отправлен":
      return "bg-indigo-100 text-indigo-800"
    case "доставлен":
      return "bg-green-100 text-green-800"
    case "отменен":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 10
  })
  
  // Состояние для просмотра деталей заказа
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  
  // Загрузка заказов
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true)
        const response = await getAllOrders(pagination.currentPage, pagination.limit)
        setOrders(response.orders)
        setPagination({
          currentPage: response.pagination.currentPage,
          totalPages: response.pagination.totalPages,
          limit: pagination.limit
        })
      } catch (error) {
        console.error('Ошибка при загрузке заказов:', error)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить заказы",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadOrders()
  }, [pagination.currentPage, pagination.limit])
  
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
      cell: ({ row }) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleViewOrder(row.original.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
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
      const result = await getOrderDetails(orderId)
      
      if (result.success && result.order) {
        setSelectedOrder(result.order)
        setDetailsOpen(true)
      } else {
        toast({
          title: "Ошибка",
          description: result.error || "Не удалось загрузить детали заказа",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Ошибка при получении деталей заказа:", error)
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при загрузке деталей заказа",
        variant: "destructive"
      })
    }
  }
  
  // Обработка изменения статуса заказа
  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      setUpdatingStatus(true)
      const result = await updateOrderStatus(orderId, newStatus)
      
      if (result.success) {
        // Обновляем статус заказа в локальном состоянии
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ))
        
        if (selectedOrder) {
          setSelectedOrder({ ...selectedOrder, status: newStatus })
        }
        
        toast({
          title: "Успех",
          description: "Статус заказа обновлен",
        })
      } else {
        toast({
          title: "Ошибка",
          description: result.error || "Не удалось обновить статус заказа",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Ошибка при обновлении статуса заказа:", error)
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при обновлении статуса",
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Заказы</h1>
        <p className="text-muted-foreground">
          Управление заказами клиентов
        </p>
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
                  Оформлен {formatDate(selectedOrder.created_at)}
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
                          <dd>{selectedOrder.customer_name}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                          <dd>{selectedOrder.customer_email}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Телефон</dt>
                          <dd>{selectedOrder.customer_phone}</dd>
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
                          <label className="text-sm font-medium">
                            Изменить статус
                          </label>
                          <Select
                            disabled={updatingStatus}
                            value={selectedOrder.status}
                            onValueChange={(value) => handleStatusChange(selectedOrder.id, value)}
                          >
                            <SelectTrigger>
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
                        {selectedOrder.orderItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.product.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  Артикул: {item.product.sku}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              ₽{item.price.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ₽{(item.price * item.quantity).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    <div className="flex justify-end mt-4 pt-4 border-t">
                      <div className="text-right space-y-1">
                        <div className="text-lg font-bold">
                          Итого: ₽{selectedOrder.total_amount.toLocaleString()}
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
