import { type NextRequest, NextResponse } from "next/server"
import { getProductFilters } from "@/app/actions/products"

export async function GET(request: NextRequest) {
  try {
    const result = await getProductFilters()
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching filters:", error)
    return NextResponse.json(
      {
        error: "Internal Server Error",
        categories: [],
        bodyTypes: [],
        resolutions: [],
        priceRange: { min: 0, max: 100000 },
      },
      { status: 500 },
    )
  }
}
