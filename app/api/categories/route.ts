import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const categories = await db.category.findMany({
      orderBy: {
        name: 'asc'
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    return NextResponse.json({ 
      categories: categories.map((cat: { 
        id: number; 
        name: string; 
        slug: string; 
        description: string | null; 
        parent_id: number | null; 
        created_at: Date; 
        _count: { products: number } 
      }) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        parent_id: cat.parent_id,
        created_at: cat.created_at,
        count: cat._count.products
      }))
    })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
