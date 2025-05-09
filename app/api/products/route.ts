import { type NextRequest, NextResponse } from "next/server"
import { getProducts, ProductsParams } from "@/app/actions/products"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const searchQuery = searchParams.get("search") || ""
    const categoryId = searchParams.get("category") || ""
    const bodyType = searchParams.get("bodyType") || ""
    const resolution = searchParams.get("resolution") || ""
    const minPriceStr = searchParams.get("minPrice")
    const maxPriceStr = searchParams.get("maxPrice")
    const sort = searchParams.get("sort") || "name-asc"
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)

    // Преобразуем строки цен в числа, если они предоставлены
    const minPrice = minPriceStr ? Number.parseInt(minPriceStr, 10) : undefined
    const maxPrice = maxPriceStr ? Number.parseInt(maxPriceStr, 10) : undefined

    // Собираем параметры для серверного экшена
    const params: ProductsParams = {
      page,
      limit,
      categoryId: categoryId || undefined,
      bodyType: bodyType || undefined,
      resolution: resolution || undefined,
      minPrice,
      maxPrice,
      searchQuery: searchQuery || undefined,
      sort
    }

    // Вызываем серверный экшн для получения данных
    const result = await getProducts(params)

    return NextResponse.json({
      products: result.products,
      pagination: {
        total: result.totalProducts,
        page: result.currentPage,
        limit,
        totalPages: result.totalPages || 1,
      },
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      {
        products: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
        error: "Internal Server Error",
      },
      { status: 500 },
    )
  }
}
