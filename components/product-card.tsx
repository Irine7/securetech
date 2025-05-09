"use client"

import type React from "react"

import Image from "next/image"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/components/cart-provider"
import { useToast } from "@/components/ui/use-toast"

interface ProductCardProps {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  isNew?: boolean
}

export default function ProductCard({
  id,
  name,
  description,
  price,
  image,
  category,
  isNew = false,
}: ProductCardProps) {
  const { addToCart } = useCart()
  const { toast } = useToast()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()

    addToCart({
      id,
      name,
      price,
      image,
    })

    toast({
      title: "Товар добавлен в корзину",
      description: name,
      duration: 3000,
    })
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-white">
      <Link href={`/product/${id}`} className="absolute inset-0 z-10">
        <span className="sr-only">View {name}</span>
      </Link>
      {isNew && <Badge className="absolute top-2 right-2 z-20 bg-orange-500">New</Badge>}
      <div className="aspect-square overflow-hidden bg-gray-100 p-4">
        <Image
          src={image || "/placeholder-test.svg?height=200&width=200"}
          alt={name}
          className="object-cover h-[200px] w-full"
          width={200}
          height={200}
          priority
        />
      </div>
      <div className="p-4">
        <div className="text-xs text-muted-foreground">{category}</div>
        <h3 className="font-semibold mt-1">{name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{description}</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="font-semibold">{price.toLocaleString()} ₽</div>
          <Button size="sm" className="z-20 relative bg-orange-500 hover:bg-orange-600" onClick={handleAddToCart}>
            <ShoppingCart className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
    </div>
  )
}
