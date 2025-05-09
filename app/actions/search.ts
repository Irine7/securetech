'use server'

import { db } from "@/lib/db"

export async function searchProducts(query: string, limit = 5) {
  if (!query || query.length < 2) {
    return { products: [] }
  }
  
  try {
    const products = await db.product.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            sku: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      take: limit,
    })

    return { products }
  } catch (error) {
    console.error('Error searching products:', error)
    return {
      error: 'Failed to search products',
      products: [],
    }
  }
}
