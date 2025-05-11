"use server"

import { revalidatePath } from "next/cache"
import db from "@/app/lib/db"
import { z } from "zod"
import { slugify } from "@/app/lib/utils"

// Схема валидации для создания/обновления категории
const categorySchema = z.object({
  name: z.string().min(2, { message: "Название должно содержать минимум 2 символа" }),
  slug: z.string().optional(),
  description: z.string().optional(),
  parent_id: z.number().optional().nullable(),
})

// Тип данных для формы категории
type CategoryFormData = z.infer<typeof categorySchema>

// Функция для получения схемы валидации
export async function getCategorySchema() {
  return categorySchema
}

// Получение всех категорий
export async function getCategories() {
  try {
    const categories = await db.category.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          }
        },
        children: {
          select: {
            id: true,
          }
        },
        _count: {
          select: {
            products: true,
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    return { 
      success: true, 
      categories 
    }
  } catch (error) {
    console.error("Ошибка при получении категорий:", error)
    return { 
      success: false, 
      error: "Не удалось загрузить категории" 
    }
  }
}

// Получение определенной категории по ID
export async function getCategoryById(id: number) {
  try {
    const category = await db.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })
    
    if (!category) {
      return { 
        success: false, 
        error: "Категория не найдена" 
      }
    }
    
    return { 
      success: true, 
      category 
    }
  } catch (error) {
    console.error(`Ошибка при получении категории с ID ${id}:`, error)
    return { 
      success: false, 
      error: "Не удалось загрузить категорию" 
    }
  }
}

// Получение родительских категорий (для выпадающего списка при создании/редактировании)
export async function getParentCategories(excludeId?: number) {
  try {
    const whereClause = excludeId ? { id: { not: excludeId } } : {}
    
    const categories = await db.category.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    return { 
      success: true, 
      categories 
    }
  } catch (error) {
    console.error("Ошибка при получении родительских категорий:", error)
    return { 
      success: false, 
      error: "Не удалось загрузить родительские категории" 
    }
  }
}

// Создание новой категории
export async function createCategory(data: CategoryFormData) {
  try {
    // Валидация данных
    const validatedData = categorySchema.parse(data)
    
    // Генерация slug, если он не предоставлен
    const slug = validatedData.slug || slugify(validatedData.name)
    
    // Проверка на уникальность slug
    const existingCategory = await db.category.findUnique({
      where: { slug }
    })
    
    if (existingCategory) {
      return { 
        success: false, 
        error: "Категория с таким URL уже существует" 
      }
    }
    
    // Создание категории
    const category = await db.category.create({
      data: {
        name: validatedData.name,
        slug,
        description: validatedData.description || null,
        parent_id: validatedData.parent_id || null,
      }
    })
    
    revalidatePath('/admin/categories')
    
    return { 
      success: true, 
      category 
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Ошибка валидации",
        validationErrors: error.errors
      }
    }
    
    console.error("Ошибка при создании категории:", error)
    return { 
      success: false, 
      error: "Не удалось создать категорию" 
    }
  }
}

// Обновление существующей категории
export async function updateCategory(id: number, data: CategoryFormData) {
  try {
    // Валидация данных
    const validatedData = categorySchema.parse(data)
    
    // Проверка существования категории
    const existingCategory = await db.category.findUnique({
      where: { id }
    })
    
    if (!existingCategory) {
      return { 
        success: false, 
        error: "Категория не найдена" 
      }
    }
    
    // Генерация slug, если он изменился
    let slug = existingCategory.slug
    if (!validatedData.slug && validatedData.name !== existingCategory.name) {
      slug = slugify(validatedData.name)
    } else if (validatedData.slug && validatedData.slug !== existingCategory.slug) {
      slug = validatedData.slug
    }
    
    // Проверка на уникальность slug, если он изменился
    if (slug !== existingCategory.slug) {
      const categoryWithSlug = await db.category.findUnique({
        where: { slug }
      })
      
      if (categoryWithSlug) {
        return { 
          success: false, 
          error: "Категория с таким URL уже существует" 
        }
      }
    }
    
    // Проверка циклической зависимости для родительской категории
    if (validatedData.parent_id) {
      // Нельзя установить категорию как родителя самой себя
      if (validatedData.parent_id === id) {
        return {
          success: false,
          error: "Категория не может быть родителем самой себя"
        }
      }
      
      // Проверка, что выбранный родитель не является дочерней категорией текущей категории
      const isDescendant = await isDescendantCategory(validatedData.parent_id, id)
      if (isDescendant) {
        return {
          success: false,
          error: "Нельзя выбрать дочернюю категорию в качестве родителя"
        }
      }
    }
    
    // Обновление категории
    const category = await db.category.update({
      where: { id },
      data: {
        name: validatedData.name,
        slug,
        description: validatedData.description,
        parent_id: validatedData.parent_id || null,
      }
    })
    
    revalidatePath('/admin/categories')
    revalidatePath(`/admin/categories/${id}`)
    
    return { 
      success: true, 
      category 
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Ошибка валидации",
        validationErrors: error.errors
      }
    }
    
    console.error(`Ошибка при обновлении категории с ID ${id}:`, error)
    return { 
      success: false, 
      error: "Не удалось обновить категорию" 
    }
  }
}

