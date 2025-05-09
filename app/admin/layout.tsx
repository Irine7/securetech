"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ShoppingBag, Package, Users, Settings, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  const navItems = [
    {
      title: "Дашборд",
      href: "/admin",
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      title: "Товары",
      href: "/admin/products",
      icon: <Package className="h-5 w-5" />
    },
    {
      title: "Заказы",
      href: "/admin/orders",
      icon: <ShoppingBag className="h-5 w-5" />
    },
    {
      title: "Настройки",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />
    }
  ]

  return (
    <div className="flex min-h-screen">
      {/* Сайдбар */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-background">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/admin" className="flex items-center gap-2 font-bold">
            <Package className="h-6 w-6" />
            <span>Админ-панель</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-auto py-4 px-3">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  {item.icon}
                  <span className="ml-3">{item.title}</span>
                </Button>
              </Link>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="space-y-1">
            <Link href="/">
              <Button variant="ghost" className="w-full justify-start">
                <LogOut className="h-5 w-5" />
                <span className="ml-3">Вернуться на сайт</span>
              </Button>
            </Link>
          </div>
        </nav>
      </aside>

      {/* Основной контент */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <Link href="/" className="lg:hidden">
            <Package className="h-6 w-6" />
            <span className="sr-only">Админ-панель</span>
          </Link>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
