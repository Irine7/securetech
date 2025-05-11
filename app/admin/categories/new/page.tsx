'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft, XCircle, Loader2 } from 'lucide-react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { UploadButton } from "@/lib/utils/uploadthing"
import type { OurFileRouter } from "@/app/api/uploadthing/core"

import { createCategory, getParentCategories, updateCategoryImage } from '@/app/actions/categories'

// Локальная функция для преобразования текста в URL-slug
function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Локальное определение схемы для формы (идентичное серверной)
const categoryFormSchema = z.object({
  name: z.string().min(2, { message: "Название должно содержать минимум 2 символа" }),
  slug: z.string().optional(),
  description: z.string().optional(),
  image_url: z.string().optional(),
  parent_id: z.number().optional().nullable(),
})

type CategoryFormValues = z.infer<typeof categoryFormSchema>

export default function NewCategoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [parentCategories, setParentCategories] = useState<{ id: number; name: string }[]>([])
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loadingParents, setLoadingParents] = useState(true)
  
  // Инициализация формы с валидацией через Zod
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      parent_id: undefined,
    },
  })
  
  // Загрузка родительских категорий при монтировании компонента
  useEffect(() => {
    loadParentCategories()
  }, [])
  
  // Автоматическая генерация slug при изменении имени категории
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'name' && value.name) {
        const generatedSlug = slugify(value.name)
        form.setValue('slug', generatedSlug)
      }
    })
    
    return () => subscription.unsubscribe()
  }, [form])
  
  // Загрузка родительских категорий для выпадающего списка
  const loadParentCategories = async () => {
    try {
      setLoadingParents(true)
      const response = await getParentCategories()
      
      if (response.success) {
        setParentCategories(response.categories)
      } else {
        toast({
          title: 'Ошибка',
          description: response.error || 'Не удалось загрузить родительские категории',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Ошибка при загрузке родительских категорий:', error)
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при загрузке родительских категорий',
        variant: 'destructive',
      })
    } finally {
      setLoadingParents(false)
    }
  }
  
  // Обработчик отправки формы
  const onSubmit = async (data: CategoryFormValues) => {
    try {
      setLoading(true)
      
      // Копия данных для модификации
      const formData = { ...data };
      
      // Преобразование parent_id в число, если оно задано как строка
      if (typeof formData.parent_id === 'string') {
        formData.parent_id = Number.parseInt(formData.parent_id, 10);
      }
      
      // Отправка запроса на создание категории
      const response = await createCategory(formData)
      
      if (response.success) {
        // Если есть изображение, сохраняем его для категории
        if ((imageUrl || data.image_url) && response.category?.id) {
          const imageResult = await updateCategoryImage(
            response.category.id, 
            imageUrl || data.image_url || ''
          )
          
          if (!imageResult.success) {
            toast({
              title: 'Предупреждение',
              description: 'Категория создана, но возникла проблема с сохранением изображения',
              variant: 'destructive',
            })
          }
        }
        
        toast({
          title: 'Успешно',
          description: 'Категория успешно создана',
        })
        router.push('/admin/categories')
      } else {
        throw new Error(response.error || 'Не удалось создать категорию')
      }
    } catch (error) {
      console.error('Ошибка при создании категории:', error)
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать категорию',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Создание категории</h2>
        <Button 
          variant="outline" 
          onClick={() => router.push('/admin/categories')}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Назад к категориям
        </Button>
      </div>
      
      <Separator />
      
      <Card>
        <CardHeader>
          <CardTitle>Данные категории</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Название категории */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Введите название категории" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* URL категории */}
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL-адрес</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="url-kategorii" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Описание категории */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Введите описание категории" 
                        className="resize-none min-h-32" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Родительская категория */}
              <FormField
                control={form.control}
                name="parent_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Родительская категория</FormLabel>
                    <Select
                      disabled={loadingParents || parentCategories.length === 0}
                      onValueChange={(value) => field.onChange(value === "null" ? null : Number.parseInt(value, 10))}
                      value={field.value?.toString() || "null"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите родительскую категорию" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">Нет (корневая категория)</SelectItem>
                        {parentCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Изображение категории */}
              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Изображение категории</FormLabel>
                    <FormControl>
                      <div>
                        <div className="flex flex-col gap-2">
                          {/* Отображение загруженного изображения, если оно есть */}
                          {(imageUrl || field.value) && (
                            <div className="relative aspect-square w-40 h-40 rounded-md overflow-hidden border border-gray-200">
                              <Image 
                                src={imageUrl || field.value || ''}
                                alt="Изображение категории"
                                fill
                                className="object-cover"
                              />
                              <button
                                type="button"
                                className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white"
                                onClick={() => {
                                  setImageUrl(null);
                                  field.onChange('');
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                          
                          {/* Кнопка загрузки изображения */}
                          {!imageUrl && !field.value && (
                            <div className="flex flex-col gap-2">
                              <UploadButton<OurFileRouter, any, "productImage">
                                endpoint="productImage"
                                onClientUploadComplete={(res) => {
                                  // Успешная загрузка!
                                  if (res && res.length > 0) {
                                    setImageUrl(res[0].url);
                                    field.onChange(res[0].url);
                                    toast({
                                      title: "Успешно",
                                      description: "Изображение загружено!",
                                    });
                                  }
                                  setUploading(false);
                                }}
                                onUploadBegin={() => {
                                  setUploading(true);
                                  toast({
                                    title: "Загрузка",
                                    description: "Идет загрузка изображения...",
                                  });
                                }}
                                onUploadError={(error: Error) => {
                                  // Обработка ошибок
                                  console.error(error);
                                  toast({
                                    title: "Ошибка",
                                    description: `Не удалось загрузить изображение: ${error.message}`,
                                    variant: "destructive",
                                  });
                                  setUploading(false);
                                }}
                                content={{
                                  button({ ready }: { ready: boolean }) {
                                    if (uploading) return 'Загрузка...';
                                    if (ready) return 'Загрузить изображение';
                                    return 'Подготовка...';
                                  },
                                  allowedContent() {
                                    return '';
                                  }
                                }}
                                className="ut-button:bg-primary ut-button:h-10 ut-button:px-4 ut-button:rounded-md ut-button:ut-uploading:bg-primary/80 ut-button:ut-readying:bg-primary/80 w-full"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Кнопки действий */}
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/admin/categories')}
                >
                  Отмена
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || loadingParents || uploading}
                >
                  {loading || uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {loading ? 'Сохранение...' : 'Загрузка изображения...'}
                    </>
                  ) : (
                    'Создать категорию'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
