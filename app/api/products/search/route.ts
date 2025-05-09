import { type NextRequest, NextResponse } from "next/server"
import { searchProducts } from "@/app/actions/search"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "5")

    if (!query) {
      return NextResponse.json({ products: [] })
    }

    // Используем серверный экшн для поиска продуктов
    const result = await searchProducts(query, limit)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error searching products:", error)
    return NextResponse.json({ 
      error: "Internal Server Error", 
      products: [] 
    }, { status: 500 })
  }
}
