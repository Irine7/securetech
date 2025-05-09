"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, User, ShoppingCart, Menu, ChevronDown } from "lucide-react"
import { useCart } from "@/components/cart-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { searchProducts } from "@/app/actions/search"

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{
    id: number
    name: string
    slug: string
    price: number
    main_image?: string
    category?: { id: number; name: string; slug: string }
  }>>([])
  const [showResults, setShowResults] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Array<{
    id: number
    name: string
    slug: string
    description?: string | null
    parent_id?: number | null
    count?: number
  }>>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const { cartItems } = useCart()
  const [isPending, startTransition] = useTransition()

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  // Fetch categories for navigation
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories")
        const data = await response.json()
        if (data.categories) {
          setCategories(data.categories)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }

    fetchCategories()
  }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length > 1) {
        startTransition(async () => {
          await fetchSearchResults(searchQuery)
        })
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Handle click outside search results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const fetchSearchResults = async (query: string) => {
    if (query.length < 2) return

    setIsLoading(true)
    try {
      // Используем серверный экшн вместо fetch
      const result = await searchProducts(query, 5)

      if (result.products) {
        setSearchResults(result.products)
        setShowResults(true)
      }
    } catch (error) {
      console.error("Error fetching search results:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8">
              <div className="absolute h-8 w-8 rounded-sm bg-orange-500" />
              <div className="absolute bottom-0 right-0 h-4 w-4 rounded-sm bg-gray-700" />
            </div>
            <span className="text-xl font-bold">SecureTech</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1 h-auto py-2">
                  Каталог
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {categories.map((category) => (
                  <DropdownMenuItem key={category.id} asChild>
                    <Link href={`/catalog?category=${category.id}`} className="w-full">
                      {category.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem asChild>
                  <Link href="/catalog" className="w-full font-medium text-orange-500">
                    Все категории
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/technology" className="text-sm font-medium">
              Технологии
            </Link>
            <Link href="/support" className="text-sm font-medium">
              Поддержка
            </Link>
            <Link href="/admin" className="text-sm font-medium">
              Админ панель
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          
          <div className="relative hidden md:block w-[300px]" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск..."
                className="w-[250px] pl-8 bg-muted/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowResults(true)
                }}
              />
              {isLoading && (
                <div className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-orange-500" />
              )}
            </div>

            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-white border rounded-md shadow-lg z-50">
                <ul className="py-1">
                  {searchResults.map((product) => (
                    <li key={product.id}>
                      <Link
                        href={`/product/${product.slug}`}
                        className="flex items-center px-4 py-2 hover:bg-muted text-sm"
                        onClick={() => {
                          setShowResults(false)
                          setSearchQuery("")
                        }}
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden mr-3 flex-shrink-0">
                          <Image
                            src={product.main_image || "/placeholder-test.svg?height=40&width=40"}
                            alt={product.name || ""}
                            width={40}
                            height={40}
                            className="w-full h-full object-contain"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{product.name}</div>
                          <div className="text-xs text-muted-foreground">{product.category?.name}</div>
                        </div>
                        <div className="ml-2 text-sm font-semibold">{product.price?.toLocaleString()} ₽</div>
                      </Link>
                    </li>
                  ))}
                  <li className="border-t mt-1">
                    <Link
                      href={`/catalog?search=${encodeURIComponent(searchQuery)}`}
                      className="block px-4 py-2 text-center text-sm text-orange-500 hover:bg-orange-50"
                      onClick={() => {
                        setShowResults(false)
                      }}
                    >
                      Показать все результаты
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <ThemeSwitcher />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/login">Войти</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/register">Регистрация</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <Badge className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-medium text-white">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="grid gap-6 py-6">
                <div className="flex items-center gap-2">
                  <div className="relative h-8 w-8">
                    <div className="absolute h-8 w-8 rounded-sm bg-orange-500" />
                    <div className="absolute bottom-0 right-0 h-4 w-4 rounded-sm bg-gray-700" />
                  </div>
                  <span className="text-xl font-bold">SecureTech</span>
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Поиск..."
                    className="w-full pl-8 bg-muted/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <nav className="grid gap-4">
                  <div className="font-medium">Каталог:</div>
                  <div className="pl-4 border-l space-y-2">
                    {categories.map((category) => (
                      <Link key={category.id} href={`/catalog?category=${category.id}`} className="block text-sm">
                        {category.name}
                      </Link>
                    ))}
                    <Link href="/catalog" className="block text-sm font-medium text-orange-500">
                      Все категории
                    </Link>
                  </div>

                  <Link href="/catalog" className="text-sm font-medium">
                    Каталог
                  </Link>
                  <Link href="/support" className="text-sm font-medium">
                    Поддержка
                  </Link>
                  <Link href="/about" className="text-sm font-medium">
                    О бренде
                  </Link>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
