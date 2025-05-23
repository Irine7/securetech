'use server'

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Типы для создания и обновления товаров
export type ProductCreateInput = {
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
}

export type ProductUpdateInput = Partial<ProductCreateInput> & { id: number }

// CRUD операции для товаров
export async function createProduct(data: ProductCreateInput) {
  try {
    // Проверяем уникальность SKU перед созданием
    const skuCheck = await checkSkuUniqueness(data.sku);
    if (!skuCheck.isUnique) {
      return { 
        success: false, 
        error: 'Товар с таким артикулом (SKU) уже существует. Пожалуйста, используйте другой артикул.' 
      }
    }
    
    // Проверяем уникальность slug перед созданием
    const slugCheck = await checkSlugUniqueness(data.slug);
    if (!slugCheck.isUnique) {
      return { 
        success: false, 
        error: 'Товар с таким URL (slug) уже существует. Пожалуйста, используйте другой URL.' 
      }
    }
    
    // Устанавливаем значение по умолчанию для main_image, если оно не указано
    if (!data.main_image) {
      data.main_image = "/placeholder-test.svg"
    }
    
    const product = await db.product.create({
      data
    })
    
    revalidatePath('/admin/products')
    revalidatePath('/catalog')
    revalidatePath('/')
    
    return { success: true, product }
  } catch (error: any) {
    console.error('Ошибка при создании товара:', error)
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('sku')) {
        return { success: false, error: 'Товар с таким артикулом (SKU) уже существует' }
      }
      if (error.meta?.target?.includes('slug')) {
        return { success: false, error: 'Товар с таким URL (slug) уже существует' }
      }
    }
    return { success: false, error: 'Не удалось создать товар' }
  }
}

export async function updateProduct(data: ProductUpdateInput) {
  const { id, ...updateData } = data
  
  try {
    // Проверяем уникальность SKU перед обновлением, если SKU изменился
    if (updateData.sku) {
      const skuCheck = await checkSkuUniqueness(updateData.sku, id);
      if (!skuCheck.isUnique) {
        return { 
          success: false, 
          error: 'Товар с таким артикулом (SKU) уже существует. Пожалуйста, используйте другой артикул.' 
        }
      }
    }
    
    // Проверяем уникальность slug перед обновлением, если slug изменился
    if (updateData.slug) {
      const slugCheck = await checkSlugUniqueness(updateData.slug, id);
      if (!slugCheck.isUnique) {
        return { 
          success: false, 
          error: 'Товар с таким URL (slug) уже существует. Пожалуйста, используйте другой URL.' 
        }
      }
    }
    
    const product = await db.product.update({
      where: { id },
      data: updateData
    })
    
    revalidatePath('/admin/products')
    revalidatePath(`/product/${product.slug}`)
    revalidatePath('/catalog')
    revalidatePath('/')
    
    return { success: true, product }
  } catch (error: any) {
    console.error('Ошибка при обновлении товара:', error)
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('sku')) {
        return { success: false, error: 'Товар с таким артикулом (SKU) уже существует' }
      }
      if (error.meta?.target?.includes('slug')) {
        return { success: false, error: 'Товар с таким URL (slug) уже существует' }
      }
    }
    return { success: false, error: 'Не удалось обновить товар' }
  }
}

export async function deleteProduct(id: number) {
  try {
    await db.product.delete({
      where: { id }
    })
    
    revalidatePath('/admin/products')
    revalidatePath('/catalog')
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    console.error('Ошибка при удалении товара:', error)
    return { success: false, error: 'Не удалось удалить товар' }
  }
}

