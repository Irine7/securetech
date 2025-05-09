"use client"

import { useState, useEffect } from "react"
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
import { createProduct, updateProduct, addProductImage } from "@/app/actions/admin"
import { getProductBySlug } from "@/app/actions/products"
import { UploadButton } from "@/lib/utils/uploadthing"

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

export default function ProductForm({ params }: { params: { id: string } }) {
  const router = useRouter()
  const isNewProduct = params.id === "new"
  const [loading, setLoading] = useState(!isNewProduct)
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [uploadedImages, setUploadedImages] = useState<{ url: string }[]>([])
  
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
          const product = await getProductBySlug(params.id)
          
          if (!product) {
            toast({
              title: "Ошибка",
              description: "Товар не найден",
              variant: "destructive",
            })
            router.push("/admin/products")
            return
          }
          
          // Установка значений формы
          form.reset({
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            description: product.description,
            price: product.price,
            category_id: product.category_id,
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
  }, [isNewProduct, params.id, router, form])
  
  // Функция отправки формы
  const onSubmit = async (data: ProductFormValues) => {
    try {
      setSubmitting(true)
      
      // Преобразование slug в нижний регистр и замена пробелов на дефисы
      data.slug = data.slug.toLowerCase().replace(/\s+/g, "-")
      
      let result
      
      if (isNewProduct) {
        // Создание нового товара
        result = await createProduct(data)
        
        // Если есть загруженные изображения, добавляем их к товару
        if (result.success && result.product && uploadedImages.length > 0) {
          for (let i = 0; i < uploadedImages.length; i++) {
            await addProductImage(
              result.product.id,
              uploadedImages[i].url,
              i === 0 // Первое изображение делаем главным
            )
          }
        }
        
        if (result.success) {
          toast({
            title: "Успех",
            description: "Товар успешно создан",
          })
          router.push("/admin/products")
        }
      } else {
        // Обновление существующего товара
        result = await updateProduct({
          id: parseInt(params.id),
          ...data,
        })
        
        if (result.success) {
          toast({
            title: "Успех",
            description: "Товар успешно обновлен",
          })
        }
      }
      
      if (!result.success) {
        toast({
          title: "Ошибка",
          description: result.error || "Не удалось сохранить товар",
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
  
  // Создание слага на основе названия
  const generateSlug = () => {
    const name = form.getValues("name")
    if (name) {
      const slug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, "") // Удаление специальных символов
        .replace(/\s+/g, "-") // Замена пробелов на дефисы
        .replace(/-+/g, "-") // Замена множественных дефисов на один
      
      form.setValue("slug", slug)
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
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Категория</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={
                          field.value ? field.value.toString() : undefined
                        }
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
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Описание товара..."
                          className="min-h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Цена и наличие</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    name="stock_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Количество</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex flex-col gap-4 pt-2">
                    <FormField
                      control={form.control}
                      name="in_stock"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            В наличии
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="is_hit"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Популярный товар
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Изображения</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <UploadButton
                        endpoint="productImage"
                        onClientUploadComplete={(res) => {
                          if (res) {
                            setUploadedImages((prev) => [...prev, ...res.map(file => ({ url: file.url }))]);
                            toast({
                              title: "Успех",
                              description: `Загружено ${res.length} файлов.`,
                            });
                          }
                        }}
                        onUploadError={(error: Error) => {
                          toast({
                            title: "Ошибка",
                            description: error.message || "Ошибка при загрузке",
                            variant: "destructive",
                          });
                        }}
                      />
                    </div>
                    
                    {uploadedImages.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium mb-2">Загруженные изображения:</h3>
                        <div className="grid grid-cols-3 gap-2">
                          {uploadedImages.map((image, index) => (
                            <div key={index} className="relative rounded overflow-hidden aspect-square">
                              <Image
                                src={image.url}
                                alt={`Uploaded image ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                              <Button
                                className="absolute top-1 right-1 h-6 w-6 p-0"
                                variant="destructive"
                                size="icon"
                                onClick={() => {
                                  setUploadedImages(uploadedImages.filter((_, i) => i !== index));
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
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
