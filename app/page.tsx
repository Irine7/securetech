import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import CategoryCard from "@/components/category-card"
import FeaturedProducts from "@/components/featured-products"
import { getCategories } from "@/app/actions/products"

export default async function Home() {
  const categories = await getCategories(6)

  return (
    <div className="flex min-h-screen flex-col">
      <main className="container mx-auto flex-1">
        <section className="relative">
          <div className="relative h-[300px] w-full overflow-hidden bg-gray-900">
            <Image
              src="/placeholder.svg?height=600&width=1200"
              alt="Security solutions"
              width={1200}
              height={600}
              className="absolute inset-0 h-full w-full object-cover opacity-70"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/70 to-gray-900/30" />
            <div className="relative container px-10 h-full flex flex-col justify-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white max-w-xl">
                Advanced Video Surveillance Solutions
              </h1>
              <p className="mt-4 max-w-md text-gray-200">Professional security systems for businesses and homes</p>
              <Button className="mt-6 w-fit bg-orange-500 hover:bg-orange-600" asChild>
                <Link href="/catalog">Explore Products</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Product Categories</h2>
                <p className="text-muted-foreground">Browse our comprehensive range of security solutions</p>
              </div>
              <Link href="/catalog" className="text-orange-500 font-medium text-sm mt-2 md:mt-0">
                View all
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  title={category.name}
                  description={category.description || ""}
                  image_url={category.image_url ?? undefined}
                  image="/placeholder.svg?height=300&width=400"
                  href={`/catalog?category=${category.id}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 bg-gray-50">
          <div className="container">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Featured Products</h2>
                <p className="text-muted-foreground">Our most popular surveillance equipment</p>
              </div>
              <Link href="/catalog" className="text-orange-500 font-medium text-sm mt-2 md:mt-0">
                View all
              </Link>
            </div>

            <Suspense fallback={<div className="text-center py-12">Loading featured products...</div>}>
              <FeaturedProducts />
            </Suspense>
          </div>
        </section>

        <section className="py-12">
          <div className="container">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Company News</h2>
                <p className="text-muted-foreground">Latest updates and events</p>
              </div>
              <Link href="/news" className="text-orange-500 font-medium text-sm mt-2 md:mt-0">
                All news
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="group rounded-lg overflow-hidden border">
                <div className="aspect-video overflow-hidden">
                  <Image
                    src="/placeholder.svg?height=300&width=500"
                    alt="Event announcement"
                    width={500}
                    height={300}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground">April 15, 2025</p>
                  <h3 className="font-semibold mt-1">New Product Line Announcement</h3>
                  <p className="text-sm mt-2 text-muted-foreground">
                    Introducing our latest generation of AI-powered surveillance cameras
                  </p>
                </div>
              </div>

              <div className="group rounded-lg overflow-hidden border">
                <div className="aspect-video overflow-hidden">
                  <Image
                    src="/placeholder.svg?height=300&width=500"
                    alt="Product catalog"
                    width={500}
                    height={300}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground">March 28, 2025</p>
                  <h3 className="font-semibold mt-1">2025 Product Catalog Released</h3>
                  <p className="text-sm mt-2 text-muted-foreground">
                    Download our comprehensive catalog of security solutions
                  </p>
                </div>
              </div>

              <div className="group rounded-lg overflow-hidden border">
                <div className="aspect-video overflow-hidden">
                  <Image
                    src="/placeholder.svg?height=300&width=500"
                    alt="Security exhibition"
                    width={500}
                    height={300}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground">February 10, 2025</p>
                  <h3 className="font-semibold mt-1">SecureTech at Global Security Expo</h3>
                  <p className="text-sm mt-2 text-muted-foreground">
                    Visit our booth at the world's leading security exhibition
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
