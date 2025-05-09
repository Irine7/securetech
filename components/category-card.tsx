import Image from "next/image"
import Link from "next/link"

interface CategoryCardProps {
  title: string
  description: string
  image: string
  href: string
}

export default function CategoryCard({ title, description, image, href }: CategoryCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg border bg-white">
      <Link href={href} className="absolute inset-0 z-10">
        <span className="sr-only">View {title}</span>
      </Link>
      <div className="aspect-square overflow-hidden bg-gray-100">
        <Image
          src={image || "/placeholder-test.svg"}
          alt={title}
          width={400}
          height={400}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
