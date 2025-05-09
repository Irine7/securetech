"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart } from "@/components/cart-provider"
import { Separator } from "@/components/ui/separator"

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart()
  const [promoCode, setPromoCode] = useState("")

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Корзина пуста</h1>
        <p className="text-muted-foreground mb-8">В вашей корзине пока нет товаров</p>
        <Button asChild>
          <Link href="/catalog" className="flex items-center gap-2">
            Перейти в каталог
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Корзина</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted p-4 font-medium grid grid-cols-12">
              <div className="col-span-6">Товар</div>
              <div className="col-span-2 text-center">Цена</div>
              <div className="col-span-2 text-center">Количество</div>
              <div className="col-span-2 text-center">Сумма</div>
            </div>

            {cartItems.map((item) => (
              <div key={item.id} className="p-4 border-t grid grid-cols-12 items-center">
                <div className="col-span-6 flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    <Image
                      src={"/placeholder-test.svg?height=64&width=64"}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-contain"
                      unoptimized
                    />
                  </div>
                  <div>
                    <Link href={`/product/${item.id}`} className="font-medium hover:text-orange-500">
                      {item.name}
                    </Link>
                  </div>
                </div>

                <div className="col-span-2 text-center">{item.price.toLocaleString()} ₽</div>

                <div className="col-span-2 flex items-center justify-center">
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-none"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, Number.parseInt(e.target.value) || 1)}
                      className="h-8 w-12 border-0 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-none"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="col-span-2 flex items-center justify-between">
                  <span className="font-medium">{(item.price * item.quantity).toLocaleString()} ₽</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-red-500"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-4">
            <Button variant="outline" className="text-red-500 border-red-500 hover:bg-red-50" onClick={clearCart}>
              Очистить корзину
            </Button>

            <Button asChild variant="outline">
              <Link href="/catalog">Продолжить покупки</Link>
            </Button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6">
            <h2 className="font-bold text-lg mb-4">Сумма заказа</h2>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Товары ({cartItems.length}):</span>
                <span>{getTotalPrice().toLocaleString()} ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Скидка:</span>
                <span>0 ₽</span>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between font-bold text-lg mb-6">
              <span>Итого:</span>
              <span>{getTotalPrice().toLocaleString()} ₽</span>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Промокод" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
                <Button variant="outline">Применить</Button>
              </div>

              <Button className="w-full bg-orange-500 hover:bg-orange-600">Оформить заказ</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
