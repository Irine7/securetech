"use client"

import { useState, useEffect } from "react"
import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Save, XCircle, RefreshCcw } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { getCategories } from "@/app/actions/products"
import { createProduct, updateProduct, addProductImage, deleteProductImage, getProductById, checkSlugUniqueness, type ProductCreateInput } from "@/app/actions/admin"
import { UploadButton } from "@/lib/utils/uploadthing"
import type { OurFileRouter } from "@/app/api/uploadthing/core"

// Используем Usable тип из React
import type { Usable } from "react"

// Схема валидации формы
const productSchema = z.object({
  name: z.string().min(2, { message: "Название должно содержать минимум 2 символа" }),
  slug: z.string().min(2, { message: "URL должен содержать минимум 2 символа" }),
  sku: z.string().min(1, { message: "Артикул обязателен" }),
  description: z.string().min(10, { message: "Описание должно содержать минимум 10 символов" }),
  price: z.coerce.number().min(0, { message: "Цена должна быть положительным числом" }),
  category_id: z.coerce.number().min(1, { message: "Выберите категорию" }),
  is_hit: z.boolean().default(false),
  in_stock: z.boolean().default(true),
  stock_quantity: z.coerce.number().min(0, { message: "Количество должно быть положительным числом" }),
})

type ProductFormValues = z.infer<typeof productSchema>

