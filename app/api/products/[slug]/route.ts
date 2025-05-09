import { type NextRequest, NextResponse } from "next/server"
import { getProductBySlug } from "@/app/actions/products"

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    // Параметры нужно получать асинхронно для Next.js >=15
    const { slug } = params

    // Fetch product with related data using Prisma server action
    const product = await getProductBySlug(slug)

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
