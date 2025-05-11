'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft, XCircle, Upload, Loader2, ImageIcon } from 'lucide-react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
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
import type { UploadFileResponse } from "uploadthing/client"

import {
  getCategoryById,
  getParentCategories,
  updateCategory,
  updateCategoryImage
} from '@/app/actions/categories'

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

export default function EditCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const categoryId = Number.parseInt(params.id as string, 10)
  
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [parentCategories, setParentCategories] = useState<{ id: number; name: string }[]>([])
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  
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
  
  // Загрузка данных категории и родительских категорий при монтировании компонента
  useEffect(() => {
    const initPage = async () => {
      await Promise.all([
        loadCategory(),
        loadParentCategories(),
      ])
      setInitialLoading(false)
    }
    
    initPage()
  }, [])
  
  // Загрузка данных категории по ID
  const loadCategory = async () => {
    try {
      const response = await getCategoryById(categoryId)
      
      if (response.success && response.category) {
        // Заполнение формы данными категории
        // Установка URL изображения, если оно есть
        if (response.category.image_url) {
          setImageUrl(response.category.image_url)
        }
        
        form.reset({
          name: response.category.name,
          slug: response.category.slug,
          description: response.category.description || '',
          image_url: response.category.image_url || '',
          parent_id: response.category.parent_id || undefined,
        })
      } else {
        toast({
          title: 'Ошибка',
          description: response.error || 'Не удалось загрузить данные категории',
          variant: 'destructive',
        })
        router.push('/admin/categories')
      }
    } catch (error) {
      console.error(`Ошибка при загрузке категории с ID ${categoryId}:`, error)
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при загрузке данных категории',
        variant: 'destructive',
      })
      router.push('/admin/categories')
    }
  }
  
  // Загрузка родительских категорий для выпадающего списка
  const loadParentCategories = async () => {
    try {
      const response = await getParentCategories(categoryId)
      
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
    }
  }
  
  // Обработчик отправки формы
  const onSubmit = async (data: CategoryFormValues) => {
    try {
      setLoading(true)
      
      // Подготовка данных для отправки
      const formData = {
        name: data.name,
        slug: data.slug || slugify(data.name),
        description: data.description || '',
        parent_id: data.parent_id,
      }
      
      // Проверка, чтобы категория не была выбрана своим же родителем
      if (data.parent_id === categoryId) {
        throw new Error('Категория не может быть родителем самой себя')
      }
      
      // Отправка запроса на обновление категории
      const response = await updateCategory(categoryId, formData)
      
      if (response.success) {
        // Обновляем изображение, если оно изменилось
        const currentImageUrl = imageUrl || data.image_url || null;
        
        if (currentImageUrl) {
          setImageLoading(true);
          try {
            console.log(`Отправка запроса на обновление изображения: ${currentImageUrl}`);
            const imageResult = await updateCategoryImage(categoryId, currentImageUrl);
            console.log('Результат обновления изображения:', imageResult);
            
            if (!imageResult.success) {
              toast({
                title: 'Предупреждение',
                description: 'Категория обновлена, но возникла проблема с сохранением изображения',
                variant: 'destructive',
              });
            } else {
              toast({
                title: 'Успешно',
                description: 'Изображение категории успешно обновлено',
              });
            }
          } catch (error) {
            console.error('Ошибка при обновлении изображения:', error);
            toast({
              title: 'Ошибка',
              description: 'Не удалось обновить изображение категории',
              variant: 'destructive',
            });
          } finally {
            setImageLoading(false);
          }
        }
        
        toast({
          title: 'Успешно',
          description: 'Категория успешно обновлена',
        })
        router.push('/admin/categories')
      } else {
        throw new Error(response.error || 'Не удалось обновить категорию')
      }
    } catch (error) {
      console.error('Ошибка при обновлении категории:', error)
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось обновить категорию',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Автоматическая генерация slug при изменении имени категории
  const handleNameChange = (value: string) => {
    form.setValue('name', value)
    
    // Генерируем slug только если пользователь не редактировал его вручную
    const currentSlug = form.getValues('slug')
    const originalName = form.getValues('name')
    
    if (!currentSlug || currentSlug === slugify(originalName)) {
      form.setValue('slug', slugify(value))
    }
  }
  
  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Редактирование категории</h2>
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
                    <FormLabel>Название</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Введите название категории" 
                        {...field} 
                        onChange={(e) => handleNameChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* URL (slug) */}
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL (slug)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Будет сгенерирован автоматически" 
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
                      onValueChange={(value) => {
                        field.onChange(value && value !== "null" ? Number.parseInt(value, 10) : null);
                      }}
                      value={field.value?.toString() || "null"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите родительскую категорию" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">Нет родительской категории</SelectItem>
                        {parentCategories.map((category) => (
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
              
              {/* Описание */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Введите описание категории (опционально)" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
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
                    <FormLabel className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Изображение категории
                    </FormLabel>
                    <FormDescription>
                      Добавьте изображение, которое будет отображаться на странице категорий
                    </FormDescription>
                    <FormControl>
                      <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                          {/* Отображение текущего изображения, если оно есть */}
                          {(imageUrl || field.value) && (
                            <div className="relative aspect-square w-60 h-60 rounded-md overflow-hidden border border-gray-200 shadow-sm">
                              {imageLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                                </div>
                              )}
                              <Image 
                                src={imageUrl || field.value || ''}
                                alt="Изображение категории"
                                fill
                                className="object-cover"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs">
                                {imageUrl || field.value || ''}  
                              </div>
                              <button
                                type="button"
                                className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 transition-colors rounded-full text-white shadow-sm"
                                onClick={() => {
                                  setImageUrl(null);
                                  field.onChange('');
                                  toast({
                                    title: "Изображение удалено",
                                    description: "Изображение будет удалено после сохранения категории"
                                  });
                                }}
                                disabled={imageLoading}
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                          
                          {/* Кнопка загрузки изображения */}
                          {!imageUrl && !field.value && (
                            <div className="flex flex-col gap-2 border-2 border-dashed border-gray-200 rounded-md p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
                              <div className="text-center mb-4">
                                <Upload className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 mb-1">Перетащите изображение сюда или нажмите на кнопку</p>
                                <p className="text-xs text-gray-400">PNG, JPG или GIF до 4MB</p>
                              </div>
                              
                              <UploadButton<OurFileRouter>
                                endpoint="productImage"
                                onClientUploadComplete={(res: UploadFileResponse[]) => {
                                  // Успешная загрузка!
                                  if (res && res.length > 0) {
                                    setImageUrl(res[0].url);
                                    field.onChange(res[0].url);
                                    toast({
                                      title: "Успешно",
                                      description: "Изображение загружено! Не забудьте сохранить категорию.",
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
                                    if (uploading) return 'Загрузка...'
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
                <Button type="submit" disabled={loading || uploading || imageLoading}>
                  {loading || uploading || imageLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {loading ? 'Сохранение...' : (uploading ? 'Загрузка изображения...' : 'Обновление изображения...')}
                    </>
                  ) : (
                    'Сохранить изменения'
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
