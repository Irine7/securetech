import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Экспортируем обработчики HTTP запросов для Next.js API Routes
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
