"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import * as z from "zod"
import Link from "next/link"
import Image from "next/image"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/components/cart-provider"
import { createOrder } from "@/app/actions/orders"

// Определяем схему валидации напрямую в компоненте
const orderFormSchema = z.object({
  customerName: z.string().min(2, { message: "Имя должно содержать минимум 2 символа" }),
  email: z.string().email({ message: "Укажите корректный email адрес" }),
  phone: z.string().min(10, { message: "Укажите корректный номер телефона" }),
  address: z.string().optional(),
  comment: z.string().optional(),
})

type OrderFormValues = z.infer<typeof orderFormSchema>

const defaultValues: Partial<OrderFormValues> = {
  customerName: "",
  email: "",
  phone: "",
  address: "",
  comment: "",
}

export default function CheckoutPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { cartItems, getTotalPrice, clearCart } = useCart()
  
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues,
  })
  
  const totalPrice = getTotalPrice()
  
  // Если корзина пуста, перенаправляем на страницу корзины
  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Корзина пуста</h1>
        <p className="text-muted-foreground mb-8">Добавьте товары в корзину, чтобы оформить заказ</p>
        <Button asChild>
          <Link href="/catalog">Перейти в каталог</Link>
        </Button>
      </div>
    )
  }
  
  async function onSubmit(values: OrderFormValues) {
    try {
      setIsSubmitting(true)
      
      // Делаем дополнительную обработку товаров для совместимости
      // убедимся, что все поля заполнены корректно
      const enhancedCartItems = cartItems.map(item => ({
        ...item,
        title: item.name, // Дублируем name в title для совместимости
        product_id: Number(item.id),
        productId: Number(item.id),
        product: {
          id: Number(item.id),
          name: item.name,
          image: item.image
        }
      }));
      
      console.log('Товары для отправки:', enhancedCartItems);
      
      // Преобразуем данные формы в формат, ожидаемый серверным экшеном
      const result = await createOrder({
        cartItems: enhancedCartItems,
        totalAmount: totalPrice,
        customerName: values.customerName,
        email: values.email,
        phone: values.phone,
        address: values.address,
        comment: values.comment
      })
      
      if (result.success) {
        toast({
          title: "Заказ успешно оформлен",
          description: "Спасибо за ваш заказ! Мы свяжемся с вами в ближайшее время.",
        })
        clearCart() // Очищаем корзину после успешного оформления заказа
        router.push(`/checkout/success?orderId=${result.orderId}`)
      } else {
        toast({
          title: "Ошибка при оформлении заказа",
          description: result.error || "Пожалуйста, попробуйте еще раз позднее",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Произошла непредвиденная ошибка. Пожалуйста, попробуйте еще раз позднее",
        variant: "destructive",
      })
      console.error("Ошибка при оформлении заказа:", error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Оформление заказа</h1>
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <h2 className="text-lg font-semibold mb-4">Ваши данные</h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ФИО</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите ваше имя" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="example@mail.ru" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Телефон</FormLabel>
                        <FormControl>
                          <Input placeholder="+7 (999) 123-45-67" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Адрес доставки</FormLabel>
                      <FormControl>
                        <Input placeholder="Город, улица, дом, квартира" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Комментарий к заказу</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Дополнительная информация по заказу" 
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Оформить заказ
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <h2 className="text-lg font-semibold mb-4">Ваш заказ</h2>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3 py-2">
                  <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-contain"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium line-clamp-2">{item.name}</p>
                    <div className="text-sm text-muted-foreground flex justify-between mt-1">
                      <span>{item.quantity} шт × {item.price.toLocaleString()} ₽</span>
                      <span className="font-medium text-foreground">{(item.price * item.quantity).toLocaleString()} ₽</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Товары ({cartItems.length}):</span>
                <span>{totalPrice.toLocaleString()} ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Доставка:</span>
                <span>Бесплатно</span>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex justify-between font-bold text-lg">
              <span>Итого:</span>
              <span>{totalPrice.toLocaleString()} ₽</span>
            </div>
            
            <div className="mt-6">
              <Button 
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push('/cart')}
              >
                Вернуться в корзину
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
