import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-200">
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Каталог</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/catalog/videocameras" className="text-gray-400 hover:text-white">
                  ВИДЕОКАМЕРЫ
                </Link>
              </li>
              <li>
                <Link href="/catalog/recorders" className="text-gray-400 hover:text-white">
                  РЕГИСТРАТОРЫ
                </Link>
              </li>
              <li>
                <Link href="/catalog/network" className="text-gray-400 hover:text-white">
                  СЕТЕВЫЕ РЕШЕНИЯ
                </Link>
              </li>
              <li>
                <Link href="/catalog/access" className="text-gray-400 hover:text-white">
                  КОНТРОЛЬ ДОСТУПА
                </Link>
              </li>
              <li>
                <Link href="/catalog/intercom" className="text-gray-400 hover:text-white">
                  ДОМОФОНИЯ
                </Link>
              </li>
              <li>
                <Link href="/catalog/entry" className="text-gray-400 hover:text-white">
                  ВЪЕЗД / ВЫЕЗД
                </Link>
              </li>
              <li>
                <Link href="/catalog/alarm" className="text-gray-400 hover:text-white">
                  ОХРАННАЯ СИГНАЛИЗАЦИЯ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Поддержка</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/support/resources" className="text-gray-400 hover:text-white">
                  ПОЛЕЗНЫЕ РЕСУРСЫ ДЛЯ СКАЧИВАНИЯ
                </Link>
              </li>
              <li>
                <Link href="/support/technical" className="text-gray-400 hover:text-white">
                  ТЕХНИЧЕСКАЯ ПОДДЕРЖКА
                </Link>
              </li>
              <li>
                <Link href="/support/marketing" className="text-gray-400 hover:text-white">
                  МАРКЕТИНГОВАЯ ПОДДЕРЖКА ПАРТНЕРОВ
                </Link>
              </li>
              <li>
                <Link href="/support/faq" className="text-gray-400 hover:text-white">
                  ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">О компании</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white">
                  О бренде
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-gray-400 hover:text-white">
                  Новости
                </Link>
              </li>
              <li>
                <Link href="/partners" className="text-gray-400 hover:text-white">
                  Партнерам
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="text-gray-400 hover:text-white">
                  Контакты
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Подписывайтесь на новости и акции</h3>
            <div className="flex gap-2">
              <Input type="email" placeholder="E-mail" className="bg-gray-800 border-gray-700 text-white" />
              <Button type="submit" variant="default" className="bg-orange-500 hover:bg-orange-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 12 14 0"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </Button>
            </div>
            <p className="text-xs mt-2 text-gray-400">
              Нажимая на кнопку, вы соглашаетесь на{" "}
              <Link href="/privacy" className="text-orange-500 hover:underline">
                обработку персональных данных
              </Link>
            </p>
            <div className="mt-4">
              <p className="text-sm text-gray-400">info@securetech.example</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800">
          <p className="text-xs text-gray-400 text-center">© 2025 SecureTech. Все права защищены.</p>
        </div>
      </div>
    </footer>
  )
}
