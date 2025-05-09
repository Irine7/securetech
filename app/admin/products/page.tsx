"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { 
  ColumnDef, 
  flexRender, 
  getCoreRowModel, 
  getPaginationRowModel, 
  useReactTable,
  SortingState,
  getSortedRowModel
} from "@tanstack/react-table"
import { Pencil, Plus, Trash2, RefreshCcw, CheckCircle, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getProducts } from "@/app/actions/products"
import { deleteProduct } from "@/app/actions/admin"

// Тип для продукта
interface Product {
  id: number
  name: string
  slug: string
  sku: string
  price: number
  in_stock: boolean
  stock_quantity: number
  main_image: string
  category?: {
    id: number
    name: string
  }
}

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<number | null>(null)
  
  // Загрузка товаров
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await getProducts({ limit: 100 })
        setProducts(response.products)
      } catch (error) {
        console.error('Ошибка при загрузке товаров:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadProducts()
  }, [])
  
  // Определение колонок таблицы
  const columns: ColumnDef<Product>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Выбрать все"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Выбрать строку"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="text-center">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "main_image",
      header: "Изображение",
      cell: ({ row }) => (
        <div className="w-12 h-12 relative rounded overflow-hidden">
          <Image
            src={"/placeholder-test.svg?height=48&width=48"}
            alt={row.getValue("name")}
            fill
            className="object-cover"
          />
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: "Название",
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "sku",
      header: "Артикул",
      cell: ({ row }) => <div>{row.getValue("sku")}</div>,
    },
    {
      accessorKey: "category.name",
      header: "Категория",
      cell: ({ row }) => <div>{row.original.category?.name || "-"}</div>,
    },
    {
      accessorKey: "price",
      header: "Цена",
      cell: ({ row }) => <div className="text-right">₽{Number(row.getValue("price")).toLocaleString()}</div>,
    },
    {
      accessorKey: "in_stock",
      header: "В наличии",
      cell: ({ row }) => (
        <div className="flex justify-center">
          {row.getValue("in_stock") ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Действия",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/admin/products/${row.original.id}`)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-red-500"
            onClick={() => {
              setProductToDelete(row.original.id)
              setDeleteDialogOpen(true)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
    },
  ]
  
  // Инициализация таблицы
  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })
  
  // Обработка удаления товара
  const handleDeleteProduct = async () => {
    if (!productToDelete) return
    
    try {
      const result = await deleteProduct(productToDelete)
      
      if (result.success) {
        // Удаляем товар из локального состояния
        setProducts(products.filter(product => product.id !== productToDelete))
      }
    } catch (error) {
      console.error("Ошибка при удалении товара:", error)
    } finally {
      setDeleteDialogOpen(false)
      setProductToDelete(null)
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Товары</h1>
          <p className="text-muted-foreground">
            Управление товарами в каталоге
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4 mr-2" />
            Добавить товар
          </Link>
        </Button>
      </div>
      
      <div className="rounded-md border">
        <div className="flex items-center px-4 py-2 border-b">
          <Input
            placeholder="Поиск товаров..."
            className="max-w-sm"
            // Реализовать поиск по товарам
          />
        </div>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Товары не найдены.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-end space-x-2 p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Назад
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Далее
          </Button>
        </div>
      </div>
      
      {/* Диалог подтверждения удаления */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены, что хотите удалить этот товар?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие не может быть отменено. Товар будет навсегда удален из системы.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-red-500 text-white hover:bg-red-600">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