export default function ProductForm({ params }: { params: Usable<{ id: string }> }) {
  const router = useRouter()
  
  // Используем React.use для разворачивания параметров ВНЕ блока try/catch
  // React.use должен быть вызван на верхнем уровне компонента
  const { id } = React.use(params)
  
  const isNewProduct = id === "new"
  const [loading, setLoading] = useState(!isNewProduct)
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  
  // Расширенный тип для изображений, чтобы включить ID для существующих изображений из БД
  type ImageItem = { url: string; id?: number; toDelete?: boolean }
  const [uploadedImages, setUploadedImages] = useState<ImageItem[]>([])
  
  // Инициализация формы
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      slug: "",
      sku: "",
      description: "",
      price: 0,
      category_id: 0,
      is_hit: false,
      in_stock: true,
      stock_quantity: 0,
    },
  })
  
  // Загрузка категорий
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await getCategories()
        setCategories(categoriesData)
      } catch (error) {
        console.error("Ошибка при загрузке категорий:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить категории",
          variant: "destructive",
        })
      }
    }
    
    loadCategories()
  }, [])
  
  // Загрузка данных товара при редактировании
  useEffect(() => {
    if (!isNewProduct) {
      const loadProduct = async () => {
        try {
          setLoading(true)
          
          // Проверяем, что id не "new" и преобразуем его в число
          if (id === "new") {
            setLoading(false)
            return
          }
          
          const productId = Number.parseInt(id, 10)
          if (Number.isNaN(productId)) {
            throw new Error("Некорректный ID товара")
          }
          
          // Проверяем уникальность slug через серверное действие
          const slugCheckResult = await checkSlugUniqueness(form.getValues("slug"), productId)
          
          if (!slugCheckResult.isUnique) {
            toast({
              title: "Ошибка",
              description: slugCheckResult.error || "Товар с таким URL уже существует",
              variant: "destructive",
            })
            setLoading(false)
            return
          }
          
          // Загружаем товар через серверное действие
          const result = await getProductById(productId)
          
          if (!result.success || !result.product) {
            toast({
              title: "Ошибка",
              description: result.error || "Товар не найден",
              variant: "destructive",
            })
            router.push("/admin/products")
            return
          }
          
          const product = result.product
          
          // Устанавливаем изображения, если они есть
          if (product.images && product.images.length > 0) {
            setUploadedImages(product.images.map((img: { id: number; image_url: string }) => ({
              url: img.image_url,
              id: img.id
            })))
          }
          
          // Установка значений формы
          form.reset({
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            description: product.description,
            price: Number.parseInt(product.price.toString(), 10),
            category_id: Number.parseInt(product.category_id.toString(), 10),
            is_hit: product.is_hit,
            in_stock: product.in_stock,
            stock_quantity: product.stock_quantity,
          })
        } catch (error) {
          console.error("Ошибка при загрузке товара:", error)
          toast({
            title: "Ошибка",
            description: "Не удалось загрузить данные товара",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }
      
      loadProduct()
    } else {
      setLoading(false)
    }
  }, [isNewProduct, id, router, form])
  
  // Функция отправки формы
  const onSubmit = async (data: ProductFormValues): Promise<void> => {
    try {
      setSubmitting(true)
      
      // Преобразование slug в нижний регистр и замена пробелов на дефисы
      data.slug = data.slug.toLowerCase().replace(/\s+/g, "-")
      
      // Разделяем изображения на новые, существующие и помеченные на удаление
      const newImages = uploadedImages.filter(img => !img.id && !img.toDelete)
      const existingImages = uploadedImages.filter(img => img.id && !img.toDelete)
      const imagesToDelete = uploadedImages.filter(img => img.id && img.toDelete)
      
      // Получаем URL основного изображения (первое неудаленное изображение)
      const mainImage = uploadedImages.find(img => !img.toDelete)?.url || "/placeholder-test.svg"
      
      // Объединяем данные формы с URL основного изображения
      const productData = {
        ...data,
        main_image: mainImage
      } as ProductCreateInput
      
      let result
      let productId: number
      
      if (isNewProduct) {
        // Создание нового товара
        result = await createProduct(productData)
        
        if (result.success && result.product) {
          productId = result.product.id
          
          // Добавляем все новые изображения
          for (let i = 0; i < newImages.length; i++) {
            await addProductImage(
              productId,
              newImages[i].url,
              i === 0 && !mainImage // Если это первое изображение и нет основного
            )
          }
          
          toast({
            title: "Успех",
            description: "Товар успешно создан",
          })
          router.push("/admin/products")
        }
      } else {
        // Обновление существующего товара
        productId = Number.parseInt(id, 10)
        
        result = await updateProduct({
          id: productId,
          ...productData,
        })
        
        if (result.success) {
          // Добавляем новые изображения к существующему товару
          for (let i = 0; i < newImages.length; i++) {
            await addProductImage(
              productId,
              newImages[i].url,
              // Первое новое изображение делаем главным, если нет существующих
              i === 0 && existingImages.length === 0
            )
          }
          
          // Удаляем помеченные изображения
          for (const img of imagesToDelete) {
            if (img.id) {
              await deleteProductImage(img.id)
            }
          }
          
          toast({
            title: "Успех",
            description: "Товар и изображения успешно обновлены",
          })
        }
      }
      
      if (!result?.success) {
        toast({
          title: "Ошибка",
          description: result?.error || "Не удалось сохранить товар",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Ошибка при сохранении товара:", error)
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при сохранении товара",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }
  
  // Функция создания слага на основе названия товара
  const generateSlug = () => {
    const name = form.getValues("name")
    if (!name) return
    
    // Создаем слаг: переводим в нижний регистр, заменяем пробелы на дефисы, удаляем спец. символы
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "")
      
    form.setValue("slug", slug)
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <RefreshCcw className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isNewProduct ? "Добавить товар" : "Редактировать товар"}
        </h1>
        <p className="text-muted-foreground">
          {isNewProduct
            ? "Создание нового товара в каталоге"
            : "Редактирование существующего товара"}
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Введите название товара"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            // Автоматическое создание слага при вводе названия
                            if (isNewProduct && !form.getValues("slug")) {
                              generateSlug()
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL (slug)</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input placeholder="url-товара" {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generateSlug}
                          size="sm"
                        >
                          Создать
                        </Button>
                      </div>
                      <FormDescription>
                        URL для товара (например: canon-eos-200d)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Артикул</FormLabel>
                      <FormControl>
                        <Input placeholder="SKU12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Подробное описание товара..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Цена (руб.)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Категория</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={field.value.toString()}
                        value={field.value > 0 ? field.value.toString() : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите категорию" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem
                              key={category.id}
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stock_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Количество</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            {...field}
                            disabled={!form.getValues("in_stock")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="in_stock"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>В наличии</FormLabel>
                            <FormDescription>
                              Товар доступен для заказа
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="is_hit"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Хит продаж</FormLabel>
                            <FormDescription>
                              Отметить как популярный товар
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Изображения</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-primary/50 rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <h4 className="font-medium mb-2 text-primary">Загрузить изображения</h4>
                    <p className="text-sm text-muted-foreground mb-4">Нажмите кнопку ниже, чтобы выбрать файлы</p>
                    <div className="flex justify-center">
                      <UploadButton<OurFileRouter, "productImage">
                        endpoint="productImage"
                        appearance={{
                          button: {
                            background: "hsl(22, 100%, 50%)",
                            padding: "12px 16px"
                          },
                          allowedContent: {
                            fontSize: "14px",
                            color: "#666"
                          }
                        }}
                        content={{
                          button({ ready }) { return ready ? 'Выбрать изображения' : 'Загрузка...' },
                          allowedContent: 'Поддерживаются JPG, PNG, WebP до 4MB'
                        }}
                        onClientUploadComplete={(res) => {
                          if (res && res.length > 0) {
                            // Преобразуем ответ в формат, который ожидает компонент
                            const newImages = res.map((file) => ({
                              url: file.ufsUrl
                            }))
                            
                            // Обновляем список изображений
                            setUploadedImages((prev) => [...prev, ...newImages])
                            
                            toast({
                              title: "Успех",
                              description: `Загружено ${res.length} файлов.`,
                            })
                          }
                        }}
                        onUploadError={(error: Error) => {
                          toast({
                            title: "Ошибка",
                            description: error.message || "Ошибка при загрузке",
                            variant: "destructive",
                          })
                        }}
                      />
                    </div>
                  </div>
                  
                  {uploadedImages.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium mb-2">Загруженные изображения:</h3>
                      <div className="grid grid-cols-5 gap-4 mt-4">
                        {uploadedImages
                          // Фильтруем изображения, скрывая помеченные на удаление
                          .filter(img => !img.toDelete)
                          .map((image, index) => {
                            // Создаем уникальный ключ для каждого изображения
                            const imageKey = image.id ? `image-${image.id}` : `new-image-${index}-${image.url.slice(-8)}`
                            
                            return (
                              <div key={imageKey} className="relative rounded overflow-hidden aspect-square group">
                                <Image 
                                  src={image.url}
                                  alt={`Изображение ${index + 1}`}
                                  fill
                                  className="object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition-opacity">
                                  <Button
                                    className="h-8 w-8 p-0"
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => {
                                      // Если изображение имеет ID из базы данных, помечаем его на удаление
                                      if (image.id) {
                                        // Обновляем массив, помечая изображение как подлежащее удалению
                                        const newImages = [...uploadedImages]
                                        // Находим индекс в исходном массиве
                                        const originalIndex = uploadedImages.findIndex(img => 
                                          (img.id && img.id === image.id) || 
                                          (!img.id && img.url === image.url)
                                        )
                                        
                                        if (originalIndex !== -1) {
                                          newImages[originalIndex] = { ...newImages[originalIndex], toDelete: true }
                                          setUploadedImages(newImages)
                                          
                                          toast({
                                            title: "Информация",
                                            description: "Изображение будет удалено после сохранения",
                                          })
                                        }
                                      } else {
                                        // Если это новое изображение, просто удаляем из массива
                                        setUploadedImages(uploadedImages.filter(img => 
                                          img.url !== image.url
                                        ))
                                      }
                                    }}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/products")}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isNewProduct ? "Создать товар" : "Обновить товар"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
