'use client'

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { RefreshCcw, FileText, ArrowLeft } from "lucide-react"
import html2pdf from 'html2pdf.js'

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { getOrder, updateOrderStatus } from "@/app/actions/orders"

// Типы данных для заказов
interface OrderItem {
  id: number
  quantity: number
  price: number
  image_url?: string
  
  // Поля из нового API
  productId?: number
  title?: string
  name?: string
  
  // Поля из старого API
  product_id?: number
  order_id?: number
  product?: {
    id: number
    name: string
    sku?: string
    image?: string
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
  email?: string
  customer_email?: string
  customer_phone?: string
  phone?: string
  created_at?: string
  total_amount?: number
  comment?: string
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
  if (!dateString) return "Нет данных"
  
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  } catch (e) {
    return dateString
  }
}

// Функция для форматирования цены
function formatPrice(price: number | undefined) {
  if (price === undefined) return "0 ₽"
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  }).format(price)
}

// Получение соответствующего лейбла статуса
function getStatusLabel(status: string) {
  const statusItem = orderStatuses.find(s => s.value === status)
  return statusItem ? statusItem.label : status
}

// Получение класса для бейджа в зависимости от статуса
function getStatusVariant(status: string) {
  switch(status) {
    case 'CREATED': return 'default'
    case 'VIEWED': return 'blue'
    case 'COMPLETED': return 'green'
    case 'CANCELED': return 'destructive'
    default: return 'secondary'
  }
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  
  const orderContentRef = useRef<HTMLDivElement>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  
  // Функция экспорта заказа в PDF
  async function exportToPdf() {
    if (!orderContentRef.current || !order) return
    
    try {
      setExporting(true)
      
      const element = orderContentRef.current
      const options = {
        margin: 10,
        filename: `Заказ_${order.id}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }
      
      await html2pdf().set(options).from(element).save()
      
      toast({
        title: 'Успешно',
        description: 'Заказ экспортирован в PDF',
      })
    } catch (error) {
      console.error('Ошибка при экспорте в PDF:', error)
      toast({
        title: 'Ошибка',
        description: 'Не удалось экспортировать заказ в PDF',
        variant: 'destructive'
      })
    } finally {
      setExporting(false)
    }
  }
  
  // Загрузка данных о заказе
  async function loadOrder() {
    setLoading(true)
    try {
      const response = await getOrder({ orderId })
      
      if (response.order) {
        const order = {
          ...response.order,
          // Поля для отображения данных клиента
          customer_name: response.order.customer_name || response.order.userName || '',
          customer_email: response.order.customer_email || response.order.userEmail || response.order.email || '',
          customer_phone: response.order.customer_phone || response.order.userPhone || response.order.phone || '',
          // Поля для отображения данных заказа
          items: response.order.items || response.order.orderItems || [],
          total_amount: response.order.total_amount || response.order.totalPrice || 0
        }
        
        console.log("Загруженные товары заказа:", order.items);
        setOrder(order)
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить информацию о заказе",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Ошибка при загрузке заказа:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить информацию о заказе",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Обновление статуса заказа
  async function handleStatusChange(status: string) {
    if (!order) return
    
    setSaving(true)
    try {
      const response = await updateOrderStatus({ orderId: order.id.toString(), status })
      
      if (response.success) {
        // Обновляем локальные данные о заказе
        setOrder(prevOrder => prevOrder ? { ...prevOrder, status } : null)
        
        toast({
          title: "Статус обновлен",
          description: `Статус заказа изменен на "${getStatusLabel(status)}"`,
        })
      } else {
        toast({
          title: "Ошибка",
          description: response.error || "Не удалось обновить статус заказа",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Ошибка при обновлении статуса:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус заказа",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }
  
  // Загружаем данные при монтировании компонента
  useEffect(() => {
    if (orderId) {
      loadOrder()
    }
  }, [orderId])
  
  return (
    <div className="px-4 py-10 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Заказ #{orderId}</h1>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push('/admin/orders')}
            title="Вернуться к списку заказов"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => loadOrder()}
            title="Обновить информацию о заказе"
            disabled={loading}
          >
            <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={exportToPdf}
            title="Экспортировать заказ в PDF"
            disabled={exporting || !order}
          >
            <FileText className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {loading && !order ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Загрузка данных заказа...</p>
        </div>
      ) : !order ? (
        <div className="py-20 text-center">
          <p>Заказ не найден</p>
          <Button 
            variant="link" 
            onClick={() => router.push('/admin/orders')}
            className="mt-2"
          >
            Вернуться к списку заказов
          </Button>
        </div>
      ) : (
        <div ref={orderContentRef} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Информация о заказе */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Информация о заказе</CardTitle>
              <CardDescription>Детали заказа #{order.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Номер заказа</h3>
                    <p className="font-semibold">{order.id}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Дата создания</h3>
                    <p>{formatDate(order.created_at || order.createdAt || '')}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Сумма заказа</h3>
                    <p className="font-semibold">{formatPrice(order.total_amount)}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Клиент</h3>
                    <p className="font-semibold">{order.customer_name || 'Нет данных'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
                    <p>{order.customer_email || 'Нет данных'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Телефон</h3>
                    <p>{order.customer_phone || 'Нет данных'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Статус заказа</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(order.status) as any}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Адрес</h3>
                    <p>{order.address || 'Нет данных'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Комментарий</h3>
                    <p>{order.comment || 'Нет данных'}</p>
                  </div>
                </div>
              </div>
              
              {/* Изменение статуса */}
              <div className="mt-8">
                <h3 className="font-medium mb-2">Изменить статус заказа</h3>
                <div className="flex items-center gap-4">
                  <Select
                    defaultValue={order.status}
                    onValueChange={handleStatusChange}
                    disabled={saving}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Выберите статус" />
                    </SelectTrigger>
                    <SelectContent>
                      {orderStatuses.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {saving && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Товары в заказе */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Товары в заказе</CardTitle>
              <CardDescription>
                {order.items && order.items.length > 0 
                  ? `Количество товаров: ${order.items.length}`
                  : 'Нет товаров в заказе'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(!order.items || order.items.length === 0) ? (
                <div className="py-6 text-center text-muted-foreground">
                  Нет товаров в заказе
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Товар</TableHead>
                      <TableHead className="text-right">Цена</TableHead>
                      <TableHead className="text-right">Количество</TableHead>
                      <TableHead className="text-right">Сумма</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-start gap-3">
                            {/* Отображение изображения товара */}
                            <div className="relative w-10 h-10 overflow-hidden rounded border">
                              <img 
                                src={item.image_url || (item.product?.image) || '/placeholder-product.jpg'} 
                                alt={item.name || item.title || (item.product?.name) || 'Товар'}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <div>
                              <div className="font-medium">{item.name || item.title || (item.product?.name) || 'Товар'}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.product?.sku ? `Артикул: ${item.product.sku}` : 
                                  `ID: ${item.productId || item.product_id || (item.product?.id) || ''}`}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatPrice(item.price)}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatPrice(item.price * item.quantity)}</TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Итоговая строка */}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-bold">
                        Итого:
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatPrice(order.total_amount)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
