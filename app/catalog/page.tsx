"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Grid, List, Search, Plus, SlidersHorizontal, X, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { useCart } from "@/components/cart-provider"
import { useToast } from "@/components/ui/use-toast"
import type { Product, FilterOption, PriceRange } from "@/lib/supabase"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"

export default function CatalogPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { addToCart } = useCart()

  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [totalProducts, setTotalProducts] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [productsError, setProductsError] = useState<string | null>(null)

  // Filters state
  const [categories, setCategories] = useState<FilterOption[]>([])
  const [bodyTypes, setBodyTypes] = useState<FilterOption[]>([])
  const [resolutions, setResolutions] = useState<FilterOption[]>([])
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 100000 })
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(100000)
  const [searchValue, setSearchValue] = useState("")
  const [sortValue, setSortValue] = useState("name-asc")
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [filterError, setFilterError] = useState<string | null>(null)

  // Memoize fetch functions to prevent unnecessary re-renders
  const fetchFilters = useCallback(async () => {
    try {
      const response = await fetch("/api/filters")

      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Filter API error:", response.status, errorText)
        setFilterError(`Ошибка загрузки фильтров: ${response.status}`)
        return
      }

      // Try to parse JSON
      let data
      try {
        data = await response.json()
      } catch (e) {
        console.error("Failed to parse filter response as JSON:", e)
        setFilterError("Ошибка обработки данных фильтров")
        return
      }

      if (data.error) {
        setFilterError(data.error)
        return
      }

      // Ensure we have valid data before updating state
      if (data) {
        // Update categories with checked state based on URL
        const categoryId = searchParams.get("category")
        if (Array.isArray(data.categories)) {
          setCategories(
            data.categories.map((cat: FilterOption) => ({
              ...cat,
              checked: categoryId ? cat.id.toString() === categoryId : false,
            })),
          )
        } else {
          setCategories([])
        }

        // Update body types with checked state based on URL
        const bodyType = searchParams.get("bodyType")
        if (Array.isArray(data.bodyTypes)) {
          setBodyTypes(
            data.bodyTypes.map((type: FilterOption) => ({
              ...type,
              checked: bodyType ? type.id.toString() === bodyType : false,
            })),
          )
        } else {
          setBodyTypes([])
        }

        // Update resolutions with checked state based on URL
        const resolution = searchParams.get("resolution")
        if (Array.isArray(data.resolutions)) {
          setResolutions(
            data.resolutions.map((res: FilterOption) => ({
              ...res,
              checked: resolution ? res.id.toString() === resolution : false,
            })),
          )
        } else {
          setResolutions([])
        }

        // Update price range
        if (data.priceRange) {
          setPriceRange(data.priceRange)

          // Set price range if not already set from URL
          const minPriceParam = searchParams.get("minPrice")
          const maxPriceParam = searchParams.get("maxPrice")

          if (!minPriceParam && !maxPriceParam) {
            setMinPrice(data.priceRange.min)
            setMaxPrice(data.priceRange.max)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching filters:", error)
      setFilterError("Ошибка загрузки фильтров")
    }
  }, [searchParams])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setProductsError(null)

    try {
      // Build query params from search params
      const params = new URLSearchParams()

      const search = searchParams.get("search")
      if (search) params.append("search", search)

      const category = searchParams.get("category")
      if (category) params.append("category", category)

      const bodyType = searchParams.get("bodyType")
      if (bodyType) params.append("bodyType", bodyType)

      const resolution = searchParams.get("resolution")
      if (resolution) params.append("resolution", resolution)

      const minPriceParam = searchParams.get("minPrice")
      if (minPriceParam) params.append("minPrice", minPriceParam)

      const maxPriceParam = searchParams.get("maxPrice")
      if (maxPriceParam) params.append("maxPrice", maxPriceParam)

      const sort = searchParams.get("sort") || "name-asc"
      params.append("sort", sort)

      const page = searchParams.get("page") || "1"
      params.append("page", page)

      params.append("limit", "10")

      const response = await fetch(`/api/products?${params.toString()}`)

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        console.error("Products API error:", response.status, errorText)
        setProductsError(`Ошибка загрузки товаров: ${response.status}`)
        return
      }

      let data
      try {
        data = await response.json()
      } catch (e) {
        console.error("Failed to parse products response as JSON:", e)
        setProductsError("Ошибка обработки данных товаров")
        return
      }

      if (data.error) {
        setProductsError(data.error)
        return
      }

      if (data.products) {
        setProducts(data.products)
        setTotalProducts(data.pagination.total)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      setProductsError("Ошибка загрузки товаров")
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  // Initialize state from URL params only once
  useEffect(() => {
    if (!isInitialized) {
      const search = searchParams.get("search") || ""
      const sort = searchParams.get("sort") || "name-asc"
      const category = searchParams.get("category") || ""
      const bodyType = searchParams.get("bodyType") || ""
      const resolution = searchParams.get("resolution") || ""
      const minPriceParam = searchParams.get("minPrice")
      const maxPriceParam = searchParams.get("maxPrice")
      const page = searchParams.get("page") || "1"

      setSearchValue(search)
      setSortValue(sort)
      setCurrentPage(Number.parseInt(page))

      // Update active filters
      const filters = []
      if (category) filters.push(`category-${category}`)
      if (bodyType) filters.push(`bodyType-${bodyType}`)
      if (resolution) filters.push(`resolution-${resolution}`)
      setActiveFilters(filters)

      // Set price range if provided
      if (minPriceParam && maxPriceParam) {
        setMinPrice(Number.parseInt(minPriceParam))
        setMaxPrice(Number.parseInt(maxPriceParam))
      }

      setIsInitialized(true)
    }
  }, [searchParams, isInitialized])

  // Fetch data when URL params change
  useEffect(() => {
    if (isInitialized) {
      fetchFilters()
      fetchProducts()
    }
  }, [fetchFilters, fetchProducts, isInitialized])

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.slug,
      name: product.name,
      price: product.price,
      image: product.main_image,
    })

    toast({
      title: "Товар добавлен в корзину",
      description: product.name,
      duration: 3000,
    })
  }

  const updateFilters = (type: string, value: string, checked: boolean) => {
    // Create a new URLSearchParams object from the current search params
    const params = new URLSearchParams(searchParams.toString())

    // Update the specific filter
    if (checked) {
      params.set(type, value)
    } else {
      params.delete(type)
    }

    // Reset to page 1 when filters change
    params.set("page", "1")

    // Update the URL
    router.push(`/catalog?${params.toString()}`)
  }

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    updateFilters("category", categoryId, checked)
  }

  const handleBodyTypeChange = (bodyType: string, checked: boolean) => {
    updateFilters("bodyType", bodyType, checked)
  }

  const handleResolutionChange = (resolution: string, checked: boolean) => {
    updateFilters("resolution", resolution, checked)
  }

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value) || 0
    setMinPrice(value)
  }

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value) || 0
    setMaxPrice(value)
  }

  const applyPriceRange = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("minPrice", minPrice.toString())
    params.set("maxPrice", maxPrice.toString())
    params.set("page", "1")
    router.push(`/catalog?${params.toString()}`)
  }

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", value)
    router.push(`/catalog?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchValue) {
      params.set("search", searchValue)
    } else {
      params.delete("search")
    }
    params.set("page", "1")
    router.push(`/catalog?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`/catalog?${params.toString()}`)
  }

  const clearFilter = (filter: string) => {
    const [type, value] = filter.split("-")
    const params = new URLSearchParams(searchParams.toString())
    params.delete(type)
    params.set("page", "1")
    router.push(`/catalog?${params.toString()}`)
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams()
    const search = searchParams.get("search")
    if (search) params.set("search", search)
    const sort = searchParams.get("sort")
    if (sort) params.set("sort", sort)
    router.push(`/catalog?${params.toString()}`)
  }

  // Get active filter names for display
  const getActiveFilterNames = () => {
    return activeFilters
      .map((filter) => {
        const [type, value] = filter.split("-")

        if (type === "category") {
          const category = categories.find((c) => c.id.toString() === value)
          return category ? category.name : ""
        }

        if (type === "bodyType") {
          const bodyType = bodyTypes.find((b) => b.id.toString() === value)
          return bodyType ? bodyType.name : ""
        }

        if (type === "resolution") {
          const resolution = resolutions.find((r) => r.id.toString() === value)
          return resolution ? resolution.name : ""
        }

        return ""
      })
      .filter(Boolean)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Main content */}
        <div className="flex-1 order-2 md:order-1">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">IP-камеры Lite, Eco, Value</h1>
            <p className="text-muted-foreground">Доступные решения для видеонаблюдения</p>
          </div>

          {filterError && (
            <div className="mb-4 p-4 border border-red-200 bg-red-50 text-red-700 rounded-md">
              {filterError}. Некоторые фильтры могут быть недоступны.
            </div>
          )}

          {productsError && (
            <div className="mb-4 p-4 border border-red-200 bg-red-50 text-red-700 rounded-md flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Ошибка загрузки товаров</p>
                <p>{productsError}</p>
              </div>
            </div>
          )}

          {/* Active filters */}
          {activeFilters.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {getActiveFilterNames().map((name, index) => (
                <Badge key={index} variant="secondary" className="px-3 py-1">
                  {name}
                  <button
                    className="ml-2 text-muted-foreground hover:text-foreground"
                    onClick={() => clearFilter(activeFilters[index])}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {activeFilters.length > 1 && (
                <Button variant="ghost" size="sm" className="text-xs" onClick={clearAllFilters}>
                  Очистить все
                </Button>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-2">
              <Select value={sortValue} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Сортировка" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">По названию (А-Я)</SelectItem>
                  <SelectItem value="name-desc">По названию (Я-А)</SelectItem>
                  <SelectItem value="price-asc">По цене (возрастание)</SelectItem>
                  <SelectItem value="price-desc">По цене (убывание)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="py-4">
                    <h3 className="font-semibold mb-4">Фильтры</h3>
                    {/* Mobile filters content - same as sidebar */}
                    <div className="space-y-6">
                      {/* Search */}
                      <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Поиск..."
                          className="pl-8"
                          value={searchValue}
                          onChange={(e) => setSearchValue(e.target.value)}
                        />
                        <Button type="submit" className="sr-only">
                          Поиск
                        </Button>
                      </form>

                      {/* Categories */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Категории</h4>
                        <div className="space-y-2">
                          {categories.map((category) => (
                            <div key={category.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`mobile-category-${category.id}`}
                                checked={category.checked}
                                onCheckedChange={(checked) =>
                                  handleCategoryChange(category.id.toString(), checked as boolean)
                                }
                              />
                              <label
                                htmlFor={`mobile-category-${category.id}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {category.name} ({category.count})
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Body Types */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Тип корпуса</h4>
                        <div className="space-y-2">
                          {bodyTypes.map((type) => (
                            <div key={type.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`mobile-bodyType-${type.id}`}
                                checked={type.checked}
                                onCheckedChange={(checked) =>
                                  handleBodyTypeChange(type.id.toString(), checked as boolean)
                                }
                              />
                              <label
                                htmlFor={`mobile-bodyType-${type.id}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {type.name} ({type.count})
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Resolutions */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Разрешение</h4>
                        <div className="space-y-2">
                          {resolutions.map((resolution) => (
                            <div key={resolution.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`mobile-resolution-${resolution.id}`}
                                checked={resolution.checked}
                                onCheckedChange={(checked) =>
                                  handleResolutionChange(resolution.id.toString(), checked as boolean)
                                }
                              />
                              <label
                                htmlFor={`mobile-resolution-${resolution.id}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {resolution.name} ({resolution.count})
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Price Range */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Цена</h4>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label htmlFor="mobile-min-price" className="text-xs text-muted-foreground mb-1 block">
                                От
                              </label>
                              <Input
                                id="mobile-min-price"
                                type="number"
                                min={priceRange.min}
                                max={maxPrice}
                                value={minPrice}
                                onChange={handleMinPriceChange}
                              />
                            </div>
                            <div>
                              <label htmlFor="mobile-max-price" className="text-xs text-muted-foreground mb-1 block">
                                До
                              </label>
                              <Input
                                id="mobile-max-price"
                                type="number"
                                min={minPrice}
                                max={priceRange.max}
                                value={maxPrice}
                                onChange={handleMaxPriceChange}
                              />
                            </div>
                          </div>
                          <Button className="w-full" onClick={applyPriceRange}>
                            Применить
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">Товары не найдены</h3>
              <p className="text-muted-foreground">Попробуйте изменить параметры поиска или фильтры</p>
              <Button variant="outline" className="mt-4" onClick={clearAllFilters}>
                Сбросить все фильтры
              </Button>
            </div>
          ) : (
            <>
              {viewMode === "list" ? (
                <div className="border rounded-md overflow-hidden">
                  {products.map((product, index) => (
                    <div
                      key={product.id}
                      className={`flex items-center p-4 ${index !== products.length - 1 ? "border-b" : ""}`}
                    >
                      <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-md overflow-hidden">
                        <Image
                          src={"/placeholder-test.svg"}
                          alt={product.name}
                          width={100}
                          height={100}
                          className="w-full h-full object-contain"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 ml-6">
                        <Link href={`/product/${product.slug}`}>
                          <h3 className="text-lg font-medium hover:text-orange-500">{product.name}</h3>
                        </Link>
                        <div className="text-sm text-muted-foreground mt-1">{product.description}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <div className="text-xl font-bold">{product.price.toLocaleString()} ₽</div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleAddToCart(product)}>
                            <Plus className="h-4 w-4 mr-1" />В корзину
                          </Button>
                          <Button
                            variant="outline"
                            className="text-orange-500 border-orange-500 hover:bg-orange-50"
                            size="sm"
                            asChild
                          >
                            <Link href={`/product/${product.slug}`}>Подробнее</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div key={product.id} className="border rounded-md overflow-hidden">
                      <div className="p-4 flex justify-center bg-gray-50">
                        <Image
                          src={"/placeholder-test.svg"}
                          alt={product.name}
                          width={150}
                          height={150}
                          className="h-[150px] w-[150px] object-contain"
                          unoptimized
                        />
                      </div>
                      <div className="p-4">
                        <Link href={`/product/${product.slug}`}>
                          <h3 className="text-lg font-medium hover:text-orange-500">{product.name}</h3>
                        </Link>
                        <div className="text-sm text-muted-foreground mt-1">{product.description}</div>
                        <div className="flex justify-between items-center mt-4">
                          <div className="text-xl font-bold">{product.price.toLocaleString()} ₽</div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" className="flex-1" onClick={() => handleAddToCart(product)}>
                            <Plus className="h-4 w-4 mr-1" />В корзину
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 text-orange-500 border-orange-500 hover:bg-orange-50"
                            asChild
                          >
                            <Link href={`/product/${product.slug}`}>Подробнее</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <nav className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage <= 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      &lt;
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="icon"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage >= totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      &gt;
                    </Button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar filters - desktop only */}
        <div className="w-full md:w-64 order-1 md:order-2 flex-shrink-0 hidden md:block">
          <div className="space-y-6">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск..."
                className="pl-8"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              <Button type="submit" className="sr-only">
                Поиск
              </Button>
            </form>

            {/* Categories */}
            <div className="border rounded-md overflow-hidden">
              <Accordion type="multiple" defaultValue={["categories"]}>
                <AccordionItem value="categories" className="border-b">
                  <AccordionTrigger className="px-4 py-3 text-base font-semibold hover:no-underline">
                    КАТЕГОРИИ
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-3">
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={category.checked}
                            onCheckedChange={(checked) =>
                              handleCategoryChange(category.id.toString(), checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`category-${category.id}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {category.name} ({category.count})
                          </label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="border rounded-md p-4">
              <h3 className="font-semibold mb-3">Фильтры</h3>

              <div className="space-y-4">
                {/* Body Types */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Тип корпуса</h4>
                  <div className="space-y-2">
                    {bodyTypes.map((type) => (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`bodyType-${type.id}`}
                          checked={type.checked}
                          onCheckedChange={(checked) => handleBodyTypeChange(type.id.toString(), checked as boolean)}
                        />
                        <label
                          htmlFor={`bodyType-${type.id}`}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {type.name} ({type.count})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resolutions */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Разрешение</h4>
                  <div className="space-y-2">
                    {resolutions.map((resolution) => (
                      <div key={resolution.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`resolution-${resolution.id}`}
                          checked={resolution.checked}
                          onCheckedChange={(checked) =>
                            handleResolutionChange(resolution.id.toString(), checked as boolean)
                          }
                        />
                        <label
                          htmlFor={`resolution-${resolution.id}`}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {resolution.name} ({resolution.count})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Цена</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="min-price" className="text-xs text-muted-foreground mb-1 block">
                          От
                        </label>
                        <Input
                          id="min-price"
                          type="number"
                          min={priceRange.min}
                          max={maxPrice}
                          value={minPrice}
                          onChange={handleMinPriceChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="max-price" className="text-xs text-muted-foreground mb-1 block">
                          До
                        </label>
                        <Input
                          id="max-price"
                          type="number"
                          min={minPrice}
                          max={priceRange.max}
                          value={maxPrice}
                          onChange={handleMaxPriceChange}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{minPrice.toLocaleString()} ₽</span>
                      <span>{maxPrice.toLocaleString()} ₽</span>
                    </div>
                    <Button className="w-full" onClick={applyPriceRange}>
                      Применить
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
