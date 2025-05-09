"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight, ShoppingCart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/components/cart-provider"
import { useToast } from "@/components/ui/use-toast"

// Определение типов данных для продукта и спецификаций
type ProductSpecification = {
  id: number
  product_id: number
  specification_id: number
  value: string
  specification?: {
    id: number
    name: string
    slug: string
  }
}

type Product = {
  id: number
  name: string
  slug: string
  sku: string
  description: string
  price: number
  category_id: number
  is_hit: boolean
  in_stock: boolean
  stock_quantity: number
  main_image: string
  created_at: string
  updated_at: string
  category?: {
    id: number
    name: string
    slug: string
  }
  images?: Array<{
    id: number
    product_id: number
    image_url: string
    is_main: boolean
    sort_order: number
  }>
  specifications?: ProductSpecification[]
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  // Next.js 15 передает params как Promise
  const resolvedParams = typeof params === 'object' && 'then' in params ? React.use(params) : params;
  const slug = resolvedParams.slug;
  
  const [product, setProduct] = useState<Product | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()
  const { toast } = useToast()

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/products/${slug}`)
        const data = await response.json()

        if (data.product) {
          setProduct(data.product)
        }
      } catch (error) {
        console.error("Error fetching product:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [slug])

  const handleAddToCart = () => {
    if (!product) return

    addToCart({
      id: product.slug,
      name: product.name,
      price: product.price,
      image: "/placeholder-test.svg?height=100&width=100",
    })

    toast({
      title: "Товар добавлен в корзину",
      description: product.name,
      duration: 3000,
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto py-16 px-4 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Товар не найден</h1>
        <p className="text-muted-foreground mb-8">Запрашиваемый товар не существует или был удален</p>
        <Button asChild>
          <Link href="/catalog">Вернуться в каталог</Link>
        </Button>
      </div>
    )
  }

  // Group specifications by type for display
  const groupedSpecs: Record<string, string> = {}
  
  // Используем for...of вместо forEach согласно рекомендациям линтера
  if (product.specifications) {
    for (const spec of product.specifications) {
      if (spec.specification) {
        groupedSpecs[spec.specification.name] = spec.value
      }
    }
  }

  return (
    <div className="container mx-auto py-4 px-4">
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link href="/" className="hover:text-foreground">
          Главная
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/catalog" className="hover:text-foreground">
          Продукция
        </Link>
        <ChevronRight className="h-4 w-4" />
        {product.category && (
          <>
            <Link href={`/catalog?category=${product.category.id}`} className="hover:text-foreground">
              {product.category.name}
            </Link>
            <ChevronRight className="h-4 w-4" />
          </>
        )}
        <span>{product.name}</span>
      </div>

      <h1 className="text-2xl font-bold text-center mb-6">{product.name}</h1>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <div className="relative border rounded-lg overflow-hidden bg-white">
            {product.is_hit && <Badge className="absolute top-2 left-2 z-10 bg-orange-500">ХИТ ПРОДАЖ</Badge>}
            <Image
              src={"/placeholder-test.svg?height=600&width=600"}
              alt={product.name}
              width={600}
              height={600}
              className="w-full object-contain aspect-square"
              unoptimized
            />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((image: any, index: number) => (
                <div
                  key={index}
                  className={`border rounded-lg overflow-hidden cursor-pointer flex-shrink-0 w-20 h-20 ${
                    index === activeImageIndex ? "border-orange-500" : ""
                  }`}
                  onClick={() => setActiveImageIndex(index)}
                >
                  <Image
                    src={"/placeholder-test.svg?height=80&width=80"}
                    alt={`${product.name} - Изображение ${index + 1}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-contain"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 border rounded-lg bg-white">
            <div className="text-3xl font-bold mb-4">{product.price.toLocaleString()} ₽</div>
            <div className="flex items-center text-sm text-muted-foreground mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Рекомендованная цена
            </div>

            <Button
              size="lg"
              className="w-full bg-orange-500 hover:bg-orange-600 mb-4"
              onClick={handleAddToCart}
              disabled={!product.in_stock || product.stock_quantity <= 0}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {product.in_stock && product.stock_quantity > 0 ? "Добавить в корзину" : "Нет в наличии"}
            </Button>

            <p className="text-sm text-muted-foreground">
              *Указанные на сайте цены являются рекомендованной розничной ценой. В соответствии с Федеральным законом от
              26.07.2006 №135-ФЗ «О защите конкуренции» закупочные цены у ООО «Техника» и/или оборудование, для
              конечного покупателя устанавливаются авторизованными дистрибьюторами и партнерами самостоятельно.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Характеристики</h2>
            <div className="space-y-2">
              {Object.entries(groupedSpecs)
                .slice(0, 6)
                .map(([key, value]) => (
                  <div key={key} className="grid grid-cols-2">
                    <div className="text-muted-foreground">{key}</div>
                    <div>{value}</div>
                  </div>
                ))}
            </div>
            <div>
              <p className="text-sm">{product.description}</p>
            </div>
            <Link href="#specifications" className="text-orange-500 hover:underline inline-block">
              Все характеристики
            </Link>
          </div>
        </div>
      </div>

      <Tabs defaultValue="characteristics" className="mb-12">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent">
          <TabsTrigger
            value="characteristics"
            className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-500 rounded-none"
            id="specifications"
          >
            Характеристики
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-500 rounded-none"
          >
            Документы
          </TabsTrigger>
          <TabsTrigger
            value="passport"
            className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-500 rounded-none"
          >
            Паспорт
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-500 rounded-none"
          >
            Примечание
          </TabsTrigger>
        </TabsList>

        <TabsContent value="characteristics" className="pt-6">
          <h2 className="text-xl font-bold mb-6">Характеристики</h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <tbody>
                {Object.entries(groupedSpecs).map(([key, value], index) => (
                  <tr key={key} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                    <td className="py-3 px-4 border-b">{key}</td>
                    <td className="py-3 px-4 border-b">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="pt-6">
          <h2 className="text-xl font-bold mb-6">Документы</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 flex items-center gap-4">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-orange-500"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Руководство пользователя</h4>
                <p className="text-sm text-muted-foreground">PDF, 5.2 МБ</p>
              </div>
              <Button variant="outline" size="sm">
                Скачать
              </Button>
            </div>
            <div className="border rounded-lg p-4 flex items-center gap-4">
              <div className="bg-gray-100 p-3 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-orange-500"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="m9 10 2 2 4-4"></path>
                  <path d="M12 16v-6"></path>
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Клиентское ПО</h4>
                <p className="text-sm text-muted-foreground">Windows, 45.8 МБ</p>
              </div>
              <Button variant="outline" size="sm">
                Скачать
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="passport" className="pt-6">
          <h2 className="text-xl font-bold mb-6">Паспорт</h2>
          <div className="border rounded-lg p-6">
            <p>Паспорт продукта содержит подробную информацию о гарантии, сертификации и соответствии стандартам.</p>
            <Button variant="outline" className="mt-4">
              Скачать паспорт (PDF)
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="notes" className="pt-6">
          <h2 className="text-xl font-bold mb-6">Примечание</h2>
          <div className="border rounded-lg p-6">
            <p>
              Производитель оставляет за собой право изменять характеристики товара без предварительного уведомления.
              Изображения товара могут отличаться от реального внешнего вида. Наличие товара уточняйте у менеджера.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between items-center mb-6">
        <Link href="/catalog" className="flex items-center text-orange-500 hover:underline">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1"
          >
            <path d="m15 18-6-6 6-6"></path>
          </svg>
          Назад к списку
        </Link>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
              <polyline points="16 6 12 2 8 6"></polyline>
              <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
            Поделиться
          </Button>
        </div>
      </div>
    </div>
  )
}