export async function addProductImage(productId: number, imageUrl: string, isMain: boolean = false) {
  try {
    // Находим максимальный sort_order для изображений этого продукта
    const existingImages = await db.productImage.findMany({
      where: { product_id: productId },
      orderBy: { sort_order: 'desc' },
      take: 1
    })
    
    const nextSortOrder = existingImages.length > 0 ? existingImages[0].sort_order + 1 : 0
    
    // Создаем новое изображение
    const image = await db.productImage.create({
      data: {
        product_id: productId,
        image_url: imageUrl,
        is_main: isMain,
        sort_order: nextSortOrder
      }
    })
    
    // Если это главное изображение, обновляем main_image у продукта
    if (isMain) {
      await db.product.update({
        where: { id: productId },
        data: { main_image: imageUrl }
      })
    }
    
    revalidatePath('/admin/products')
    
    return { success: true, image }
  } catch (error) {
    console.error('Ошибка при добавлении изображения:', error)
    return { success: false, error: 'Не удалось добавить изображение' }
  }
}

export async function deleteProductImage(imageId: number) {
  try {
    const image = await db.productImage.delete({
      where: { id: imageId }
    })
    
    revalidatePath('/admin/products')
    
    return { success: true }
  } catch (error) {
    console.error('Ошибка при удалении изображения:', error)
    return { success: false, error: 'Не удалось удалить изображение' }
  }
}

// Функции для работы с заказами
export async function getAllOrders(page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit
    
    // Проверяем, существует ли модель Order в Prisma
    let hasOrderModel = true;
    try {
      // Пытаемся выполнить простой запрос, чтобы проверить существование модели
      await db.order.count();
    } catch (e) {
      hasOrderModel = false;
    }
    
    if (!hasOrderModel) {
      // Если модель не существует, возвращаем пустые данные
      return {
        orders: [],
        pagination: {
          totalOrders: 0,
          totalPages: 1,
          currentPage: page
        }
      };
    }
    
    const orders = await db.order.findMany({
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })
    
    const totalOrders = await db.order.count()
    const totalPages = Math.ceil(totalOrders / limit) || 1 // Избегаем деления на ноль
    
    return {
      orders,
      pagination: {
        totalOrders,
        totalPages,
        currentPage: page
      }
    }
  } catch (error) {
    console.error('Ошибка при получении заказов:', error)
    // Вместо выбрасывания исключения возвращаем пустые данные
    return {
      orders: [],
      pagination: {
        totalOrders: 0,
        totalPages: 1,
        currentPage: page
      }
    }
  }
}

export async function updateOrderStatus(orderId: number, status: string) {
  try {
    const order = await db.order.update({
      where: { id: orderId },
      data: { status }
    })
    
    revalidatePath('/admin/orders')
    
    return { success: true, order }
  } catch (error) {
    console.error('Ошибка при обновлении статуса заказа:', error)
    return { success: false, error: 'Не удалось обновить статус заказа' }
  }
}

export async function getOrderDetails(orderId: number) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    })
    
    if (!order) {
      return { success: false, error: 'Заказ не найден' }
    }
    
    return { success: true, order }
  } catch (error) {
    console.error('Ошибка при получении деталей заказа:', error)
    return { success: false, error: 'Не удалось получить детали заказа' }
  }
}

// Проверка уникальности slug товара
export async function checkSlugUniqueness(slug: string, productId?: number) {
  try {
    const where: Record<string, unknown> = { slug }
    
    // Если указан ID товара, исключаем его из поиска
    if (productId) {
      where.id = { not: productId }
    }
    
    const existingProduct = await db.product.findFirst({ where })
    
    return { 
      success: true, 
      isUnique: !existingProduct,
      product: existingProduct
    }
  } catch (error) {
    console.error('Ошибка при проверке уникальности slug:', error)
    return { success: false, isUnique: false, error: 'Не удалось проверить уникальность URL' }
  }
}

