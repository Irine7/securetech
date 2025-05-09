import { db } from "../lib/db";

async function main() {
  console.log("Start seeding database with test data...");

  // Clean up existing data
  await db.productSpecification.deleteMany({});
  await db.productImage.deleteMany({});
  await db.product.deleteMany({});
  await db.specification.deleteMany({});
  await db.category.deleteMany({});

  // Create categories
  const camerasCategory = await db.category.create({
    data: {
      name: "Камеры видеонаблюдения",
      slug: "cameras",
      description: "Все типы камер для систем видеонаблюдения",
    },
  });

  const ipCamerasCategory = await db.category.create({
    data: {
      name: "IP-камеры",
      slug: "ip-cameras",
      description: "Современные IP-камеры для видеонаблюдения",
      parent_id: camerasCategory.id,
    },
  });

  const analogCamerasCategory = await db.category.create({
    data: {
      name: "Аналоговые камеры",
      slug: "analog-cameras", 
      description: "Традиционные аналоговые камеры видеонаблюдения",
      parent_id: camerasCategory.id,
    },
  });

  const doorbellsCategory = await db.category.create({
    data: {
      name: "Видеодомофоны",
      slug: "video-doorbell",
      description: "Системы видеодомофонов",
    },
  });

  // Create specifications
  const resolutionSpec = await db.specification.create({
    data: {
      name: "Разрешение",
      slug: "resolution",
    },
  });

  const bodyTypeSpec = await db.specification.create({
    data: {
      name: "Тип корпуса",
      slug: "body-type",
    },
  });

  const sensorSpec = await db.specification.create({
    data: {
      name: "Сенсор",
      slug: "sensor",
    },
  });

  const nightVisionSpec = await db.specification.create({
    data: {
      name: "Ночное видение",
      slug: "night-vision",
    },
  });

  // Create products
  const product1 = await db.product.create({
    data: {
      name: "IP-камера Hikvision DS-2CD2143G2-I",
      slug: "hikvision-ds-2cd2143g2-i",
      sku: "HIK-DS-2CD2143G2-I",
      description: "Купольная IP-камера Hikvision DS-2CD2143G2-I 4 Мп с ИК-подсветкой до 30 м, для внутренней и наружной установки. Высокое качество изображения и надежная работа даже в суровых условиях.",
      price: 7500,
      category_id: ipCamerasCategory.id,
      is_hit: true,
      in_stock: true,
      stock_quantity: 25,
      main_image: "/images/products/hikvision-ds-2cd2143g2-i.jpg",
    },
  });

  await db.productImage.createMany({
    data: [
      {
        product_id: product1.id,
        image_url: "/images/products/hikvision-ds-2cd2143g2-i.jpg",
        is_main: true,
        sort_order: 1,
      },
      {
        product_id: product1.id,
        image_url: "/images/products/hikvision-ds-2cd2143g2-i-2.jpg",
        is_main: false,
        sort_order: 2,
      },
    ],
  });

  await db.productSpecification.createMany({
    data: [
      {
        product_id: product1.id,
        specification_id: resolutionSpec.id,
        value: "4 Мп (2688 × 1520)",
      },
      {
        product_id: product1.id,
        specification_id: bodyTypeSpec.id,
        value: "Купольная",
      },
      {
        product_id: product1.id,
        specification_id: sensorSpec.id,
        value: "1/2.7\" Progressive Scan CMOS",
      },
      {
        product_id: product1.id,
        specification_id: nightVisionSpec.id,
        value: "До 30 метров",
      },
    ],
  });

  const product2 = await db.product.create({
    data: {
      name: "IP-камера Dahua IPC-HDW3441TMP-AS",
      slug: "dahua-ipc-hdw3441tmp-as",
      sku: "DAHUA-IPC-HDW3441TMP-AS",
      description: "Купольная IP-камера Dahua с разрешением 4 Мп, встроенным микрофоном и ИК-подсветкой до 50 м. Имеет встроенную аналитику и поддержку технологии Starlight для улучшенного ночного наблюдения.",
      price: 8200,
      category_id: ipCamerasCategory.id,
      is_hit: false,
      in_stock: true,
      stock_quantity: 15,
      main_image: "/images/products/dahua-ipc-hdw3441tmp-as.jpg",
    },
  });

  await db.productImage.createMany({
    data: [
      {
        product_id: product2.id,
        image_url: "/images/products/dahua-ipc-hdw3441tmp-as.jpg",
        is_main: true,
        sort_order: 1,
      },
      {
        product_id: product2.id,
        image_url: "/images/products/dahua-ipc-hdw3441tmp-as-2.jpg",
        is_main: false,
        sort_order: 2,
      },
    ],
  });

  await db.productSpecification.createMany({
    data: [
      {
        product_id: product2.id,
        specification_id: resolutionSpec.id,
        value: "4 Мп (2688 × 1520)",
      },
      {
        product_id: product2.id,
        specification_id: bodyTypeSpec.id,
        value: "Купольная",
      },
      {
        product_id: product2.id,
        specification_id: sensorSpec.id,
        value: "1/3\" CMOS",
      },
      {
        product_id: product2.id,
        specification_id: nightVisionSpec.id,
        value: "До 50 метров, Starlight",
      },
    ],
  });

  const product3 = await db.product.create({
    data: {
      name: "Аналоговая камера HiWatch DS-T209P",
      slug: "hiwatch-ds-t209p",
      sku: "HWT-DS-T209P",
      description: "Цилиндрическая уличная камера с поддержкой HD-TVI, AHD, CVI и CVBS форматов. Разрешение 2 Мп, ИК-подсветка до 40 метров и защита от воды и пыли IP67.",
      price: 3500,
      category_id: analogCamerasCategory.id,
      is_hit: true,
      in_stock: true,
      stock_quantity: 30,
      main_image: "/images/products/hiwatch-ds-t209p.jpg",
    },
  });

  await db.productImage.createMany({
    data: [
      {
        product_id: product3.id,
        image_url: "/images/products/hiwatch-ds-t209p.jpg",
        is_main: true,
        sort_order: 1,
      },
    ],
  });

  await db.productSpecification.createMany({
    data: [
      {
        product_id: product3.id,
        specification_id: resolutionSpec.id,
        value: "2 Мп (1920 × 1080)",
      },
      {
        product_id: product3.id,
        specification_id: bodyTypeSpec.id,
        value: "Цилиндрическая",
      },
      {
        product_id: product3.id,
        specification_id: nightVisionSpec.id,
        value: "До 40 метров",
      },
    ],
  });

  const product4 = await db.product.create({
    data: {
      name: "Видеодомофон Hikvision DS-KH6320-WTE1",
      slug: "hikvision-ds-kh6320-wte1",
      sku: "HIK-DS-KH6320-WTE1",
      description: "Внутренний монитор видеодомофона с 7-дюймовым сенсорным экраном, Wi-Fi, поддержкой мобильного приложения и функцией просмотра IP-камер.",
      price: 14500,
      category_id: doorbellsCategory.id,
      is_hit: false,
      in_stock: true,
      stock_quantity: 10,
      main_image: "/images/products/hikvision-ds-kh6320-wte1.jpg",
    },
  });

  await db.productImage.createMany({
    data: [
      {
        product_id: product4.id,
        image_url: "/images/products/hikvision-ds-kh6320-wte1.jpg",
        is_main: true,
        sort_order: 1,
      },
      {
        product_id: product4.id,
        image_url: "/images/products/hikvision-ds-kh6320-wte1-2.jpg",
        is_main: false,
        sort_order: 2,
      },
    ],
  });

  await db.productSpecification.createMany({
    data: [
      {
        product_id: product4.id,
        specification_id: resolutionSpec.id,
        value: "1024 × 600",
      },
    ],
  });

  console.log("Seeding database completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
