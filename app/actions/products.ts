'use server'

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export interface ProductsParams {
  page?: number
  limit?: number
  categoryId?: string
  bodyType?: string
  resolution?: string
  minPrice?: number
  maxPrice?: number
  searchQuery?: string
  sort?: string
}

interface FilterOption {
  id: string | number
  name: string
  count: number
  checked?: boolean
}

export async function getProducts(params: ProductsParams = {}) {
  try {
    const {
      page = 1,
      limit = 10,
      categoryId,
      bodyType,
      resolution,
      minPrice,
      maxPrice,
      searchQuery,
      sort = "name-asc"
    } = params

    // Calculate pagination
    const skip = (page - 1) * limit

    // Build the query with filters
    const where: Record<string, unknown> = {}

    // Category filter
    if (categoryId) {
      where.category_id = Number.parseInt(categoryId, 10)
    }

    // Price filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {}
      if (minPrice !== undefined) {
        (where.price as Record<string, number>).gte = minPrice
      }
      if (maxPrice !== undefined) {
        (where.price as Record<string, number>).lte = maxPrice
      }
    }

    // Search filter
    if (searchQuery) {
      where.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } }
      ]
    }

    // Body type filter (via specifications)
    if (bodyType) {
      where.specifications = {
        some: {
          AND: [
            { specification: { slug: 'body-type' } },
            { value: { equals: bodyType, mode: 'insensitive' } }
          ]
        }
      }
    }

    // Resolution filter (via specifications)
    if (resolution) {
      where.specifications = {
        some: {
          AND: [
            { specification: { slug: 'resolution' } },
            { value: { equals: resolution, mode: 'insensitive' } }
          ]
        }
      }
    }

    // Define sort order
    const orderBy: Record<string, string> = {}

    switch (sort) {
      case 'price-asc':
        orderBy.price = 'asc'
        break
      case 'price-desc':
        orderBy.price = 'desc'
        break
      case 'name-desc':
        orderBy.name = 'desc'
        break
      case 'name-asc':
        orderBy.name = 'asc'
        break
      default:
        orderBy.name = 'asc'
    }

    // Get products with pagination
    const products = await db.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        category: true,
        images: true,
        specifications: {
          include: {
            specification: true
          }
        }
      }
    })

    // Get total count for pagination
    const totalProducts = await db.product.count({ where })
    const totalPages = Math.ceil(totalProducts / limit)

    return {
      products,
      totalProducts,
      totalPages,
      currentPage: page
    }
  } catch (error) {
    console.error('Error fetching products:', error)
    throw new Error('Failed to fetch products')
  }
}

export async function getProductBySlug(slug: string) {
  try {
    if (!slug) {
      throw new Error('Slug parameter is required')
    }

    const product = await db.product.findUnique({
      where: {
        slug
      },
      include: {
        category: true,
        images: true,
        specifications: {
          include: {
            specification: true
          }
        }
      }
    })

    if (!product) {
      return null
    }

    return product
  } catch (error) {
    console.error('Error fetching product by slug:', error)
    throw new Error('Failed to fetch product')
  }
}

export async function getFeaturedProducts(limit = 4) {
  try {
    return await db.product.findMany({
      where: {
        is_hit: true
      },
      take: limit,
      include: {
        category: true,
        images: true
      }
    })
  } catch (error) {
    console.error('Error fetching featured products:', error)
    throw new Error('Failed to fetch featured products')
  }
}

export async function getCategories(limit?: number) {
  try {
    return await db.category.findMany({
      orderBy: {
        name: 'asc'
      },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image_url: true,
        parent_id: true,
        _count: {
          select: {
            products: true
          }
        }
      }
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    throw new Error('Failed to fetch categories')
  }
}

export async function getProductFilters() {
  try {
    // Get categories with product counts and images
    const categories = await db.category.findMany({
      select: {
        id: true,
        name: true,
        image_url: true,
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Get body types from specifications
    const bodyTypesSpec = await db.specification.findFirst({
      where: { slug: 'body-type' }
    })

    const bodyTypes: FilterOption[] = []

    if (bodyTypesSpec) {
      // Get unique body types and counts
      const bodyTypeValues = await db.productSpecification.findMany({
        where: {
          specification_id: bodyTypesSpec.id
        },
        select: {
          value: true,
          product_id: true
        }
      })

      // Count occurrences of each body type
      const bodyTypeCounts: Record<string, number> = {}
      
      for (const item of bodyTypeValues) {
        const { value } = item
        if (!bodyTypeCounts[value]) {
          bodyTypeCounts[value] = 0
        }
        bodyTypeCounts[value]++
      }

      for (const [name, count] of Object.entries(bodyTypeCounts)) {
        bodyTypes.push({
          id: name,
          name,
          count
        })
      }
    }

    // Get resolutions from specifications
    const resolutionSpec = await db.specification.findFirst({
      where: { slug: 'resolution' }
    })

    const resolutions: FilterOption[] = []

    if (resolutionSpec) {
      // Get unique resolutions and counts
      const resolutionValues = await db.productSpecification.findMany({
        where: {
          specification_id: resolutionSpec.id
        },
        select: {
          value: true,
          product_id: true
        }
      })

      // Count occurrences of each resolution
      const resolutionCounts: Record<string, number> = {}
      
      for (const item of resolutionValues) {
        const { value } = item
        if (!resolutionCounts[value]) {
          resolutionCounts[value] = 0
        }
        resolutionCounts[value]++
      }

      for (const [name, count] of Object.entries(resolutionCounts)) {
        resolutions.push({
          id: name,
          name,
          count
        })
      }
    }

    // Get price range
    const priceStats = await db.$queryRaw`
      SELECT 
        MIN(price) as min, 
        MAX(price) as max 
      FROM "Product"
    ` as Array<{ min: number; max: number }>

    const priceRange = {
      min: priceStats[0]?.min || 0,
      max: priceStats[0]?.max || 100000
    }

    return {
      categories: categories.map((cat: { id: number; name: string; _count: { products: number } }) => ({ 
        id: cat.id, 
        name: cat.name, 
        count: cat._count.products 
      })),
      bodyTypes,
      resolutions,
      priceRange
    }
  } catch (error) {
    console.error('Error fetching filters:', error)
    throw new Error('Failed to fetch filters')
  }
}
