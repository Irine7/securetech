import ProductCard from "@/components/product-card"
import { getFeaturedProducts } from "@/app/actions/products"

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
  created_at: Date
  updated_at: Date
}

type ProductWithRelations = Product & {
  category: { id: number; name: string } | null;
}

export default async function FeaturedProducts() {
  const products = await getFeaturedProducts()
  
  // Вывод данных для отладки
  console.log('Featured Products:', JSON.stringify(products.map((p: ProductWithRelations) => ({
    id: p.id,
    name: p.name,
    main_image: p.main_image
  })), null, 2))

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.length === 0 ? (
        <div className="col-span-full text-center py-10">
          <p>Нет доступных избранных товаров</p>
        </div>
      ) : (
        products.map((product: ProductWithRelations) => (
          <ProductCard
            key={product.id}
            id={product.slug}
            name={product.name}
            description={product.description || ""}
            price={product.price}
            image={product.main_image || "/placeholder-test.svg?height=300&width=300"}
            category={product.category?.name || ""}
            isNew={product.is_hit}
          />
        ))
      )}
    </div>
  )
}
