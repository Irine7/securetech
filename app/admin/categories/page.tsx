'use client'

import { useState, useEffect } from 'react'
import 	Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, ChevronRight, FolderTree, ImageOff, LayoutGrid, Table as TableIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'

import { getCategories, deleteCategory } from '@/app/actions/categories'

// Тип для категории из API
interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: number | null
  created_at: string
  parent: {
    id: number
    name: string
  } | null
  children: {
    id: number
  }[]
  _count: {
    products: number
  }
}

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // Загрузка категорий при монтировании компонента
  useEffect(() => {
    loadCategories()
  }, [])

  // Функция загрузки категорий
  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await getCategories()

      if (response.success) {
        setCategories(response.categories)
      } else {
        toast({
          title: 'Ошибка',
          description: response.error || 'Не удалось загрузить категории',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Ошибка при загрузке категорий:', error)
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при загрузке категорий',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Обработчик удаления категории
  const handleDeleteClick = (id: number) => {
    setDeletingCategoryId(id)
    setDeleteDialogOpen(true)
    setDeleteError(null)
  }

  // Подтверждение удаления категории
  const confirmDelete = async () => {
    if (!deletingCategoryId) return

    try {
      const response = await deleteCategory(deletingCategoryId)

      if (response.success) {
        toast({
          title: 'Успешно',
          description: 'Категория успешно удалена',
        })
        loadCategories()
        setDeleteDialogOpen(false)
      } else {
        setDeleteError(response.error || 'Не удалось удалить категорию')
      }
    } catch (error) {
      console.error('Ошибка при удалении категории:', error)
      setDeleteError('Произошла ошибка при удалении категории')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Категории</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-md border">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              className="rounded-l-md rounded-r-none border-r"
              onClick={() => setViewMode('table')}
              size="sm"
            >
              <TableIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              className="rounded-l-none rounded-r-md"
              onClick={() => setViewMode('grid')}
              size="sm"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => router.push('/admin/categories/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Создать категорию
          </Button>
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Все категории</CardTitle>
          <CardDescription>
            Управление категориями каталога товаров
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <FolderTree className="h-12 w-12 mb-4 text-muted-foreground" />
              <h3 className="mb-3 text-lg font-semibold">Нет категорий</h3>
              <p className="text-sm text-muted-foreground mb-6">
                У вас пока нет созданных категорий товаров. Создайте первую категорию!
              </p>
              <Button onClick={() => router.push('/admin/categories/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Создать категорию
              </Button>
            </div>
          ) : viewMode === 'table' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Изображение</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Родительская категория</TableHead>
                  <TableHead className="text-center">Подкатегории</TableHead>
                  <TableHead className="text-center">Товары</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-muted">
                        {category.image_url ? (
                          <Image 
                            src={category.image_url} 
                            alt={category.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageOff className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{category.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {category.slug}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {category.parent ? (
                        <Badge variant="outline">
                          {category.parent.name}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {category.children.length}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {category._count.products}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => router.push(`/admin/categories/${category.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteClick(category.id)}
                          disabled={
                            category._count.products > 0 || 
                            category.children.length > 0
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
              {categories.map((category) => (
                <div key={category.id} className="bg-white rounded-lg overflow-hidden shadow-sm border hover:shadow-md transition-shadow">
                  <div className="relative h-48 w-full bg-muted mb-3">
                    {category.image_url ? (
                      <Image 
                        src={category.image_url} 
                        alt={category.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageOff className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{category.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{category.slug}</p>
                    
                    {category.parent && (
                      <div className="mb-3">
                        <Badge variant="outline" className="mr-2">
                          {category.parent.name}
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex gap-2">
                        <Badge variant="secondary">
                          {category.children.length} {category.children.length === 1 ? 'подкат.' : 'подкат.'}
                        </Badge>
                        <Badge variant="secondary">
                          {category._count.products} {category._count.products === 1 ? 'товар' : 'тов.'}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => router.push(`/admin/categories/${category.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteClick(category.id)}
                          disabled={category._count.products > 0 || category.children.length > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Категория будет удалена безвозвратно.
              {deleteError && (
                <div className="mt-2 text-red-500">{deleteError}</div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
