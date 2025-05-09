import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { getProducts } from "../actions/products"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Каталог товаров | Surveillance Systems",
  description: "Просмотр каталога систем видеонаблюдения с использованием Prisma",
}

export default async function ShopPage() {
  // Получаем данные с помощью серверного экшена
  const { products, totalProducts, totalPages, currentPage } = await getProducts({
    limit: 20,
    page: 1
  })

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Каталог товаров</h1>
        <p className="text-gray-500">
          Всего найдено товаров: {totalProducts}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold mb-2">Товары не найдены</h3>
          <p className="text-gray-500 mb-6">
            К сожалению, в каталоге нет товаров, соответствующих вашему запросу.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="flex flex-col h-full overflow-hidden">
              <div className="relative h-48 bg-gray-100">
                {product.main_image ? (
                  <Image
                    src={product.main_image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    Нет фото
                  </div>
                )}
                {product.is_hit && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    Хит продаж
                  </div>
                )}
              </div>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">
                  <Link href={`/product/${product.slug}`} className="hover:underline">
                    {product.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex-grow">
                <div className="flex flex-col space-y-2">
                  {product.category && (
                    <span className="text-xs text-gray-500">{product.category.name}</span>
                  )}
                  <span className="font-semibold text-lg">{product.price} ₽</span>
                  <div className="text-sm text-gray-600 line-clamp-3">
                    {product.description}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <div className="flex flex-col text-sm">
                  <span className={product.in_stock ? "text-green-600" : "text-red-600"}>
                    {product.in_stock ? "В наличии" : "Нет в наличии"}
                  </span>
                  {product.in_stock && <span className="text-xs text-gray-500">{product.stock_quantity} шт.</span>}
                </div>
                <Button variant="outline" size="sm">
                  Подробнее
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="inline-flex">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Link
                key={page}
                href={`/shop?page=${page}`}
                className={`
                  px-4 py-2 text-sm border 
                  ${currentPage === page
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"}
                `}
              >
                {page}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </main>
  )
}