// Проверка уникальности SKU товара
export async function checkSkuUniqueness(sku: string, productId?: number) {
  try {
    const where: Record<string, unknown> = { sku }
    
    // Если указан ID товара, исключаем его из поиска
    if (productId) {
      where.id = { not: productId }
    }
    
    const existingProduct = await db.product.findFirst({ where })
    
    return { 
      success: true, 
      isUnique: !existingProduct,
      product: existingProduct
    }
  } catch (error) {
    console.error('Ошибка при проверке уникальности SKU:', error)
    return { success: false, isUnique: false, error: 'Не удалось проверить уникальность артикула' }
  }
}

// Получение продукта по ID
export async function getProductById(id: number) {
  try {
    const product = await db.product.findUnique({
      where: { id },
      include: {
        images: true
      }
    })
    
    if (!product) {
      return { success: false, error: 'Товар не найден' }
    }
    
    return { success: true, product }
  } catch (error) {
    console.error('Ошибка при получении товара:', error)
    return { success: false, error: 'Не удалось получить товар' }
  }
}

// Функция для админ-дашборда
export async function getDashboardStats() {
  try {
    // Общее количество товаров
    const productsCount = await db.product.count()
    
    // Проверяем, существует ли модель Order в Prisma
    let ordersCount = 0;
    let totalSales = 0;
    let completedSales = 0;
    let newOrdersCount = 0;
    let ordersByStatus: Record<string, number> = {};
    let popularProducts: Array<{id: number, name: string, count: number, total: number}> = [];
    
    try {
      // Общее количество заказов
      ordersCount = await db.order.count()
      
      // Общая сумма заказов
      const salesResult = await db.order.aggregate({
        _sum: {
          total_amount: true
        }
      })
      
      totalSales = salesResult._sum.total_amount || 0
      
      // Сумма выполненных заказов (статус COMPLETED)
      const completedSalesResult = await db.order.aggregate({
        where: {
          status: 'COMPLETED'
        },
        _sum: {
          total_amount: true
        }
      })
      
      completedSales = completedSalesResult._sum.total_amount || 0
      
      // Количество новых заказов (статус CREATED)
      newOrdersCount = await db.order.count({
        where: {
          status: 'CREATED'
        }
      })
      
      // Количество заказов по статусам
      const ordersStatusResult = await db.order.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      })
      
      ordersByStatus = ordersStatusResult.reduce<Record<string, number>>((acc, curr) => {
        // Преобразуем статусы для отображения
        const statusMap: Record<string, string> = {
          'CREATED': 'Новый',
          'VIEWED': 'В обработке',
          'COMPLETED': 'Выполнен',
          'CANCELED': 'Отменен'
        };
        
        const displayStatus = statusMap[curr.status] || curr.status;
        acc[displayStatus] = curr._count.id;
        return acc;
      }, {})
      
      // Получение популярных товаров (топ-5)
      const popularProductsResult = await db.$queryRaw`
        SELECT 
          p.id, 
          p.name, 
          COUNT(oi.id) as order_count, 
          SUM(oi.quantity) as total_quantity
        FROM "Product" p
        JOIN "OrderItem" oi ON p.id = oi.product_id
        JOIN "Order" o ON oi.order_id = o.id
        GROUP BY p.id, p.name
        ORDER BY total_quantity DESC
        LIMIT 5
      `;
      
      popularProducts = (popularProductsResult as any[]).map(item => ({
        id: item.id,
        name: item.name,
        count: Number(item.order_count),
        total: Number(item.total_quantity)
      }));
      
    } catch (e) {
      console.log('Модель заказов не существует или произошла другая ошибка:', e)
    }
    
    return {
      productsCount,
      ordersCount,
      totalSales,
      completedSales,
      newOrdersCount,
      ordersByStatus,
      popularProducts
    }
  } catch (error) {
    console.error('Ошибка при получении статистики:', error)
    // Возвращаем безопасные значения по умолчанию вместо выбрасывания исключения
    return {
      productsCount: 0,
      ordersCount: 0,
      totalSales: 0,
      completedSales: 0,
      newOrdersCount: 0,
      ordersByStatus: {},
      popularProducts: []
    }
  }
}
