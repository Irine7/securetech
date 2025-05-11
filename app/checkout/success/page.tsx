"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  
  // Здесь можно отслеживать конверсии или выполнять другие действия после успешного заказа
  useEffect(() => {
    // Для примера, можно добавить аналитику
    console.log("Order successfully placed, ID:", orderId)
  }, [orderId])
  
  return (
    <div className="container mx-auto py-16 px-4 text-center">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg border shadow-sm">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Заказ успешно оформлен!</h1>
        
        <p className="text-muted-foreground mb-6">
          Спасибо за ваш заказ! Номер вашего заказа: <span className="font-semibold">#{orderId}</span>.
          Мы отправили подтверждение на указанный вами email.
        </p>
        
        <p className="text-muted-foreground mb-8">
          Наш менеджер свяжется с вами в ближайшее время для уточнения деталей.
        </p>
        
        <div className="flex flex-col space-y-4">
          <Button asChild>
            <Link href="/catalog">Продолжить покупки</Link>
          </Button>
          
          <Button variant="outline" asChild>
            <Link href="/">Вернуться на главную</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
