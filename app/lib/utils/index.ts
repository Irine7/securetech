/**
 * Преобразует строку в URL-slug
 * Например: "Категория товаров" -> "kategoriya-tovarov"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD') // Разложение символов с диакритикой
    .replace(/[\u0300-\u036f]/g, '') // Удаление диакритических знаков
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Замена пробелов на дефисы
    .replace(/[^\w\-]+/g, '') // Удаление всех не-слов (символов, отличных от букв, цифр и дефисов)
    .replace(/\-\-+/g, '-') // Замена нескольких дефисов на один
    .replace(/^-+/, '') // Удаление дефисов в начале строки
    .replace(/-+$/, ''); // Удаление дефисов в конце строки
}

/**
 * Форматирует цену с разделением тысяч и указанием валюты
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(price);
}

/**
 * Форматирует дату в локализованный формат
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Обрезает текст до указанной длины и добавляет многоточие
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Возвращает случайный ID для временных идентификаторов
 */
export function generateTempId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Задержка выполнения на указанное количество миллисекунд
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
