import { createUploadthing, type FileRouter } from "uploadthing/next";
 
const f = createUploadthing();
 
export const ourFileRouter = {
  // Определяем загрузчик для изображений продуктов
  productImage: f({ image: { maxFileSize: "4MB", maxFileCount: 4 } })
    .middleware(async () => {
      // Здесь можно добавить аутентификацию
      return { userId: "admin" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Загрузка завершена", metadata, file);
      
      return { 
        uploadedBy: metadata.userId,
        url: file.url 
      };
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;