// Удаление категории
export async function deleteCategory(id: number) {
  try {
    // Проверка на наличие продуктов в категории
    const productsCount = await db.product.count({
      where: { category_id: id }
    })
    
    if (productsCount > 0) {
      return {
        success: false,
        error: `Нельзя удалить категорию, так как она содержит ${productsCount} товаров`
      }
    }
    
    // Проверка на наличие дочерних категорий
    const childrenCount = await db.category.count({
      where: { parent_id: id }
    })
    
    if (childrenCount > 0) {
      return {
        success: false,
        error: `Нельзя удалить категорию, так как она содержит ${childrenCount} дочерних категорий`
      }
    }
    
    // Удаление категории
    await db.category.delete({
      where: { id }
    })
    
    revalidatePath('/admin/categories')
    
    return { success: true }
  } catch (error) {
    console.error(`Ошибка при удалении категории с ID ${id}:`, error)
    return { 
      success: false, 
      error: "Не удалось удалить категорию" 
    }
  }
}

/**
 * Обновление изображения категории
 */
export async function updateCategoryImage(id: number, imageUrl: string) {
  console.log(`[updateCategoryImage] Начало обновления изображения для категории ID: ${id}, URL: ${imageUrl}`)
  
  try {
    // Проверка существования категории
    const categoryExists = await db.category.findUnique({
      where: { id },
      select: { id: true, image_url: true }
    })

    console.log(`[updateCategoryImage] Категория найдена:`, categoryExists)

    if (!categoryExists) {
      console.error(`[updateCategoryImage] Категория с ID ${id} не найдена`)
      return { 
        success: false, 
        error: "Категория не найдена" 
      }
    }

    // Текущее изображение категории
    console.log(`[updateCategoryImage] Текущее изображение:`, categoryExists.image_url)

    // Используем SQL запрос для обновления
    const result = await db.$executeRaw`UPDATE "Category" SET "image_url" = ${imageUrl} WHERE "id" = ${id}`;
    
    console.log(`[updateCategoryImage] Результат SQL запроса:`, result)
    
    // Проверяем, что изображение действительно обновилось
    const updatedCategory = await db.category.findUnique({
      where: { id },
      select: { image_url: true }
    })
    
    console.log(`[updateCategoryImage] Обновленное изображение:`, updatedCategory?.image_url)
    
    // Очистка кэша
    revalidatePath('/admin/categories')
    revalidatePath(`/admin/categories/${id}`)
    
    console.log(`[updateCategoryImage] Успешно обновлено изображение категории ${id}`)
    
    return { 
      success: true,
      imageUrl: updatedCategory?.image_url || imageUrl 
    }
  } catch (error) {
    console.error(`[updateCategoryImage] Ошибка при обновлении изображения категории с ID ${id}:`, error)
    return { 
      success: false, 
      error: "Не удалось обновить изображение категории",
      details: error instanceof Error ? error.message : String(error)
    }
  }
}

// Проверка, является ли одна категория потомком другой
// Используется для предотвращения циклических зависимостей
async function isDescendantCategory(possibleDescendantId: number, ancestorId: number): Promise<boolean> {
  // Получаем все дочерние категории предполагаемого предка
  const childCategories = await db.category.findMany({
    where: { parent_id: ancestorId },
    select: { id: true }
  })
  
  // Проверяем, является ли предполагаемый потомок дочерней категорией
  for (const child of childCategories) {
    if (child.id === possibleDescendantId) {
      return true
    }
    
    // Рекурсивно проверяем всех потомков
    const isDescendant = await isDescendantCategory(possibleDescendantId, child.id)
    if (isDescendant) {
      return true
    }
  }
  
  return false
}
